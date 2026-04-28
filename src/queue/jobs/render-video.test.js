import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs');
vi.mock('../../pipeline/hyperframes-client.js');
vi.mock('../../pipeline/consent/check-consent.js');
vi.mock('../../lib/logger.js');

import { run } from './render-video.js';
import * as fs from 'fs';
import * as hyperframes from '../../pipeline/hyperframes-client.js';
import * as consent from '../../pipeline/consent/check-consent.js';

describe('render-video job', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    consent.checkConsent.mockImplementation((log, flag) => log?.flags?.[flag] === true);
  });

  it('should render videos successfully', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_001',
      team: 'Hawks',
      sport: 'basketball',
      colors: {},
      fonts: {},
      logo: {},
      players: [{ id: 'p1', slug: 'jordan', name: 'Jordan', firstName: 'Jordan', lastName: 'Smith', number: '12', position: 'PG', photo: { cutout: './test.png', focalPoint: { x: 0.5, y: 0.5 } }, stats: {}, consentLog: { aiMotion: true } }],
      deliverables: [{ type: 'video', format: 'player-intro-full' }],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'cinematic-dark',
      compositions: { 'player-intro-full': { file: 'comp.html', duration: 30, width: 1920, height: 1080, fps: 30 } },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('<html>template</html>');

    hyperframes.isReachable.mockResolvedValue(true);
    hyperframes.renderComposition.mockResolvedValue({
      outputPath: '/output/test.mp4',
      width: 1920,
      height: 1080,
      duration: 30,
      fileSize: 1500000,
    });

    const result = await run({
      orderId: 'ord_001',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      compositionsPath: '/brand/compositions',
      outputDir: '/output',
    });

    expect(result.orderId).toBe('ord_001');
    expect(result.renderedCount).toBe(1);
  });

  it('should check aiMotion consent before rendering', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_001',
      team: 'Hawks',
      sport: 'basketball',
      colors: {},
      fonts: {},
      logo: {},
      players: [{ id: 'p1', slug: 'jordan', name: 'Jordan', firstName: 'Jordan', lastName: 'Smith', number: '12', position: 'PG', photo: { cutout: './test.png', focalPoint: { x: 0.5, y: 0.5 } }, stats: {}, consentLog: { aiMotion: true } }],
      deliverables: [{ type: 'video', format: 'player-intro-full' }],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'cinematic-dark',
      compositions: { 'player-intro-full': { file: 'comp.html', duration: 30, width: 1920, height: 1080, fps: 30 } },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('<html>template</html>');

    hyperframes.isReachable.mockResolvedValue(true);
    hyperframes.renderComposition.mockResolvedValue({
      outputPath: '/output/test.mp4',
      width: 1920,
      height: 1080,
      duration: 30,
      fileSize: 1500000,
    });

    await run({
      orderId: 'ord_001',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      compositionsPath: '/brand/compositions',
      outputDir: '/output',
    });

    const callArgs = hyperframes.renderComposition.mock.calls[0][0];
    expect(callArgs.data.flags.useAiMotion).toBe(true);
  });

  it('should reject if Hyperframes not reachable', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_001',
      team: 'Hawks',
      sport: 'basketball',
      colors: {},
      fonts: {},
      logo: {},
      players: [{ id: 'p1', slug: 'jordan', name: 'Jordan', firstName: 'Jordan', lastName: 'Smith', number: '12', position: 'PG', photo: { cutout: './test.png', focalPoint: { x: 0.5, y: 0.5 } }, stats: {}, consentLog: {} }],
      deliverables: [{ type: 'video', format: 'player-intro-full' }],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'cinematic-dark',
      compositions: { 'player-intro-full': { file: 'comp.html', duration: 30, width: 1920, height: 1080, fps: 30 } },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand));

    hyperframes.isReachable.mockResolvedValue(false);

    await expect(
      run({
        orderId: 'ord_001',
        teamJsonPath: '/tmp/team.json',
        brandJsonPath: '/tmp/brand.json',
        compositionsPath: '/brand/compositions',
        outputDir: '/output',
      })
    ).rejects.toThrow('Hyperframes service not available');
  });

  it('should reject if required data missing', async () => {
    await expect(run({ orderId: null })).rejects.toThrow('Missing required job data');
  });

  it('should continue if one render fails', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_001',
      team: 'Hawks',
      sport: 'basketball',
      colors: {},
      fonts: {},
      logo: {},
      players: [
        { id: 'p1', slug: 'p1', name: 'P1', firstName: 'P', lastName: '1', number: '1', position: 'PG', photo: { cutout: './p1.png', focalPoint: { x: 0.5, y: 0.5 } }, stats: {}, consentLog: {} },
        { id: 'p2', slug: 'p2', name: 'P2', firstName: 'P', lastName: '2', number: '2', position: 'SG', photo: { cutout: './p2.png', focalPoint: { x: 0.5, y: 0.5 } }, stats: {}, consentLog: {} },
      ],
      deliverables: [{ type: 'video', format: 'player-intro-full' }],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'cinematic-dark',
      compositions: { 'player-intro-full': { file: 'comp.html', duration: 30, width: 1920, height: 1080, fps: 30 } },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('<html>template</html>')
      .mockReturnValueOnce('<html>template</html>');

    hyperframes.isReachable.mockResolvedValue(true);
    hyperframes.renderComposition
      .mockRejectedValueOnce(new Error('Render failed'))
      .mockResolvedValueOnce({ outputPath: '/output/p2.mp4', width: 1920, height: 1080, duration: 30, fileSize: 1500000 });

    const result = await run({
      orderId: 'ord_001',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      compositionsPath: '/brand/compositions',
      outputDir: '/output',
    });

    expect(result.renderedCount).toBe(1);
    expect(result.failedCount).toBe(1);
  });

  it('should skip non-video deliverables', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_001',
      team: 'Hawks',
      sport: 'basketball',
      colors: {},
      fonts: {},
      logo: {},
      players: [{ id: 'p1', slug: 'jordan', name: 'Jordan', firstName: 'Jordan', lastName: 'Smith', number: '12', position: 'PG', photo: { cutout: './test.png', focalPoint: { x: 0.5, y: 0.5 } }, stats: {}, consentLog: {} }],
      deliverables: [{ type: 'print', format: 'poster' }],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'cinematic-dark',
      compositions: { 'player-intro-full': { file: 'comp.html', duration: 30, width: 1920, height: 1080, fps: 30 } },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand));

    hyperframes.isReachable.mockResolvedValue(true);

    const result = await run({
      orderId: 'ord_001',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      compositionsPath: '/brand/compositions',
      outputDir: '/output',
    });

    expect(result.renderedCount).toBe(0);
    expect(result.videos).toHaveLength(0);
  });
});
