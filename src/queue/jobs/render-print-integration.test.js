import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs');
vi.mock('../../pipeline/photoshop-client.js');
vi.mock('../../pipeline/consent/check-consent.js');
vi.mock('../../lib/logger.js');

import { run } from './render-print.js';
import * as fs from 'fs';
import * as photoshop from '../../pipeline/photoshop-client.js';
import * as consent from '../../pipeline/consent/check-consent.js';

describe('render-print job - print config integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    consent.checkConsent.mockImplementation((log, flag) => log?.flags?.[flag] === true);
  });

  it('should render all print formats for all players', async () => {
    const team = {
      orderId: 'ord_print_001',
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
        {
          id: 'p2',
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
        { type: 'print', format: 'poster-16x20' },
        { type: 'print', format: 'banner-2x6' },
        { type: 'print', format: 'player-card-4x6' },
      ],
    };

    const brand = {
      colors: { primary: '#000' },
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
        'player-card-4x6': {
          script: 'card.psjs',
          format: 'card',
          width: 4,
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
      // Mock script files for all 6 renders (2 players × 3 formats)
      .mockReturnValueOnce('poster script')
      .mockReturnValueOnce('poster script')
      .mockReturnValueOnce('banner script')
      .mockReturnValueOnce('banner script')
      .mockReturnValueOnce('card script')
      .mockReturnValueOnce('card script');

    photoshop.isReachable.mockResolvedValue(true);
    photoshop.renderPrint.mockResolvedValue({
      outputPath: '/output/print.pdf',
      fileSize: 2500000,
    });

    const result = await run({
      orderId: 'ord_print_001',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      printTemplatesPath: '/brand/print',
      outputDir: '/output',
    });

    // 2 players × 3 formats = 6 renders
    expect(result.renderedCount).toBe(6);
    expect(result.failedCount).toBe(0);
    expect(result.prints).toHaveLength(6);
    expect(photoshop.renderPrint).toHaveBeenCalledTimes(6);

    // Verify each render received printConfig
    photoshop.renderPrint.mock.calls.forEach((call, idx) => {
      const options = call[0];
      expect(options.printConfig).toBeDefined();
      expect(options.printConfig.width).toBeDefined();
      expect(options.printConfig.height).toBeDefined();
      expect(options.printConfig.dpi).toBe(300);
      expect(options.printConfig.unit).toBe('inches');
    });
  });

  it('should pass correct printConfig dimensions for each format', async () => {
    const team = {
      orderId: 'ord_print_002',
      team: 'Hawks',
      colors: { primary: '#000' },
      fonts: { heading: 'Arial' },
      logo: { path: './logo.png' },
      players: [
        {
          id: 'p1',
          slug: 'player-one',
          name: 'Player One',
          number: '1',
          position: 'Guard',
          photo: { original: './photo.png' },
          stats: {},
          consentLog: {},
        },
      ],
      deliverables: [
        { type: 'print', format: 'poster-16x20' },
        { type: 'print', format: 'banner-2x6' },
        { type: 'print', format: 'player-card-4x6' },
      ],
    };

    const brand = {
      colors: { primary: '#000' },
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
        'player-card-4x6': {
          script: 'card.psjs',
          format: 'card',
          width: 4,
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
      .mockReturnValueOnce('script')
      .mockReturnValueOnce('script')
      .mockReturnValueOnce('script');

    photoshop.isReachable.mockResolvedValue(true);
    photoshop.renderPrint.mockResolvedValue({ outputPath: '/out.pdf', fileSize: 2500000 });

    await run({
      orderId: 'ord_print_002',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      printTemplatesPath: '/brand/print',
      outputDir: '/output',
    });

    const calls = photoshop.renderPrint.mock.calls;
    
    // Verify poster config
    expect(calls[0][0].printConfig.width).toBe(16);
    expect(calls[0][0].printConfig.height).toBe(20);
    expect(calls[0][0].printConfig.format).toBe('poster');
    
    // Verify banner config
    expect(calls[1][0].printConfig.width).toBe(2);
    expect(calls[1][0].printConfig.height).toBe(6);
    expect(calls[1][0].printConfig.format).toBe('banner');
    
    // Verify card config
    expect(calls[2][0].printConfig.width).toBe(4);
    expect(calls[2][0].printConfig.height).toBe(6);
    expect(calls[2][0].printConfig.format).toBe('card');
  });

  it('should fail entire job if print config missing for format', async () => {
    const team = {
      orderId: 'ord_print_003',
      team: 'Hawks',
      colors: { primary: '#000' },
      fonts: { heading: 'Arial' },
      logo: { path: './logo.png' },
      players: [
        {
          id: 'p1',
          slug: 'player-one',
          name: 'Player One',
          number: '1',
          position: 'Guard',
          photo: { original: './photo.png' },
          stats: {},
          consentLog: {},
        },
      ],
      deliverables: [
        { type: 'print', format: 'unknown-format' }, // Missing from brand
      ],
    };

    const brand = {
      colors: { primary: '#000' },
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
      .mockReturnValueOnce(JSON.stringify(brand));

    photoshop.isReachable.mockResolvedValue(true);

    const result = await run({
      orderId: 'ord_print_003',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      printTemplatesPath: '/brand/print',
      outputDir: '/output',
    });

    // Should fail all renders for missing format
    expect(result.failedCount).toBe(1);
    expect(result.prints[0].status).toBe('failed');
    expect(result.prints[0].error).toContain('not configured');
  });

  it('should pass dynamic sizing config to renderPrint', async () => {
    const team = {
      orderId: 'ord_print_004',
      team: 'Hawks',
      colors: { primary: '#000' },
      fonts: { heading: 'Arial' },
      logo: { path: './logo.png' },
      players: [
        {
          id: 'p1',
          slug: 'player-one',
          name: 'Player One',
          number: '1',
          position: 'Guard',
          photo: { original: './photo.png' },
          stats: { ppg: 12 },
          consentLog: { aiMotion: true },
        },
      ],
      deliverables: [
        { type: 'print', format: 'poster-16x20' },
      ],
    };

    const brand = {
      colors: { primary: '#000' },
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
      .mockReturnValueOnce('script');

    photoshop.isReachable.mockResolvedValue(true);
    photoshop.renderPrint.mockResolvedValue({ outputPath: '/out.pdf', fileSize: 2500000 });

    await run({
      orderId: 'ord_print_004',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      printTemplatesPath: '/brand/print',
      outputDir: '/output',
    });

    const callArgs = photoshop.renderPrint.mock.calls[0][0];
    
    // Verify all required config passed
    expect(callArgs.printConfig).toEqual({
      script: 'poster.psjs',
      format: 'poster',
      width: 16,
      height: 20,
      unit: 'inches',
      dpi: 300,
      colorSpace: 'CMYK',
      bleed: 0.125,
    });

    // Verify player data still included
    expect(callArgs.playerData.name).toBe('Player One');
    expect(callArgs.playerData.useAiMotion).toBe(true);

    // Verify brand tokens included
    expect(callArgs.brandTokens).toBeDefined();
  });
});
