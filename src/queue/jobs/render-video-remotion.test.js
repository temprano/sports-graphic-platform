import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs');
vi.mock('../../pipeline/hyperframes-client.js');
vi.mock('../../pipeline/remotion-client.js');
vi.mock('../../pipeline/consent/check-consent.js');
vi.mock('../../lib/logger.js');

import { run } from './render-video.js';
import * as fs from 'fs';
import * as hyperframes from '../../pipeline/hyperframes-client.js';
import * as remotion from '../../pipeline/remotion-client.js';
import * as consent from '../../pipeline/consent/check-consent.js';

describe('render-video job with Remotion engine', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    consent.checkConsent.mockImplementation((log, flag) => log?.flags?.[flag] === true);
  });

  it('should validate renderEngine for tech-dynamic brand', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_remotion_001',
      team: 'Tech Hawks',
      sport: 'basketball',
      colors: { primary: '#00a8e8' },
      fonts: { display: 'Montserrat' },
      logo: 'logo.svg',
      players: [
        {
          id: 'p1',
          slug: 'tech_player',
          name: 'Tech Player',
          firstName: 'Tech',
          lastName: 'Player',
          number: '42',
          position: 'SG',
          photo: { cutout: './photo.png', focalPoint: { x: 0.5, y: 0.5 } },
          stats: {},
          consentLog: { aiMotion: true },
        },
      ],
      deliverables: [{ type: 'video', format: 'player-intro-short' }],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'tech-dynamic',
      name: 'Tech Dynamic',
      active: true,
      renderEngine: 'remotion',
      tokenSchema: { colors: ['primary'], fonts: ['display'] },
      compositions: {
        'player-intro-short': {
          compositionId: 'PlayerIntroShort',
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 8,
        },
      },
      print: {},
      outputSpecs: {
        video: { codec: 'h264', bitrate: '8000k', format: 'mp4' },
      },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('<html>template</html>');

    hyperframes.isReachable.mockResolvedValue(true);
    // Mock remotion.renderComposition to return successful result
    remotion.renderComposition.mockResolvedValue({
      outputPath: '/output/tech_player_player-intro-short.mp4',
      width: 1080,
      height: 1920,
      duration: 8,
      fileSize: 1200000,
    });

    const result = await run({
      orderId: 'ord_remotion_001',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      compositionsPath: '/brand/compositions',
      outputDir: '/output',
    });

    // Should succeed with Remotion rendering
    expect(result.renderedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(remotion.renderComposition).toHaveBeenCalled();
    expect(result.videos[0].status).toBe('rendered');
  });

  it('should preserve tech-dynamic brand configuration', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_remotion_002',
      team: 'Tech Hawks',
      sport: 'basketball',
      colors: { primary: '#00a8e8', secondary: '#003d82', accent: '#00ff88' },
      fonts: { display: 'Montserrat', body: 'Inter' },
      logo: 'logo.svg',
      players: [
        {
          id: 'p1',
          slug: 'player_1',
          name: 'LeBron James',
          firstName: 'LeBron',
          lastName: 'James',
          number: '23',
          position: 'SF',
          photo: { cutout: './cutout.png', focalPoint: { x: 0.5, y: 0.5 } },
          stats: { PPG: 25.7, RPG: 7.3, APG: 8.1 },
          consentLog: { aiMotion: true },
        },
      ],
      deliverables: [
        { type: 'video', format: 'player-intro-full' },
        { type: 'video', format: 'player-intro-short' },
        { type: 'video', format: 'team-banner' },
      ],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'tech-dynamic',
      name: 'Tech Dynamic',
      active: true,
      renderEngine: 'remotion',
      tokenSchema: {
        colors: ['primary', 'secondary', 'accent'],
        fonts: ['display', 'body'],
      },
      compositions: {
        'player-intro-full': {
          compositionId: 'PlayerIntroFull',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
        },
        'player-intro-short': {
          compositionId: 'PlayerIntroShort',
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 8,
        },
        'team-banner': {
          compositionId: 'TeamBanner',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 15,
        },
      },
      print: {},
      outputSpecs: {
        video: { codec: 'h264', bitrate: '8000k', format: 'mp4' },
      },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('<html>template</html>')
      .mockReturnValueOnce('<html>template</html>')
      .mockReturnValueOnce('<html>template</html>');

    hyperframes.isReachable.mockResolvedValue(true);

    const result = await run({
      orderId: 'ord_remotion_002',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      compositionsPath: '/brand/compositions',
      outputDir: '/output',
    });

    // Should attempt all 3 compositions with Remotion engine
    expect(result.failedCount).toBe(3);
    expect(result.videos).toHaveLength(3);
  });

  it('should apply consent gates with Remotion engine', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_remotion_003',
      team: 'Tech Hawks',
      sport: 'basketball',
      colors: {},
      fonts: {},
      logo: {},
      players: [
        {
          id: 'p1',
          slug: 'player_no_consent',
          name: 'Player',
          firstName: 'No',
          lastName: 'Consent',
          number: '00',
          position: 'SF',
          photo: { cutout: './photo.png', focalPoint: { x: 0.5, y: 0.5 } },
          stats: {},
          consentLog: { aiMotion: false },
        },
      ],
      deliverables: [{ type: 'video', format: 'player-intro-short' }],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'tech-dynamic',
      renderEngine: 'remotion',
      compositions: {
        'player-intro-short': {
          compositionId: 'PlayerIntroShort',
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 8,
        },
      },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('<html>template</html>');

    hyperframes.isReachable.mockResolvedValue(true);

    // Mock checkConsent to return false for aiMotion
    consent.checkConsent.mockImplementation((log, flag) => {
      if (flag === 'aiMotion') return log?.flags?.aiMotion === true;
      return false;
    });

    const result = await run({
      orderId: 'ord_remotion_003',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      compositionsPath: '/brand/compositions',
      outputDir: '/output',
    });

    // Should render but with useAiMotion: false (consent is false)
    expect(result.videos[0].aiMotionApplied).toBe(false);
  });

  it('should handle Remotion composition with all brand data', async () => {
    const team = {
      schemaVersion: '1.0',
      orderId: 'ord_remotion_full',
      team: 'Lakers',
      sport: 'Basketball',
      colors: {
        primary: '#00a8e8',
        secondary: '#003d82',
        accent: '#00ff88',
      },
      fonts: {
        display: 'Montserrat',
        body: 'Inter',
      },
      logo: 'https://example.com/lakers-logo.png',
      players: [
        {
          id: 'p_lebron',
          slug: 'lebron_james',
          name: 'LeBron James',
          firstName: 'LeBron',
          lastName: 'James',
          number: '23',
          position: 'SF',
          photo: {
            cutout: 'https://example.com/lebron-cutout.png',
            focalPoint: { x: 0.5, y: 0.4 },
          },
          stats: {
            PPG: 25.7,
            RPG: 7.3,
            APG: 8.1,
            FG: 0.514,
          },
          consentLog: { aiMotion: true },
        },
      ],
      deliverables: [{ type: 'video', format: 'player-intro-short' }],
    };

    const brand = {
      schemaVersion: '1.0',
      id: 'tech-dynamic',
      name: 'Tech Dynamic',
      active: true,
      renderEngine: 'remotion',
      tokenSchema: {
        colors: ['primary', 'secondary', 'accent'],
        fonts: ['display', 'body'],
      },
      compositions: {
        'player-intro-short': {
          compositionId: 'PlayerIntroShort',
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 8,
          description: '8-second vertical player introduction',
        },
      },
    };

    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(team))
      .mockReturnValueOnce(JSON.stringify(brand))
      .mockReturnValueOnce('<html>template</html>');

    hyperframes.isReachable.mockResolvedValue(true);

    const result = await run({
      orderId: 'ord_remotion_full',
      teamJsonPath: '/tmp/team.json',
      brandJsonPath: '/tmp/brand.json',
      compositionsPath: '/brand/compositions',
      outputDir: '/output',
    });

    // Verify the video record includes all necessary data for Remotion rendering
    expect(result.videos[0]).toBeTruthy();
    expect(result.videos[0].playerId).toBe('p_lebron');
    expect(result.videos[0].playerSlug).toBe('lebron_james');
    expect(result.videos[0].format).toBe('player-intro-short');
    expect(result.videos[0].aiMotionApplied).toBe(true);
  });
});
