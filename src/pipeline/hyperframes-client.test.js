import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../lib/logger.js');

import { isReachable, renderComposition, renderBatch } from './hyperframes-client.js';

describe('hyperframes-client', () => {
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
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/health', { timeout: 5000 });
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
          fileSize: 1500000,
        }),
      });

      const result = await renderComposition({
        html: '<html>test</html>',
        data: { test: true },
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 30,
        outputPath: '/tmp/test.mp4',
      });

      expect(result.outputPath).toBe('/tmp/test.mp4');
      expect(result.fileSize).toBe(1500000);
    });

    it('should throw on missing required options', async () => {
      await expect(
        renderComposition({
          html: '<html>test</html>',
          data: { test: true },
        })
      ).rejects.toThrow('Missing required render options');
    });

    it('should throw on API error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValueOnce('Internal Server Error'),
      });

      await expect(
        renderComposition({
          html: '<html>test</html>',
          data: { test: true },
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
          outputPath: '/tmp/test.mp4',
        })
      ).rejects.toThrow('Render failed');
    });

    it('should throw on timeout', async () => {
      fetchMock.mockImplementationOnce(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100)));

      await expect(
        renderComposition({
          html: '<html>test</html>',
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
        json: vi.fn().mockResolvedValueOnce({ outputPath: '/tmp/1.mp4', width: 1920, height: 1080, duration: 30, fileSize: 1500000 }),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ outputPath: '/tmp/2.mp4', width: 1920, height: 1080, duration: 30, fileSize: 1500000 }),
      });

      const results = await renderBatch([
        { html: '<html>1</html>', data: {}, width: 1920, height: 1080, fps: 30, duration: 30, outputPath: '/tmp/1.mp4' },
        { html: '<html>2</html>', data: {}, width: 1920, height: 1080, fps: 30, duration: 30, outputPath: '/tmp/2.mp4' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should continue on individual failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Failed'));
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ outputPath: '/tmp/2.mp4', width: 1920, height: 1080, duration: 30, fileSize: 1500000 }),
      });

      const results = await renderBatch([
        { html: '<html>1</html>', data: {}, width: 1920, height: 1080, fps: 30, duration: 30, outputPath: '/tmp/1.mp4' },
        { html: '<html>2</html>', data: {}, width: 1920, height: 1080, fps: 30, duration: 30, outputPath: '/tmp/2.mp4' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });
});
