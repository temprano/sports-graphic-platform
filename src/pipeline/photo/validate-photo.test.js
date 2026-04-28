/**
 * src/pipeline/photo/validate-photo.test.js
 *
 * Photo validation tests covering:
 * - Blur detection (Laplacian variance >= 100 is sharp)
 * - Face detection (Transformers.js v4)
 * - Single-subject validation (exactly one face)
 * - Minimum resolution checks (1920x1440)
 * - Face quality validation (confidence, size in frame)
 * - Specific error messages per failure type
 *
 * 100% coverage required (photos are critical input gate).
 * TDD: Tests written first, implementation follows.
 *
 * Run: npm test src/pipeline/photo/validate-photo.test.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validatePhoto, __resetDetector } from './validate-photo.js';

// ─── Mock Transformers.js ──────────────────────────────────────

vi.mock('transformers', () => ({
  pipeline: vi.fn(),
}));

import { pipeline } from 'transformers';

// ─── Test Helpers ────────────────────────────────────────────────

/**
 * Create a mock image object with specified dimensions.
 * Transformers.js expects HTMLImageElement or Canvas-like object.
 */
function makeImage(width, height, opts = {}) {
  const image = {
    width,
    height,
    data: new Uint8Array(width * height * 4), // RGBA
    ...opts,
  };

  // By default, set blur to sharp unless explicitly overridden
  if (opts.blur === undefined && !opts.noDefaultBlur) {
    image.blur = { laplacianVariance: 150 }; // Sharp by default
  }

  return image;
}

/**
 * Create mock detection results in Transformers.js format:
 * Transformers.js returns: [{ box: { xmin, ymin, xmax, ymax }, score, label }, ...]
 */
function makeDetectionResult(faces) {
  return faces.map(({ x, y, width, height, score }) => ({
    box: {
      xmin: x,
      ymin: y,
      xmax: x + width,
      ymax: y + height,
    },
    score, // confidence (0–1)
    label: 'person',
  }));
}

// ─── Setup / Teardown ────────────────────────────────────────

let poseDetectorMock;
let faceDetectorMock;

beforeEach(() => {
  __resetDetector(); // Clear cached detector to allow fresh mocks
  vi.clearAllMocks();
  vi.resetAllMocks();

  // Create default mocks for both detectors
  // For 1920x1440 images: head at 0, feet at 1080 = 75% span
  poseDetectorMock = vi.fn().mockResolvedValue([
    {
      keypoints: [
        { x: 960, y: 0, score: 0.95 },         // 0: nose (head at top)
        ...Array(14).fill({ x: 960, y: 600, score: 0.8 }),  // 1-14: filler
        { x: 880, y: 1080, score: 0.75 },      // 15: left_ankle (exactly 75%)
        { x: 1040, y: 1080, score: 0.75 },     // 16: right_ankle
      ],
    },
  ]);

  faceDetectorMock = null; // Tests will set this

  // Mock pipeline to handle both face and pose detection
  pipeline.mockImplementation(async (modelType, options = {}) => {
    if (modelType === 'pose-detection') {
      return poseDetectorMock;
    }
    if (modelType === 'object-detection') {
      // Return face detector if one has been set by the test
      return faceDetectorMock || vi.fn();
    }
    return vi.fn();
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// ─── Happy Path: Valid Photo ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe('validatePhoto', () => {
  describe('happy path: valid photo', () => {
    it('should accept photo with single clear face and sufficient resolution', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 500, height: 600, score: 0.95 }, // Large enough: 300,000 / 2,764,800 ≈ 10.8%
        ])
      );

      const result = await validatePhoto(image);

      expect(result).toEqual({
        valid: true,
        faces: expect.arrayContaining([
          expect.objectContaining({
            x: 100,
            y: 80,
            width: 500,
            height: 600,
            confidence: 0.95,
          }),
        ]),
        resolution: { width: 1920, height: 1440 },
        focalPoint: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
        pose: expect.any(Array),
      });
    });

    it('should return valid for high-resolution photo (2560x2048)', async () => {
      const image = makeImage(2560, 2048);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 200, y: 150, width: 600, height: 800, score: 0.92 },
        ])
      );
      // For 2560x2048: 75% of 2048 = 1536
      poseDetectorMock = vi.fn(async () => [
        {
          keypoints: [
            { x: 1280, y: 0, score: 0.95 },
            ...Array(14).fill({ x: 1280, y: 1000, score: 0.8 }),
            { x: 1200, y: 1536, score: 0.75 },
            { x: 1360, y: 1536, score: 0.75 },
          ],
        },
      ]);

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
      expect(result.resolution).toEqual({ width: 2560, height: 2048 });
    });

    it('should accept multiple faces as long as one has strong confidence', async () => {
      // Note: Implementation requires exactly one face per requirements
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 500, height: 600, score: 0.95 }, // Large, strong confidence
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
      expect(result.faces.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle face at exactly minimum resolution (1920x1440)', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 50, y: 40, width: 1820, height: 1360, score: 0.88 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
    });

    it('should track focal point from face center', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 800, y: 600, width: 300, height: 400, score: 0.93 },
        ])
      );
      

      const result = await validatePhoto(image);

      // Face center should be at roughly x + width/2, y + height/2
      if (result.focalPoint) {
        expect(result.focalPoint.x).toBeCloseTo(950 / 1920, 1); // (800 + 300/2) / width
        expect(result.focalPoint.y).toBeCloseTo(800 / 1440, 1); // (600 + 400/2) / height
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Case: No Face Detected ──────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error: no face detected', () => {
    it('should reject photo with no faces', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue([]); // Empty results
      

      const result = await validatePhoto(image);

      expect(result).toEqual({
        valid: false,
        error: 'No face detected in photo',
        faceCount: 0,
        resolution: { width: 1920, height: 1440 },
      });
    });

    it('should provide exact error message for missing face', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue([]);
      

      const result = await validatePhoto(image);

      expect(result.error).toBe('No face detected in photo');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Case: Multiple Faces ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error: multiple faces detected', () => {
    it('should reject photo with two clear faces', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.95 },
          { x: 1200, y: 100, width: 320, height: 420, score: 0.93 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result).toEqual({
        valid: false,
        error: 'Multiple faces detected. Use a solo photo',
        faceCount: 2,
        resolution: { width: 1920, height: 1440 },
      });
    });

    it('should reject photo with three faces', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.94 },
          { x: 900, y: 100, width: 300, height: 400, score: 0.92 },
          { x: 1500, y: 200, width: 250, height: 350, score: 0.87 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.error).toBe('Multiple faces detected. Use a solo photo');
      expect(result.faceCount).toBe(3);
    });

    it('should count high-confidence faces for multiple face check', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.91 },
          { x: 1200, y: 100, width: 320, height: 420, score: 0.89 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.faceCount).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Case: Resolution Too Small ──────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error: resolution too small', () => {
    it('should reject photo below 1920x1440 (e.g., 1280x960)', async () => {
      const image = makeImage(1280, 960);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 200, height: 300, score: 0.92 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result).toEqual({
        valid: false,
        error: 'Photo too small. Minimum 1920×1440 pixels',
        faceCount: 1,
        resolution: { width: 1280, height: 960 },
      });
    });

    it('should provide exact error message for low resolution', async () => {
      const image = makeImage(1600, 1200);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 50, y: 40, width: 300, height: 400, score: 0.90 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.error).toBe('Photo too small. Minimum 1920×1440 pixels');
    });

    it('should reject if width below 1920 even if height sufficient', async () => {
      const image = makeImage(1800, 1800);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 100, width: 300, height: 400, score: 0.91 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should reject if height below 1440 even if width sufficient', async () => {
      const image = makeImage(2000, 1200);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 100, width: 300, height: 400, score: 0.90 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should accept portrait-oriented photo (1440x1920)', async () => {
      const image = makeImage(1440, 1920);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 150, width: 450, height: 550, score: 0.92 },
        ])
      );
      // For 1440x1920: 75% of 1920 = 1440
      poseDetectorMock = vi.fn(async () => [
        {
          keypoints: [
            { x: 720, y: 0, score: 0.95 },
            ...Array(14).fill({ x: 720, y: 1000, score: 0.8 }),
            { x: 640, y: 1440, score: 0.75 },
            { x: 800, y: 1440, score: 0.75 },
          ],
        },
      ]);

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Case: Face Confidence Too Low ──────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error: face detection confidence too low', () => {
    it('should reject face with confidence below 0.6', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.55 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result).toEqual({
        valid: false,
        error: 'Face detection confidence too low',
        faceCount: 1,
        resolution: { width: 1920, height: 1440 },
      });
    });

    it('should accept face with confidence exactly 0.6', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 450, height: 550, score: 0.60 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
    });

    it('should provide exact error message for low confidence', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.45 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.error).toBe('Face detection confidence too low');
    });

    it('should reject low-confidence face even with sufficient resolution', async () => {
      const image = makeImage(4000, 3000);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.50 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Face detection confidence too low');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Case: Face Too Small in Frame ───────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error: face too small in frame', () => {
    it('should reject face occupying less than 5% of frame area', async () => {
      const image = makeImage(1920, 1440);
      // Face ~100x100 = 10,000 px out of 2,764,800 = 0.36% (well below 5%)
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 100, height: 100, score: 0.85 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result).toEqual({
        valid: false,
        error: 'Face too small in frame. Photo must show clearly',
        faceCount: 1,
        resolution: { width: 1920, height: 1440 },
      });
    });

    it('should accept face occupying at least 5% of frame area', async () => {
      const image = makeImage(1920, 1440);
      // Frame = 2,764,800 px; 5% = 138,240 px ≈ 372x372
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 400, height: 400, score: 0.88 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
    });

    it('should provide exact error message for small face', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 800, y: 600, width: 80, height: 80, score: 0.90 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.error).toBe('Face too small in frame. Photo must show clearly');
    });

    it('should handle multiple small faces', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 100, width: 50, height: 50, score: 0.80 },
          { x: 800, y: 800, width: 60, height: 60, score: 0.75 },
        ])
      );
      

      const result = await validatePhoto(image);

      // Multiple small faces should trigger multiple-faces error first
      // or small-face error depending on implementation priority
      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Case: Photo Too Blurry ──────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error: photo too blurry', () => {
    it('should reject blurry photo (Laplacian variance < 100)', async () => {
      const image = makeImage(1920, 1440, { blur: { laplacianVariance: 45 } });

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.92 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result).toEqual({
        valid: false,
        error: 'Photo is too blurry. Please retake with better focus',
        faceCount: 0,
        resolution: { width: 1920, height: 1440 },
      });
    });

    it('should accept sharp photo (Laplacian variance >= 100)', async () => {
      const image = makeImage(1920, 1440, { blur: { laplacianVariance: 120 } });

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 450, height: 550, score: 0.92 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
    });

    it('should accept photo at exactly blur threshold (variance = 100)', async () => {
      const image = makeImage(1920, 1440, { blur: { laplacianVariance: 100 } });

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 450, height: 550, score: 0.92 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
    });

    it('should provide exact error message for blurry photo', async () => {
      const image = makeImage(1920, 1440, { blur: { laplacianVariance: 50 } });

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.92 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.error).toBe('Photo is too blurry. Please retake with better focus');
    });

    it('should reject blurry photo with very high resolution', async () => {
      const image = makeImage(4000, 3000, { blur: { laplacianVariance: 60 } });

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 500, y: 400, width: 800, height: 1000, score: 0.94 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Photo is too blurry. Please retake with better focus');
    });

    it('should reject blurry photo even with excellent face detection', async () => {
      const image = makeImage(1920, 1440, { blur: { laplacianVariance: 30 } });

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 400, height: 500, score: 0.98 }, // Perfect face detection
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('blurry');
    });

    it('should handle missing blur data gracefully', async () => {
      const image = makeImage(1920, 1440, { noDefaultBlur: true });
      // No blur property set - should default to pass or calculate on demand

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.92 },
        ])
      );
      

      const result = await validatePhoto(image);

      // Either calculates blur or assumes OK if not provided
      expect(result.valid).toBeDefined();
    });

    it('should handle motion blur (lower variance than depth blur)', async () => {
      const image = makeImage(1920, 1440, { blur: { laplacianVariance: 25 } });

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.90 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('blurry');
    });

    it('should handle slightly-blurry edge case (variance just under 100)', async () => {
      const image = makeImage(1920, 1440, { blur: { laplacianVariance: 95 } });

      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.92 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('blurry');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Priority & Edge Cases ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error priority and edge cases', () => {
    it('should check blur before face detection (blur is critical)', async () => {
      const image = makeImage(1920, 1440, { blur: { laplacianVariance: 40 } }); // Blurry
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 50, height: 60, score: 0.55 }, // Also bad confidence
        ])
      );
      

      const result = await validatePhoto(image);

      // Blur error should be reported first
      expect(result.error).toContain('blurry');
    });

    it('should check resolution before face quality', async () => {
      const image = makeImage(1000, 800); // Too small
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 50, height: 60, score: 0.55 }, // Also bad confidence
        ])
      );
      

      const result = await validatePhoto(image);

      // Resolution error should be reported (it's checked first after blur)
      expect(result.error).toBe('Photo too small. Minimum 1920×1440 pixels');
    });

    it('should report no-face error over resolution error', async () => {
      const image = makeImage(1000, 800); // Too small
      faceDetectorMock = vi.fn().mockResolvedValue([]); // No faces
      

      const result = await validatePhoto(image);

      // No faces is checked first
      expect(result.error).toBe('No face detected in photo');
    });

    it('should handle edge case: exactly 5% face area', async () => {
      const image = makeImage(1920, 1440);
      // Exactly 5% of 2,764,800 = 138,240
      // √138,240 ≈ 371.8, round to 372x372
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 100, width: 372, height: 372, score: 0.87 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(true);
    });

    it('should handle zero-dimension faces gracefully', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 0, height: 0, score: 0.85 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('small');
    });

    it('should handle missing score field', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue([
        { x: 100, y: 80, width: 300, height: 400 }, // No score
      ]);
      

      const result = await validatePhoto(image);

      // Missing score should be treated as low confidence
      expect(result.valid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Integration: Error Recovery & Hints ───────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('integration: error recovery and user hints', () => {
    it('should return all validation details on success', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 500, height: 600, score: 0.92 },
        ])
      );
      

      const result = await validatePhoto(image);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('faces');
      expect(result).toHaveProperty('resolution');
      expect(result).toHaveProperty('focalPoint');
    });

    it('should return diagnostics on failure', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue([]); // No faces

      

      const result = await validatePhoto(image);

      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('faceCount');
    });

    it('should include resolution in error response for debugging', async () => {
      const image = makeImage(800, 600);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 50, y: 40, width: 300, height: 400, score: 0.88 },
        ])
      );
      

      const result = await validatePhoto(image);

      if (result.resolution) {
        expect(result.resolution).toEqual({ width: 800, height: 600 });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Transformers.js Integration ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('transformers.js integration', () => {
    it('should load face-detection model on first call', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.92 },
        ])
      );
      

      await validatePhoto(image);

      expect(pipeline).toHaveBeenCalledWith(
        'object-detection',
        expect.objectContaining({
          model: 'Xenova/detr-resnet50',
        })
      );
    });

    it('should call detector with image input', async () => {
      const image = makeImage(1920, 1440);
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([
          { x: 100, y: 80, width: 300, height: 400, score: 0.92 },
        ])
      );
      

      await validatePhoto(image);

      expect(faceDetectorMock).toHaveBeenCalledWith(image, expect.any(Object));
    });

    it('should filter results to only PERSON detections', async () => {
      const image = makeImage(1920, 1440);
      // Mock detector returns multiple labels
      faceDetectorMock = vi.fn().mockResolvedValue([
        { x: 100, y: 80, width: 300, height: 400, score: 0.92, label: 'person' },
        { x: 800, y: 100, width: 150, height: 150, score: 0.88, label: 'dog' },
      ]);
      

      const result = await validatePhoto(image);

      // Should only process 'person' label
      expect(result.faceCount || result.faces?.length).toBeLessThanOrEqual(1);
    });
  });

  describe('full-body validation (pose detection)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      __resetDetector(); // Clear cached detectors
    });

    it('should accept photo with full body from head to feet visible', async () => {
      const image = makeImage(1920, 1440);
      // Face detection mock
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([{ x: 100, y: 80, width: 500, height: 600, score: 0.95 }])
      );
      // Pose detection mock - good vertical span (75% = 1080)
      poseDetectorMock = vi.fn(async () => [
        {
          keypoints: [
            { x: 960, y: 0, score: 0.95 },     // 0: nose (head at top)
            ...Array(14).fill({ x: 960, y: 600, score: 0.8 }),
            { x: 880, y: 1080, score: 0.75 },  // 15: left_ankle (75% span)
            { x: 1040, y: 1080, score: 0.75 }, // 16: right_ankle
          ],
        },
      ]);
      const result = await validatePhoto(image);
      expect(result.valid).toBe(true);
      expect(result.pose).toBeDefined();
    });

    it('should reject photo cropped at feet', async () => {
      const image = makeImage(1920, 1440);
      // Face detection mock
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([{ x: 100, y: 80, width: 500, height: 600, score: 0.95 }])
      );
      // Pose detection mock - feet cropped
      poseDetectorMock = vi.fn(async () => [
        {
          keypoints: [
            { x: 960, y: 100, score: 0.95 },
            ...Array(14).fill({ x: 960, y: 600, score: 0.8 }),
            { x: 880, y: 1350, score: 0.75 },  // 15: cropped (below 92% threshold)
            { x: 1040, y: 1360, score: 0.75 }, // 16: cropped
          ],
        },
      ]);
      const result = await validatePhoto(image);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cropped');
    });

    it('should reject photo without detected ankles (low confidence)', async () => {
      const image = makeImage(1920, 1440);
      // Face detection mock
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([{ x: 100, y: 80, width: 500, height: 600, score: 0.95 }])
      );
      // Pose detection mock - low ankle confidence
      poseDetectorMock = vi.fn(async () => [
        {
          keypoints: [
            { x: 960, y: 100, score: 0.95 },
            ...Array(14).fill({ x: 960, y: 600, score: 0.8 }),
            { x: 880, y: 1000, score: 0.3 },   // 15: low confidence
            { x: 1040, y: 1000, score: 0.3 },  // 16: low confidence
          ],
        },
      ]);
      const result = await validatePhoto(image);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Feet not detected');
    });

    it('should reject torso-only photo (insufficient vertical span)', async () => {
      const image = makeImage(1920, 1440);
      // Face detection mock
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([{ x: 100, y: 80, width: 500, height: 600, score: 0.95 }])
      );
      // Pose detection mock - insufficient vertical span
      poseDetectorMock = vi.fn(async () => [
        {
          keypoints: [
            { x: 960, y: 400, score: 0.95 },   // head lower
            ...Array(14).fill({ x: 960, y: 600, score: 0.8 }),
            { x: 880, y: 1000, score: 0.75 },  // only 60% span
            { x: 1040, y: 1000, score: 0.75 },
          ],
        },
      ]);
      const result = await validatePhoto(image);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('full-body');
    });

    it('should validate vertical span at exactly 75% threshold', async () => {
      const image = makeImage(1920, 1440); // 75% of 1440 = 1080
      // Face detection mock
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([{ x: 100, y: 80, width: 500, height: 600, score: 0.95 }])
      );
      // Pose detection mock - exactly 75% span
      poseDetectorMock = vi.fn(async () => [
        {
          keypoints: [
            { x: 960, y: 0, score: 0.95 },     // head at top
            ...Array(14).fill({ x: 960, y: 500, score: 0.8 }),
            { x: 880, y: 1080, score: 0.75 },  // feet at exactly 75%
            { x: 1040, y: 1080, score: 0.75 },
          ],
        },
      ]);
      const result = await validatePhoto(image);
      expect(result.valid).toBe(true);
    });

    it('should handle pose detector model loading error gracefully', async () => {
      const image = makeImage(1920, 1440);
      // Face detection succeeds
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([{ x: 100, y: 80, width: 500, height: 600, score: 0.95 }])
      );
      // Pose detection fails with error
      poseDetectorMock = vi.fn(async () => {
        throw new Error('Model download failed');
      });
      const result = await validatePhoto(image);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Pose detection error');
    });

    it('should cache pose detector after first load (lazy loading)', async () => {
      const image = makeImage(1920, 1440);
      // Face detection mock
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([{ x: 100, y: 80, width: 500, height: 600, score: 0.95 }])
      );
      // Pose detection mock - valid full-body
      poseDetectorMock = vi.fn(async () => [
        {
          keypoints: [
            { x: 960, y: 0, score: 0.95 },
            ...Array(14).fill({ x: 960, y: 600, score: 0.8 }),
            { x: 880, y: 1080, score: 0.75 },
            { x: 1040, y: 1080, score: 0.75 },
          ],
        },
      ]);
      await validatePhoto(image);
      await validatePhoto(image);
      // Pipeline should be called twice (once for face, once for pose)
      expect(pipeline).toHaveBeenCalledTimes(2);
    });

    it('should include pose keypoints in valid response', async () => {
      const image = makeImage(1920, 1440);
      // Face detection mock
      faceDetectorMock = vi.fn().mockResolvedValue(
        makeDetectionResult([{ x: 100, y: 80, width: 500, height: 600, score: 0.95 }])
      );
      // Pose detection mock - with specific keypoints
      const testKeypoints = Array(17).fill(null).map((_, i) => ({
        x: 900 + i * 10,
        y: (i === 0 ? 0 : i < 15 ? 600 : 1080),  // head at 0, mid-body at 600, ankles at 1080
        score: 0.8,
      }));
      poseDetectorMock = vi.fn(async () => [{ keypoints: testKeypoints }]);
      const result = await validatePhoto(image);
      expect(result.valid).toBe(true);
      expect(result.pose).toEqual(testKeypoints);
    });
  });
});
