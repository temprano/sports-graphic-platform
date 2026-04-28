/**
 * src/pipeline/comfyui-client.test.js
 *
 * ComfyUI client tests covering:
 * - Background removal via BiRefNet (primary workflow)
 * - Health checks and connectivity
 * - Error handling (API failures, timeouts, invalid inputs)
 * - Workflow submission and polling
 * - Output validation
 *
 * 100% coverage required (image processing is critical path).
 * TDD: Tests written first, implementation follows.
 *
 * Run: npm test src/pipeline/comfyui-client.test.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { removeBackground, adjustPose, isReachable } from './comfyui-client.js';

// ─── Mock Config & Fetch ──────────────────────────────────────────

vi.mock('../config.js', () => ({
  config: {
    comfyui: {
      baseUrl: 'http://localhost:8188',
      timeout: 300000, // 5 minutes
      pollInterval: 1000, // 1 second
    },
  },
}));

global.fetch = vi.fn();

// ─── Test Helpers ────────────────────────────────────────────────

/**
 * Create mock file data for testing (base64-encoded PNG stub)
 */
function makePngBuffer(width = 512, height = 512) {
  // Minimal valid PNG header + data
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  ]);
  // Simplified: just return a buffer large enough to pass basic checks
  return Buffer.concat([pngHeader, Buffer.alloc(1000)]);
}

/**
 * Mock successful ComfyUI queue submission response
 */
function mockQueueResponse(promptId = 'test-prompt-123') {
  return {
    prompt_id: promptId,
    number: 1,
  };
}

/**
 * Mock successful ComfyUI status poll response (completed)
 */
function mockStatusCompleted(outputPath = '/tmp/output.png') {
  return {
    type: 'status',
    data: {
      status: {
        queue_pending: 0,
        queue_running: 0,
      },
    },
    sid: 'session-123',
  };
}

/**
 * Mock successful execution history response
 */
function mockHistoryResponse(promptId = 'test-prompt-123') {
  return {
    [promptId]: {
      outputs: {
        '6': {
          images: [{ filename: 'output_123.png', subfolder: '', type: 'output' }],
        },
      },
      status: {
        status_str: 'success',
        completed: true,
      },
    },
  };
}

// ─── Setup / Teardown ────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// ─── Happy Path: Background Removal ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe('removeBackground', () => {
  describe('happy path: successful background removal', () => {
    it('should submit BiRefNet workflow to ComfyUI queue', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => makePngBuffer().buffer,
        });

      const result = await removeBackground(
        '/input/photo.png',
        '/output/cutout.png'
      );

      // Should have called queue endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/prompt'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.any(String),
        })
      );
    });

    it('should return output path on successful removal', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => makePngBuffer().buffer,
        });

      const result = await removeBackground(
        '/input/photo.png',
        '/output/cutout.png'
      );

      expect(result).toBe('/output/cutout.png');
    });

    it('should download cutout image from ComfyUI output folder', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => makePngBuffer().buffer,
        });

      await removeBackground('/input/photo.png', '/output/cutout.png');

      // Should call view endpoint to download
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/view'),
        expect.any(Object)
      );
    });

    it('should poll for completion before downloading', async () => {
      const pollCalls = [];

      global.fetch
        .mockImplementationOnce(async (url) => {
          if (url.includes('/prompt')) {
            return {
              ok: true,
              json: async () => mockQueueResponse(),
            };
          }
        })
        .mockImplementationOnce(async (url) => {
          if (url.includes('/history')) {
            pollCalls.push(url);
            return {
              ok: true,
              json: async () => mockHistoryResponse(),
            };
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => makePngBuffer().buffer,
        });

      await removeBackground('/input/photo.png', '/output/cutout.png');

      // History endpoint should be called to check status
      expect(pollCalls.length).toBeGreaterThan(0);
    });

    it('should use correct BiRefNet model in workflow', async () => {
      let submittedPrompt = null;

      global.fetch
        .mockImplementationOnce(async (url, opts) => {
          if (url.includes('/prompt')) {
            submittedPrompt = JSON.parse(opts.body);
            return {
              ok: true,
              json: async () => mockQueueResponse(),
            };
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => makePngBuffer().buffer,
        });

      await removeBackground('/input/photo.png', '/output/cutout.png');

      // Prompt should contain BiRefNet model reference
      expect(submittedPrompt).toBeDefined();
      expect(JSON.stringify(submittedPrompt).toLowerCase()).toContain(
        'birefnet'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Case: API Failures ──────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error: ComfyUI API failures', () => {
    it('should reject when ComfyUI is unreachable', async () => {
      global.fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        removeBackground('/input/photo.png', '/output/cutout.png')
      ).rejects.toThrow();
    });

    it('should reject when queue submission fails (500)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        removeBackground('/input/photo.png', '/output/cutout.png')
      ).rejects.toThrow();
    });

    it('should reject when history endpoint returns error', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error',
          status: 500,
        });

      await expect(
        removeBackground('/input/photo.png', '/output/cutout.png')
      ).rejects.toThrow();
    }, { timeout: 10000 });

    it('should reject when output download fails', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse(),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      await expect(
        removeBackground('/input/photo.png', '/output/cutout.png')
      ).rejects.toThrow();
    });

    it('should timeout if workflow does not complete within 5 minutes', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({ 'test-prompt-123': { status: { completed: false } } }),
        });

      await expect(
        removeBackground('/input/photo.png', '/output/cutout.png')
      ).rejects.toThrow(/did not complete|timeout/i);
    }, { timeout: 360000 });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Error Case: Invalid Inputs ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('error: invalid inputs', () => {
    it('should reject missing input path', async () => {
      await expect(
        removeBackground(null, '/output/cutout.png')
      ).rejects.toThrow();
    });

    it('should reject missing output path', async () => {
      await expect(removeBackground('/input/photo.png', null)).rejects.toThrow();
    });

    it('should reject invalid file paths', async () => {
      await expect(
        removeBackground('', '/output/cutout.png')
      ).rejects.toThrow();
    });

    it('should reject if workflow has no outputs', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'test-prompt-123': {
              outputs: {},
              status: { completed: true },
            },
          }),
        });

      await expect(
        removeBackground('/input/photo.png', '/output/cutout.png')
      ).rejects.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ─── Edge Cases & Resilience ──────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  describe('edge cases and resilience', () => {
    it('should handle workflow with multiple outputs (use first)', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'test-prompt-123': {
              outputs: {
                '6': {
                  images: [
                    { filename: 'output_1.png', type: 'output' },
                    { filename: 'output_2.png', type: 'output' },
                  ],
                },
              },
              status: { completed: true },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => makePngBuffer().buffer,
        });

      const result = await removeBackground(
        '/input/photo.png',
        '/output/cutout.png'
      );

      expect(result).toBe('/output/cutout.png');
    });

    it('should retry on temporary network failure', async () => {
      let callCount = 0;

      global.fetch.mockImplementation(async (url) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('ECONNRESET');
        }
        if (url.includes('/prompt')) {
          return {
            ok: true,
            json: async () => mockQueueResponse(),
          };
        }
        if (url.includes('/history')) {
          return {
            ok: true,
            json: async () => mockHistoryResponse(),
          };
        }
        return {
          ok: true,
          arrayBuffer: async () => makePngBuffer().buffer,
        };
      });

      const result = await removeBackground(
        '/input/photo.png',
        '/output/cutout.png'
      );

      expect(result).toBe('/output/cutout.png');
      expect(callCount).toBeGreaterThan(1);
    });

    it('should handle paths with special characters', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockQueueResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHistoryResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => makePngBuffer().buffer,
        });

      const result = await removeBackground(
        '/input/photo with spaces & chars.png',
        '/output/cutout (copy).png'
      );

      expect(result).toContain('cutout');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// ─── Health Check ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

describe('isReachable', () => {
  it('should return true when ComfyUI is reachable', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    const result = await isReachable();

    expect(result).toBe(true);
  });

  it('should return false when ComfyUI is unreachable', async () => {
    global.fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await isReachable();

    expect(result).toBe(false);
  });

  it('should return false on HTTP error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await isReachable();

    expect(result).toBe(false);
  });

  it('should call system_stats endpoint', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
    });

    await isReachable();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/system_stats')
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// ─── TODO: Pose Adjustment (Future Feature) ────────────────────────
// ═══════════════════════════════════════════════════════════════════
//
// adjustPose(inputPath, targetPose, outputPath) tests to implement:
// - should submit pose adjustment workflow
// - should apply correct keypoint mapping
// - should handle pose normalization
// - should timeout if adjustment takes too long
// - should reject invalid pose parameters
// - should fall back to static pose if model unavailable
//
// Workflow: Cutout → Pose detection → Keypoint adjustment → Output PNG
// Consent: poseAdjustment flag must be true
//
