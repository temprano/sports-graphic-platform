import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../lib/logger.js');

import { isReachable, renderPrint, renderBatch } from './photoshop-client.js';

describe('photoshop-client', () => {
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
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/health', { timeout: 5000 });
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

  describe('renderPrint', () => {
    it('should render print successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          outputPath: '/tmp/test.pdf',
          fileSize: 2500000,
        }),
      });

      const result = await renderPrint({
        script: 'var doc = app.open(...);',
        printConfig: { width: 16, height: 20, unit: 'inches', dpi: 300, format: 'poster' },
        playerData: { name: 'Smith', number: '12' },
        brandTokens: { colors: { primary: '#000' } },
        outputPath: '/tmp/test.pdf',
      });

      expect(result.outputPath).toBe('/tmp/test.pdf');
      expect(result.fileSize).toBe(2500000);
    });

    it('should throw on missing required options', async () => {
      await expect(
        renderPrint({
          script: 'var doc = app.open(...);',
          playerData: { name: 'Smith' },
          // missing printConfig, brandTokens, outputPath
        })
      ).rejects.toThrow('Missing required');
    });

    it('should throw on missing printConfig', async () => {
      await expect(
        renderPrint({
          script: 'var doc = app.open(...);',
          playerData: { name: 'Smith', number: '12' },
          brandTokens: { colors: { primary: '#000' } },
          outputPath: '/tmp/test.pdf',
          // missing printConfig
        })
      ).rejects.toThrow('Missing required render option: printConfig');
    });

    it('should throw on API error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValueOnce('Photoshop error'),
      });

      await expect(
        renderPrint({
          script: 'var doc = app.open(...);',
          printConfig: { width: 16, height: 20, unit: 'inches', dpi: 300, format: 'poster' },
          playerData: { name: 'Smith', number: '12' },
          brandTokens: { colors: { primary: '#000' } },
          outputPath: '/tmp/test.pdf',
        })
      ).rejects.toThrow('Render failed');
    });

    it('should throw on timeout', async () => {
      fetchMock.mockImplementationOnce(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100)));

      await expect(
        renderPrint({
          script: 'var doc = app.open(...);',
          printConfig: { width: 16, height: 20, unit: 'inches', dpi: 300, format: 'poster' },
          playerData: { name: 'Smith', number: '12' },
          brandTokens: { colors: { primary: '#000' } },
          outputPath: '/tmp/test.pdf',
        })
      ).rejects.toThrow();
    });
  });

  describe('renderBatch', () => {
    it('should render multiple prints', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ outputPath: '/tmp/1.pdf', fileSize: 2500000 }),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ outputPath: '/tmp/2.pdf', fileSize: 2500000 }),
      });

      const results = await renderBatch([
        { script: 's1', printConfig: { width: 16, height: 20, dpi: 300 }, playerData: { name: 'A' }, brandTokens: {}, outputPath: '/tmp/1.pdf' },
        { script: 's2', printConfig: { width: 2, height: 6, dpi: 300 }, playerData: { name: 'B' }, brandTokens: {}, outputPath: '/tmp/2.pdf' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should continue on individual failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Failed'));
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ outputPath: '/tmp/2.pdf', fileSize: 2500000 }),
      });

      const results = await renderBatch([
        { script: 's1', printConfig: { width: 16, height: 20, dpi: 300 }, playerData: { name: 'A' }, brandTokens: {}, outputPath: '/tmp/1.pdf' },
        { script: 's2', printConfig: { width: 2, height: 6, dpi: 300 }, playerData: { name: 'B' }, brandTokens: {}, outputPath: '/tmp/2.pdf' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });
});
