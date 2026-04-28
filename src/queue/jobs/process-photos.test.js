/**
 * src/queue/jobs/process-photos.test.js
 *
 * Tests for the photo processing job.
 * Covers: consent checking, BiRefNet integration, fallback paths,
 * error handling, and Appwrite updates.
 *
 * Run: npm test src/queue/jobs/process-photos.test.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from './process-photos.js';
import { CONSENT_FLAGS } from '../../pipeline/consent/check-consent.js';
import { readFileSync } from 'fs';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

vi.mock('../../pipeline/comfyui-client.js', () => ({
  removeBackground: vi.fn(),
  isReachable: vi.fn(),
}));

vi.mock('../../pipeline/consent/check-consent.js', () => ({
  checkConsent: vi.fn(),
  CONSENT_FLAGS: {
    BACKGROUND_REMOVAL: 'backgroundRemoval',
    COLOR_ADJUSTMENT: 'colorAdjustment',
    POSE_ADJUSTMENT: 'poseAdjustment',
    AI_MOTION: 'aiMotion',
    MARKETING_USE: 'marketingUse',
  },
}));

vi.mock('../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../appwrite/crud.js', () => ({
  createPlayer: vi.fn(),
  updatePlayer: vi.fn(),
  getPlayer: vi.fn(),
}));

import { removeBackground, isReachable } from '../../pipeline/comfyui-client.js';
import { checkConsent } from '../../pipeline/consent/check-consent.js';
import { logger } from '../../lib/logger.js';

// ─── Test Helpers ────────────────────────────────────────────────

function makeTeamJson(playerOverrides = {}) {
  return JSON.stringify({
    schemaVersion: '1.0',
    orderId: 'ord_test_001',
    team: 'Test Hawks',
    sport: 'basketball',
    brand: 'cinematic-dark',
    players: [
      {
        id: 'player_001',
        slug: 'jordan-smith',
        name: 'Jordan Smith',
        firstName: 'Jordan',
        lastName: 'Smith',
        number: '12',
        position: 'Point Guard',
        year: 'Senior',
        photo: {
          original: './photos/smith_original.png',
          cutout: './photos/smith_cutout.png',
          focalPoint: { x: 0.5, y: 0.3 },
        },
        stats: { ppg: 18.4, apg: 6.1 },
        consentLog: {
          backgroundRemoval: true,
          colorAdjustment: false,
          poseAdjustment: false,
          aiMotion: false,
          marketingUse: false,
        },
        ...playerOverrides,
      },
    ],
  });
}

function makeJobData(overrides = {}) {
  return {
    orderId: 'ord_test_001',
    teamJsonPath: '/tmp/team.json',
    assetsPath: '/assets',
    ...overrides,
  };
}

// ─── Setup / Teardown ────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  checkConsent.mockImplementation((consentLog, flag) => {
    return consentLog?.flags?.[flag] === true;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// ─── Happy Path: Background Removal Applied ────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe('process-photos job', () => {
  describe('happy path: background removal with consent', () => {
    it('should load team.json and process all players', async () => {
      readFileSync.mockReturnValue(makeTeamJson());
      isReachable.mockResolvedValue(true);
      removeBackground.mockResolvedValue('/assets/jordan-smith_cutout.png');

      const result = await run(makeJobData());

      expect(result.orderId).toBe('ord_test_001');
      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.players[0].status).toBe('processed');
    });

    it('should apply BiRefNet when consent granted and ComfyUI ready', async () => {
      readFileSync.mockReturnValue(makeTeamJson());
      isReachable.mockResolvedValue(true);
      removeBackground.mockResolvedValue('/assets/jordan-smith_cutout.png');

      const result = await run(makeJobData());

      expect(removeBackground).toHaveBeenCalledWith(
        '/assets/./photos/smith_original.png',
        '/assets/jordan-smith_cutout.png'
      );
      expect(result.players[0].consentApplied).toBe(true);
      expect(result.players[0].cutoutPath).toBe('/assets/jordan-smith_cutout.png');
    });

    it('should process multiple players independently', async () => {
      const teamJson = JSON.stringify({
        schemaVersion: '1.0',
        orderId: 'ord_test_001',
        team: 'Test Hawks',
        sport: 'basketball',
        players: [
          {
            id: 'player_001',
            slug: 'player-one',
            photo: { original: './photos/one.png' },
            consentLog: { backgroundRemoval: true },
          },
          {
            id: 'player_002',
            slug: 'player-two',
            photo: { original: './photos/two.png' },
            consentLog: { backgroundRemoval: false },
          },
        ],
      });

      readFileSync.mockReturnValue(teamJson);
      isReachable.mockResolvedValue(true);
      removeBackground.mockResolvedValue('/assets/output.png');

      const result = await run(makeJobData());

      expect(result.processedCount).toBe(2);
      expect(result.players[0].consentApplied).toBe(true); // consent granted
      expect(result.players[1].consentApplied).toBe(false); // consent not granted
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Consent & Fallback Paths ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('consent and fallback paths', () => {
    it('should use original photo when consent not granted', async () => {
      const teamJson = makeTeamJson({
        consentLog: { backgroundRemoval: false },
      });
      readFileSync.mockReturnValue(teamJson);
      isReachable.mockResolvedValue(true);

      const result = await run(makeJobData());

      expect(removeBackground).not.toHaveBeenCalled();
      expect(result.players[0].cutoutPath).toBe('./photos/smith_original.png');
      expect(result.players[0].consentApplied).toBe(false);
    });

    it('should use original photo when ComfyUI unreachable', async () => {
      readFileSync.mockReturnValue(makeTeamJson());
      isReachable.mockResolvedValue(false);

      const result = await run(makeJobData());

      expect(removeBackground).not.toHaveBeenCalled();
      expect(result.players[0].cutoutPath).toBe('./photos/smith_original.png');
      expect(result.players[0].consentApplied).toBe(false);
    });

    it('should fallback to original if BiRefNet fails', async () => {
      readFileSync.mockReturnValue(makeTeamJson());
      isReachable.mockResolvedValue(true);
      removeBackground.mockRejectedValue(new Error('BiRefNet timeout'));

      const result = await run(makeJobData());

      expect(result.players[0].cutoutPath).toBe('./photos/smith_original.png');
      expect(result.players[0].status).toBe('processed');
      expect(result.failedCount).toBe(0); // Job doesn't fail, just falls back
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Handling & Resilience ──────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error handling and resilience', () => {
    it('should reject if teamJsonPath is missing', async () => {
      await expect(
        run(makeJobData({ teamJsonPath: null }))
      ).rejects.toThrow('Missing required job data');
    });

    it('should reject if team.json not found', async () => {
      readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file');
      });

      await expect(run(makeJobData())).rejects.toThrow('Failed to load team.json');
    });

    it('should reject if team.json is invalid JSON', async () => {
      readFileSync.mockReturnValue('{ invalid json }');

      await expect(run(makeJobData())).rejects.toThrow('Failed to load team.json');
    });

    it('should reject if team.json missing players array', async () => {
      readFileSync.mockReturnValue(
        JSON.stringify({
          schemaVersion: '1.0',
          orderId: 'ord_001',
          // missing players
        })
      );

      await expect(run(makeJobData())).rejects.toThrow('missing players array');
    });

    it('should skip player if missing photo.original', async () => {
      const teamJson = JSON.stringify({
        schemaVersion: '1.0',
        orderId: 'ord_001',
        players: [
          {
            id: 'player_001',
            slug: 'player-one',
            photo: {}, // missing original
            consentLog: { backgroundRemoval: true },
          },
        ],
      });

      readFileSync.mockReturnValue(teamJson);
      isReachable.mockResolvedValue(true);

      const result = await run(makeJobData());

      expect(result.failedCount).toBe(1);
      expect(result.players[0].status).toBe('failed');
      expect(result.players[0].error).toContain('missing original photo path');
    });

    it('should continue processing if one player fails', async () => {
      const teamJson = JSON.stringify({
        schemaVersion: '1.0',
        orderId: 'ord_001',
        players: [
          {
            id: 'player_001',
            slug: 'player-one',
            photo: { original: './photos/one.png' },
            consentLog: { backgroundRemoval: true },
          },
          {
            id: 'player_002',
            slug: 'player-two',
            photo: {}, // missing original — will fail
            consentLog: { backgroundRemoval: true },
          },
          {
            id: 'player_003',
            slug: 'player-three',
            photo: { original: './photos/three.png' },
            consentLog: { backgroundRemoval: false },
          },
        ],
      });

      readFileSync.mockReturnValue(teamJson);
      isReachable.mockResolvedValue(true);
      removeBackground.mockResolvedValue('/assets/output.png');

      const result = await run(makeJobData());

      expect(result.processedCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.players[1].status).toBe('failed');
    });

    it('should handle consent log being null gracefully', async () => {
      const teamJson = JSON.stringify({
        schemaVersion: '1.0',
        orderId: 'ord_001',
        players: [
          {
            id: 'player_001',
            slug: 'player-one',
            photo: { original: './photos/one.png' },
            consentLog: null, // null consent
          },
        ],
      });

      readFileSync.mockReturnValue(teamJson);
      isReachable.mockResolvedValue(true);

      const result = await run(makeJobData());

      expect(result.players[0].status).toBe('processed');
      expect(result.players[0].consentApplied).toBe(false);
      expect(result.players[0].cutoutPath).toBe('./photos/one.png');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Job Result Summary ────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('job result summary', () => {
    it('should return summary with correct counts', async () => {
      const teamJson = JSON.stringify({
        schemaVersion: '1.0',
        orderId: 'ord_test_001', // Match the job data orderId
        players: Array.from({ length: 5 }, (_, i) => ({
          id: `player_${i + 1}`,
          slug: `player-${i + 1}`,
          photo: { original: `./photos/${i + 1}.png` },
          consentLog: { backgroundRemoval: i % 2 === 0 },
        })),
      });

      readFileSync.mockReturnValue(teamJson);
      isReachable.mockResolvedValue(true);
      removeBackground.mockResolvedValue('/assets/output.png');

      const result = await run(makeJobData());

      expect(result.orderId).toBe('ord_test_001');
      expect(result.processedCount).toBe(5);
      expect(result.failedCount).toBe(0);
      expect(result.players).toHaveLength(5);
    });

    it('should log all processing events', async () => {
      readFileSync.mockReturnValue(makeTeamJson());
      isReachable.mockResolvedValue(true);
      removeBackground.mockResolvedValue('/assets/output.png');

      await run(makeJobData());

      expect(logger.info).toHaveBeenCalledWith(
        'Processing photos for order',
        expect.objectContaining({
          orderId: 'ord_test_001',
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Photo processing complete',
        expect.any(Object)
      );
    });

    it('should log warning if ComfyUI unreachable', async () => {
      readFileSync.mockReturnValue(makeTeamJson());
      isReachable.mockResolvedValue(false);

      await run(makeJobData());

      expect(logger.warn).toHaveBeenCalledWith(
        'ComfyUI not reachable — will use fallback paths',
        expect.any(Object)
      );
    });

    it('should log error for failed player processing', async () => {
      readFileSync.mockReturnValue(
        JSON.stringify({
          schemaVersion: '1.0',
          orderId: 'ord_001',
          players: [
            {
              id: 'player_001',
              slug: 'player-one',
              photo: {}, // will cause error
              consentLog: { backgroundRemoval: true },
            },
          ],
        })
      );
      isReachable.mockResolvedValue(true);

      await run(makeJobData());

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to process player',
        expect.objectContaining({
          orderId: 'ord_test_001',
          playerId: 'player_001',
        })
      );
    });
  });
});
