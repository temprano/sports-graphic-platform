import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs');
vi.mock('../../pipeline/photoshop-client.js');
vi.mock('../../pipeline/consent/check-consent.js');
vi.mock('../../lib/logger.js');

import { run } from './render-print.js';
import * as fs from 'fs';
import * as photoshop from '../../pipeline/photoshop-client.js';
import * as consent from '../../pipeline/consent/check-consent.js';

describe('render-print job', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    consent.checkConsent.mockImplementation((log, flag) => log?.flags?.[flag] === true);
  });

  it('should render prints successfully', async () => {
    const team = {
      orderId: 'ord_001',
      team: 'Hawks',
      colors: { primary: '#000', accent: '#fff' },
      fonts: { heading: 'Arial' },
      logo: { path: './logo.png' },
      players: [
        {
          id: 'p1',
          slug: 'smith-john',
          name: 'John Smith',
          number: '12',
          position: 'Guard',
          photo: { original: './photo.png' },
          stats: { ppg: 10 },
          consentLog: { aiMotion: true },
        },
      ],
      deliverables: [
        { type: 'print', format: 'poster-16x20' },
      ],
    };

    const brand = {
      tokens: 'test',
      print: {
        'poster-16x20': {
          script: 'poster.psjs',
          format: 'poster',
          width: 16,
          height: 20,
          unit: 'inches',
          dpi: 300,
          colorSpace: 'CMYK',
          bleed: 0.125,
        },
      },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('app.open()...');

    photoshop.isReachable.mockResolvedValue(true);
    photoshop.renderPrint.mockResolvedValue({
      outputPath: '/output/print/poster-16x20/smith-john.pdf',
      fileSize: 2500000,
    });

    const result = await run({
      orderId: 'ord_001',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      printTemplatesPath: '/brand/print',
      outputDir: '/output',
    });

    expect(result.orderId).toBe('ord_001');
    expect(result.renderedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.prints).toHaveLength(1);
    expect(result.prints[0].status).toBe('success');
    expect(result.prints[0].aiMotionApplied).toBe(true);
  });

  it('should check aiMotion consent before rendering', async () => {
    const team = {
      orderId: 'ord_002',
      team: 'Hawks',
      colors: { primary: '#000' },
      fonts: { heading: 'Arial' },
      logo: { path: './logo.png' },
      players: [
        {
          id: 'p1',
          slug: 'jane-doe',
          name: 'Jane Doe',
          number: '23',
          position: 'Forward',
          photo: { original: './photo.png' },
          stats: { ppg: 15 },
          consentLog: { aiMotion: false },
        },
      ],
      deliverables: [
        { type: 'print', format: 'banner-2x6' },
      ],
    };

    const brand = {
      print: {
        'banner-2x6': {
          script: 'banner.psjs',
          format: 'banner',
          width: 2,
          height: 6,
          unit: 'inches',
          dpi: 300,
          colorSpace: 'CMYK',
          bleed: 0.125,
        },
      },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('app.open()...');

    photoshop.isReachable.mockResolvedValue(true);
    photoshop.renderPrint.mockResolvedValue({
      outputPath: '/output/print/banner-2x6/jane-doe.pdf',
      fileSize: 1500000,
    });

    await run({
      orderId: 'ord_002',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      printTemplatesPath: '/brand/print',
      outputDir: '/output',
    });

    const callArgs = photoshop.renderPrint.mock.calls[0][0];
    expect(callArgs.playerData.useAiMotion).toBe(false);
  });

  it('should reject if Photoshop not reachable', async () => {
    const team = { orderId: 'ord_003', deliverables: [{ type: 'print' }], players: [], colors: {}, fonts: {}, logo: {} };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce('{}');

    photoshop.isReachable.mockResolvedValue(false);

    await expect(
      run({
        orderId: 'ord_003',
        teamJsonPath: '/tmp/team.json',
        brandJsonPath: '/tmp/brand.json',
        printTemplatesPath: '/brand/print',
        outputDir: '/output',
      })
    ).rejects.toThrow('Photoshop service not available');
  });

  it('should reject if required data missing', async () => {
    await expect(
      run({
        orderId: null,
        teamJsonPath: '/tmp/team.json',
        brandJsonPath: '/tmp/brand.json',
        printTemplatesPath: '/brand/print',
        outputDir: '/output',
      })
    ).rejects.toThrow('Missing required job data');
  });

  it('should continue if one render fails', async () => {
    const team = {
      orderId: 'ord_004',
      team: 'Hawks',
      colors: { primary: '#000' },
      fonts: { heading: 'Arial' },
      logo: { path: './logo.png' },
      players: [
        {
          id: 'p1',
          slug: 'player1',
          name: 'Player One',
          number: '1',
          position: 'Guard',
          photo: {},
          stats: {},
          consentLog: {},
        },
        {
          id: 'p2',
          slug: 'player2',
          name: 'Player Two',
          number: '2',
          position: 'Guard',
          photo: {},
          stats: {},
          consentLog: {},
        },
      ],
      deliverables: [{ type: 'print', format: 'poster-16x20' }],
    };

    const brand = {
      print: {
        'poster-16x20': {
          script: 'poster.psjs',
          format: 'poster',
          width: 16,
          height: 20,
          unit: 'inches',
          dpi: 300,
          colorSpace: 'CMYK',
          bleed: 0.125,
        },
      },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('app.open()...')
      .mockReturnValueOnce('app.open()...');

    photoshop.isReachable.mockResolvedValue(true);
    photoshop.renderPrint
      .mockRejectedValueOnce(new Error('Render failed'))
      .mockResolvedValueOnce({
        outputPath: '/output/print/poster-16x20/player2.pdf',
        fileSize: 2500000,
      });

    const result = await run({
      orderId: 'ord_004',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      printTemplatesPath: '/brand/print',
      outputDir: '/output',
    });

    expect(result.renderedCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.prints).toHaveLength(2);
    expect(result.prints[0].status).toBe('failed');
    expect(result.prints[1].status).toBe('success');
  });

  it('should skip if no print deliverables', async () => {
    const team = {
      orderId: 'ord_005',
      team: 'Hawks',
      colors: {},
      fonts: {},
      logo: {},
      players: [{ id: 'p1', slug: 'player' }],
      deliverables: [{ type: 'video', format: 'intro' }],
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce('{}');

    photoshop.isReachable.mockResolvedValue(true);

    const result = await run({
      orderId: 'ord_005',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      printTemplatesPath: '/brand/print',
      outputDir: '/output',
    });

    expect(result.renderedCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.prints).toHaveLength(0);
  });
});
