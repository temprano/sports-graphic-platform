import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../lib/logger.js');

import { isReachable, renderComposition, renderBatch } from './remotion-client.js';

describe('remotion-client', () => {
  let fetchMock;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    fetchMock = global.fetch;
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('isReachable', () => {
    it('should return true if health check succeeds', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
      });

      const result = await isReachable();

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/health', { timeout: 5000 });
    });

    it('should return false if health check fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
      });

      const result = await isReachable();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await isReachable();

      expect(result).toBe(false);
    });
  });

  describe('renderComposition', () => {
    it('should render composition successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          outputPath: '/tmp/test.mp4',
          width: 1920,
          height: 1080,
          duration: 30,
          fileSize: 2500000,
        }),
      });

      const result = await renderComposition({
        compositionId: 'player-intro-full',
        data: { test: true },
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 30,
        outputPath: '/tmp/test.mp4',
      });

      expect(result.outputPath).toBe('/tmp/test.mp4');
      expect(result.fileSize).toBe(2500000);
    });

    it('should throw on missing required options', async () => {
      await expect(
        renderComposition({
          compositionId: 'player-intro-full',
          data: { test: true },
        })
      ).rejects.toThrow('Missing required render parameters');
    });

    it('should throw on invalid dimensions', async () => {
      await expect(
        renderComposition({
          compositionId: 'player-intro-full',
          data: { test: true },
          width: -1,
          height: 1080,
          fps: 30,
          duration: 30,
          outputPath: '/tmp/test.mp4',
        })
      ).rejects.toThrow('Invalid dimensions');
    });

    it('should throw on API error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValueOnce({ error: 'Composition not found' }),
      });

      await expect(
        renderComposition({
          compositionId: 'invalid-comp',
          data: { test: true },
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
          outputPath: '/tmp/test.mp4',
        })
      ).rejects.toThrow('Remotion render failed');
    });

    it('should throw on timeout', async () => {
      fetchMock.mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await expect(
        renderComposition({
          compositionId: 'player-intro-full',
          data: { test: true },
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
          outputPath: '/tmp/test.mp4',
        })
      ).rejects.toThrow();
    });
  });

  describe('renderBatch', () => {
    it('should render multiple compositions', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          outputPath: '/tmp/1.mp4',
          width: 1920,
          height: 1080,
          duration: 30,
          fileSize: 2500000,
        }),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          outputPath: '/tmp/2.mp4',
          width: 1920,
          height: 1080,
          duration: 30,
          fileSize: 2500000,
        }),
      });

      const results = await renderBatch([
        {
          compositionId: 'comp1',
          data: {},
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
          outputPath: '/tmp/1.mp4',
        },
        {
          compositionId: 'comp2',
          data: {},
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
          outputPath: '/tmp/2.mp4',
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should continue on individual failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Failed'));
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          outputPath: '/tmp/2.mp4',
          width: 1920,
          height: 1080,
          duration: 30,
          fileSize: 2500000,
        }),
      });

      const results = await renderBatch([
        {
          compositionId: 'comp1',
          data: {},
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
          outputPath: '/tmp/1.mp4',
        },
        {
          compositionId: 'comp2',
          data: {},
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
          outputPath: '/tmp/2.mp4',
        },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });

    it('should return empty array for empty input', async () => {
      const results = await renderBatch([]);
      expect(results).toHaveLength(0);
    });
  });
});
