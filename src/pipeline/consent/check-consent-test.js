/**
 * src/pipeline/consent/check-consent.test.js
 *
 * Tests for the consent gate — every flag, every edge case.
 * Run: npm run test
 */

import { describe, it, expect, vi } from 'vitest';
import {
  checkConsent,
  applyWithConsent,
  consentSummary,
  CONSENT_FLAGS,
} from './check-consent.js';

// ─── Helpers ──────────────────────────────────────────────────────

function makeConsent(overrides = {}) {
  return {
    flags: {
      backgroundRemoval: false,
      colorAdjustment:   false,
      poseAdjustment:    false,
      aiMotion:          false,
      marketingUse:      false,
      ...overrides,
    },
  };
}

// ─── checkConsent ─────────────────────────────────────────────────

describe('checkConsent', () => {

  describe('returns true only when flag is explicitly true', () => {
    Object.values(CONSENT_FLAGS).forEach(flag => {
      it(`returns true for ${flag} when explicitly set`, () => {
        const consent = makeConsent({ [flag]: true });
        expect(checkConsent(consent, flag)).toBe(true);
      });

      it(`returns false for ${flag} when explicitly false`, () => {
        const consent = makeConsent({ [flag]: false });
        expect(checkConsent(consent, flag)).toBe(false);
      });

      it(`returns false for ${flag} when absent`, () => {
        const consent = { flags: {} };
        expect(checkConsent(consent, flag)).toBe(false);
      });
    });
  });

  it('returns false when consentLog is null', () => {
    expect(checkConsent(null, CONSENT_FLAGS.AI_MOTION)).toBe(false);
  });

  it('returns false when consentLog is undefined', () => {
    expect(checkConsent(undefined, CONSENT_FLAGS.AI_MOTION)).toBe(false);
  });

  it('returns false when flags object is missing', () => {
    expect(checkConsent({}, CONSENT_FLAGS.AI_MOTION)).toBe(false);
  });

  it('accepts JSON string input and parses correctly', () => {
    const consent = JSON.stringify(makeConsent({ backgroundRemoval: true }));
    expect(checkConsent(consent, CONSENT_FLAGS.BACKGROUND_REMOVAL)).toBe(true);
  });

  it('throws for unknown flag name', () => {
    const consent = makeConsent();
    expect(() => checkConsent(consent, 'unknownFlag')).toThrow('unknown flag');
  });

  it('never coerces truthy values — only strict true', () => {
    const consent = { flags: { aiMotion: 1 } };       // numeric 1, not boolean
    expect(checkConsent(consent, CONSENT_FLAGS.AI_MOTION)).toBe(false);
  });

  it('never coerces truthy strings — only strict true', () => {
    const consent = { flags: { aiMotion: 'yes' } };
    expect(checkConsent(consent, CONSENT_FLAGS.AI_MOTION)).toBe(false);
  });
});

// ─── applyWithConsent ─────────────────────────────────────────────

describe('applyWithConsent', () => {

  it('calls enhanceFn when consent is true', async () => {
    const consent = makeConsent({ poseAdjustment: true });
    const enhanceFn  = vi.fn().mockResolvedValue('enhanced');
    const fallbackFn = vi.fn().mockResolvedValue('fallback');

    const result = await applyWithConsent(
      consent, CONSENT_FLAGS.POSE_ADJUSTMENT, enhanceFn, fallbackFn
    );

    expect(enhanceFn).toHaveBeenCalledOnce();
    expect(fallbackFn).not.toHaveBeenCalled();
    expect(result).toBe('enhanced');
  });

  it('calls fallbackFn when consent is false', async () => {
    const consent = makeConsent({ poseAdjustment: false });
    const enhanceFn  = vi.fn().mockResolvedValue('enhanced');
    const fallbackFn = vi.fn().mockResolvedValue('fallback');

    const result = await applyWithConsent(
      consent, CONSENT_FLAGS.POSE_ADJUSTMENT, enhanceFn, fallbackFn
    );

    expect(fallbackFn).toHaveBeenCalledOnce();
    expect(enhanceFn).not.toHaveBeenCalled();
    expect(result).toBe('fallback');
  });

  it('calls fallbackFn when consent is absent', async () => {
    const consent = { flags: {} };
    const enhanceFn  = vi.fn().mockResolvedValue('enhanced');
    const fallbackFn = vi.fn().mockResolvedValue('fallback');

    const result = await applyWithConsent(
      consent, CONSENT_FLAGS.AI_MOTION, enhanceFn, fallbackFn
    );

    expect(fallbackFn).toHaveBeenCalledOnce();
    expect(result).toBe('fallback');
  });

  it('calls fallbackFn when consentLog is null', async () => {
    const enhanceFn  = vi.fn().mockResolvedValue('enhanced');
    const fallbackFn = vi.fn().mockResolvedValue('fallback');

    const result = await applyWithConsent(
      null, CONSENT_FLAGS.AI_MOTION, enhanceFn, fallbackFn
    );

    expect(fallbackFn).toHaveBeenCalledOnce();
    expect(result).toBe('fallback');
  });

  it('fallback produces valid output — not an error', async () => {
    const consent = makeConsent({ aiMotion: false });
    const fallbackFn = vi.fn().mockResolvedValue({ path: 'static-render.mp4', type: 'static' });

    const result = await applyWithConsent(
      consent, CONSENT_FLAGS.AI_MOTION,
      vi.fn(),
      fallbackFn
    );

    expect(result).toEqual({ path: 'static-render.mp4', type: 'static' });
  });

  it('propagates errors from enhanceFn', async () => {
    const consent = makeConsent({ backgroundRemoval: true });
    const enhanceFn = vi.fn().mockRejectedValue(new Error('ComfyUI timeout'));

    await expect(
      applyWithConsent(consent, CONSENT_FLAGS.BACKGROUND_REMOVAL, enhanceFn, vi.fn())
    ).rejects.toThrow('ComfyUI timeout');
  });

  it('propagates errors from fallbackFn', async () => {
    const consent = makeConsent({ backgroundRemoval: false });
    const fallbackFn = vi.fn().mockRejectedValue(new Error('Fallback failed'));

    await expect(
      applyWithConsent(consent, CONSENT_FLAGS.BACKGROUND_REMOVAL, vi.fn(), fallbackFn)
    ).rejects.toThrow('Fallback failed');
  });
});

// ─── consentSummary ───────────────────────────────────────────────

describe('consentSummary', () => {

  it('returns all flags with correct values', () => {
    const consent = makeConsent({ backgroundRemoval: true, colorAdjustment: true });
    const summary = consentSummary(consent);

    expect(summary).toEqual({
      backgroundRemoval: true,
      colorAdjustment:   true,
      poseAdjustment:    false,
      aiMotion:          false,
      marketingUse:      false,
    });
  });

  it('returns all false when consent log is empty', () => {
    const summary = consentSummary({ flags: {} });

    Object.values(summary).forEach(val => {
      expect(val).toBe(false);
    });
  });

  it('includes every flag defined in CONSENT_FLAGS', () => {
    const summary = consentSummary(makeConsent());
    const summaryKeys = Object.keys(summary);
    const flagValues  = Object.values(CONSENT_FLAGS);

    flagValues.forEach(flag => {
      expect(summaryKeys).toContain(flag);
    });
  });
});