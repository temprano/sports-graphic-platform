import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkConsent, applyEnhancement } from './check-consent.js';

describe('checkConsent', () => {
  describe('consent flags from SCHEMA.md', () => {
    it('returns true when backgroundRemoval consent is explicitly true', () => {
      const consentLog = { backgroundRemoval: true };
      expect(checkConsent(consentLog, 'backgroundRemoval')).toBe(true);
    });

    it('returns true when colorAdjustment consent is explicitly true', () => {
      const consentLog = { colorAdjustment: true };
      expect(checkConsent(consentLog, 'colorAdjustment')).toBe(true);
    });

    it('returns true when poseAdjustment consent is explicitly true', () => {
      const consentLog = { poseAdjustment: true };
      expect(checkConsent(consentLog, 'poseAdjustment')).toBe(true);
    });

    it('returns true when aiMotion consent is explicitly true', () => {
      const consentLog = { aiMotion: true };
      expect(checkConsent(consentLog, 'aiMotion')).toBe(true);
    });

    it('returns true when marketingUse consent is explicitly true', () => {
      const consentLog = { marketingUse: true };
      expect(checkConsent(consentLog, 'marketingUse')).toBe(true);
    });
  });

  describe('missing flags default to false', () => {
    it('returns false when backgroundRemoval flag is missing', () => {
      const consentLog = { colorAdjustment: true };
      expect(checkConsent(consentLog, 'backgroundRemoval')).toBe(false);
    });

    it('returns false when colorAdjustment flag is missing', () => {
      const consentLog = { backgroundRemoval: true };
      expect(checkConsent(consentLog, 'colorAdjustment')).toBe(false);
    });

    it('returns false when poseAdjustment flag is missing', () => {
      const consentLog = { aiMotion: true };
      expect(checkConsent(consentLog, 'poseAdjustment')).toBe(false);
    });

    it('returns false when aiMotion flag is missing', () => {
      const consentLog = { poseAdjustment: true };
      expect(checkConsent(consentLog, 'aiMotion')).toBe(false);
    });

    it('returns false when marketingUse flag is missing', () => {
      const consentLog = { backgroundRemoval: true };
      expect(checkConsent(consentLog, 'marketingUse')).toBe(false);
    });

    it('returns false with empty consentLog', () => {
      const consentLog = {};
      expect(checkConsent(consentLog, 'backgroundRemoval')).toBe(false);
      expect(checkConsent(consentLog, 'colorAdjustment')).toBe(false);
      expect(checkConsent(consentLog, 'poseAdjustment')).toBe(false);
      expect(checkConsent(consentLog, 'aiMotion')).toBe(false);
      expect(checkConsent(consentLog, 'marketingUse')).toBe(false);
    });
  });

  describe('explicit false flags', () => {
    it('returns false when backgroundRemoval is explicitly false', () => {
      const consentLog = { backgroundRemoval: false };
      expect(checkConsent(consentLog, 'backgroundRemoval')).toBe(false);
    });

    it('returns false when colorAdjustment is explicitly false', () => {
      const consentLog = { colorAdjustment: false };
      expect(checkConsent(consentLog, 'colorAdjustment')).toBe(false);
    });

    it('returns false when poseAdjustment is explicitly false', () => {
      const consentLog = { poseAdjustment: false };
      expect(checkConsent(consentLog, 'poseAdjustment')).toBe(false);
    });

    it('returns false when aiMotion is explicitly false', () => {
      const consentLog = { aiMotion: false };
      expect(checkConsent(consentLog, 'aiMotion')).toBe(false);
    });

    it('returns false when marketingUse is explicitly false', () => {
      const consentLog = { marketingUse: false };
      expect(checkConsent(consentLog, 'marketingUse')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('treats null consentLog as no consent', () => {
      expect(checkConsent(null, 'backgroundRemoval')).toBe(false);
    });

    it('treats undefined consentLog as no consent', () => {
      expect(checkConsent(undefined, 'backgroundRemoval')).toBe(false);
    });

    it('handles mixed consent flags correctly', () => {
      const consentLog = {
        backgroundRemoval: true,
        colorAdjustment: true,
        poseAdjustment: false,
        aiMotion: false,
        marketingUse: true
      };
      expect(checkConsent(consentLog, 'backgroundRemoval')).toBe(true);
      expect(checkConsent(consentLog, 'colorAdjustment')).toBe(true);
      expect(checkConsent(consentLog, 'poseAdjustment')).toBe(false);
      expect(checkConsent(consentLog, 'aiMotion')).toBe(false);
      expect(checkConsent(consentLog, 'marketingUse')).toBe(true);
    });
  });
});

describe('applyEnhancement', () => {
  describe('when consent is true', () => {
    it('applies enhancement when backgroundRemoval consent is true', async () => {
      const consentLog = { backgroundRemoval: true };
      const primaryPath = vi.fn().mockResolvedValue({ result: 'enhanced' });
      const fallbackPath = vi.fn();

      const result = await applyEnhancement(
        'backgroundRemoval',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(primaryPath).toHaveBeenCalled();
      expect(fallbackPath).not.toHaveBeenCalled();
      expect(result).toEqual({ result: 'enhanced' });
    });

    it('applies enhancement when colorAdjustment consent is true', async () => {
      const consentLog = { colorAdjustment: true };
      const primaryPath = vi.fn().mockResolvedValue({ result: 'adjusted' });
      const fallbackPath = vi.fn();

      const result = await applyEnhancement(
        'colorAdjustment',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(primaryPath).toHaveBeenCalled();
      expect(fallbackPath).not.toHaveBeenCalled();
      expect(result).toEqual({ result: 'adjusted' });
    });

    it('applies enhancement when poseAdjustment consent is true', async () => {
      const consentLog = { poseAdjustment: true };
      const primaryPath = vi.fn().mockResolvedValue({ result: 'pose-enhanced' });
      const fallbackPath = vi.fn();

      const result = await applyEnhancement(
        'poseAdjustment',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(primaryPath).toHaveBeenCalled();
      expect(fallbackPath).not.toHaveBeenCalled();
    });

    it('applies enhancement when aiMotion consent is true', async () => {
      const consentLog = { aiMotion: true };
      const primaryPath = vi.fn().mockResolvedValue({ result: 'motion-synth' });
      const fallbackPath = vi.fn();

      const result = await applyEnhancement(
        'aiMotion',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(primaryPath).toHaveBeenCalled();
      expect(fallbackPath).not.toHaveBeenCalled();
    });

    it('applies enhancement when marketingUse consent is true', async () => {
      const consentLog = { marketingUse: true };
      const primaryPath = vi.fn().mockResolvedValue({ result: 'published' });
      const fallbackPath = vi.fn();

      const result = await applyEnhancement(
        'marketingUse',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(primaryPath).toHaveBeenCalled();
      expect(fallbackPath).not.toHaveBeenCalled();
    });
  });

  describe('when consent is false or missing', () => {
    it('uses fallback path when backgroundRemoval consent is false', async () => {
      const consentLog = { backgroundRemoval: false };
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({ result: 'fallback' });

      const result = await applyEnhancement(
        'backgroundRemoval',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(fallbackPath).toHaveBeenCalled();
      expect(primaryPath).not.toHaveBeenCalled();
      expect(result).toEqual({ result: 'fallback' });
    });

    it('uses fallback path when backgroundRemoval consent is missing', async () => {
      const consentLog = {};
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({ result: 'fallback' });

      const result = await applyEnhancement(
        'backgroundRemoval',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(fallbackPath).toHaveBeenCalled();
      expect(primaryPath).not.toHaveBeenCalled();
    });

    it('uses fallback path when poseAdjustment consent is false', async () => {
      const consentLog = { poseAdjustment: false };
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({ result: 'static-pose' });

      const result = await applyEnhancement(
        'poseAdjustment',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(fallbackPath).toHaveBeenCalled();
      expect(primaryPath).not.toHaveBeenCalled();
    });

    it('uses fallback path when aiMotion consent is false', async () => {
      const consentLog = { aiMotion: false };
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({ result: 'static-video' });

      const result = await applyEnhancement(
        'aiMotion',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(fallbackPath).toHaveBeenCalled();
      expect(primaryPath).not.toHaveBeenCalled();
    });

    it('uses fallback path when marketingUse consent is false', async () => {
      const consentLog = { marketingUse: false };
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({ result: 'private-only' });

      const result = await applyEnhancement(
        'marketingUse',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(fallbackPath).toHaveBeenCalled();
      expect(primaryPath).not.toHaveBeenCalled();
    });

    it('uses fallback path with null consentLog', async () => {
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({ result: 'fallback' });

      const result = await applyEnhancement(
        'backgroundRemoval',
        null,
        primaryPath,
        fallbackPath
      );

      expect(fallbackPath).toHaveBeenCalled();
      expect(primaryPath).not.toHaveBeenCalled();
    });

    it('uses fallback path with undefined consentLog', async () => {
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({ result: 'fallback' });

      const result = await applyEnhancement(
        'aiMotion',
        undefined,
        primaryPath,
        fallbackPath
      );

      expect(fallbackPath).toHaveBeenCalled();
      expect(primaryPath).not.toHaveBeenCalled();
    });
  });

  describe('fallback produces valid output', () => {
    it('fallback for backgroundRemoval returns valid result', async () => {
      const consentLog = { backgroundRemoval: false };
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({
        status: 'fallback',
        enhancement: 'none',
        originalPhoto: './photo.jpg'
      });

      const result = await applyEnhancement(
        'backgroundRemoval',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('fallback');
    });

    it('fallback for poseAdjustment returns valid result', async () => {
      const consentLog = { poseAdjustment: false };
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({
        status: 'static',
        pose: 'original',
        confidence: 1.0
      });

      const result = await applyEnhancement(
        'poseAdjustment',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('static');
    });

    it('fallback for aiMotion returns valid result (not an error)', async () => {
      const consentLog = { aiMotion: false };
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({
        status: 'static-render',
        frames: 1,
        duration: 0
      });

      const result = await applyEnhancement(
        'aiMotion',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(result).toBeDefined();
      expect(result.frames).toBe(1);
    });

    it('fallback for marketingUse returns valid result', async () => {
      const consentLog = { marketingUse: false };
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockResolvedValue({
        visibility: 'private',
        usageRestricted: true
      });

      const result = await applyEnhancement(
        'marketingUse',
        consentLog,
        primaryPath,
        fallbackPath
      );

      expect(result).toBeDefined();
      expect(result.visibility).toBe('private');
    });
  });

  describe('async error handling', () => {
    it('propagates errors from primary path', async () => {
      const consentLog = { backgroundRemoval: true };
      const error = new Error('Enhancement failed');
      const primaryPath = vi.fn().mockRejectedValue(error);
      const fallbackPath = vi.fn();

      await expect(
        applyEnhancement('backgroundRemoval', consentLog, primaryPath, fallbackPath)
      ).rejects.toThrow('Enhancement failed');

      expect(primaryPath).toHaveBeenCalled();
      expect(fallbackPath).not.toHaveBeenCalled();
    });

    it('propagates errors from fallback path', async () => {
      const consentLog = { backgroundRemoval: false };
      const error = new Error('Fallback failed');
      const primaryPath = vi.fn();
      const fallbackPath = vi.fn().mockRejectedValue(error);

      await expect(
        applyEnhancement('backgroundRemoval', consentLog, primaryPath, fallbackPath)
      ).rejects.toThrow('Fallback failed');

      expect(fallbackPath).toHaveBeenCalled();
    });
  });

  describe('all consent flags', () => {
    it('correctly routes all 5 flags to primary path when consented', async () => {
      const flags = ['backgroundRemoval', 'colorAdjustment', 'poseAdjustment', 'aiMotion', 'marketingUse'];
      const consentLog = {
        backgroundRemoval: true,
        colorAdjustment: true,
        poseAdjustment: true,
        aiMotion: true,
        marketingUse: true
      };

      for (const flag of flags) {
        const primaryPath = vi.fn().mockResolvedValue({ result: 'enhanced' });
        const fallbackPath = vi.fn();

        await applyEnhancement(flag, consentLog, primaryPath, fallbackPath);

        expect(primaryPath).toHaveBeenCalled();
        expect(fallbackPath).not.toHaveBeenCalled();
      }
    });

    it('correctly routes all 5 flags to fallback path when not consented', async () => {
      const flags = ['backgroundRemoval', 'colorAdjustment', 'poseAdjustment', 'aiMotion', 'marketingUse'];
      const consentLog = {
        backgroundRemoval: false,
        colorAdjustment: false,
        poseAdjustment: false,
        aiMotion: false,
        marketingUse: false
      };

      for (const flag of flags) {
        const primaryPath = vi.fn();
        const fallbackPath = vi.fn().mockResolvedValue({ result: 'fallback' });

        await applyEnhancement(flag, consentLog, primaryPath, fallbackPath);

        expect(fallbackPath).toHaveBeenCalled();
        expect(primaryPath).not.toHaveBeenCalled();
      }
    });
  });
});
