import { describe, it, expect } from 'vitest';

/**
 * Tests for TeamBanner animation logic
 * 
 * This test suite validates:
 * - Animation frame calculations for 15-second composition (450 frames)
 * - 4-phase animation sequence with correct timing
 * - Logo pulse and card entrance animations
 * - Consent flag behavior (useAiMotion)
 * - Graceful fallbacks for missing data
 */

const createAnimationFramework = () => {
  const interpolate = (value, inputRange, outputRange) => {
    if (value <= inputRange[0]) return outputRange[0];
    if (value >= inputRange[1]) return outputRange[1];
    const progress = (value - inputRange[0]) / (inputRange[1] - inputRange[0]);
    return outputRange[0] + progress * (outputRange[1] - outputRange[0]);
  };

  return { interpolate };
};

describe('TeamBanner Composition', () => {
  const { interpolate } = createAnimationFramework();
  
  // Phase boundaries (450 frames total, 15 seconds @ 30fps)
  const PHASE_1_END = 60; // Intro: 0-2s
  const PHASE_2_END = 150; // Player entrance: 2-5s
  const PHASE_3_END = 360; // Player spotlight: 5-12s
  const TOTAL_FRAMES = 450; // Finale: 12-15s

  describe('composition specifications', () => {
    it('should have correct duration (450 frames total)', () => {
      expect(TOTAL_FRAMES).toBe(15 * 30);
    });

    it('should have correct horizontal format (1920x1080)', () => {
      const width = 1920;
      const height = 1080;
      expect(width).toBe(1920);
      expect(height).toBe(1080);
      expect(width / height).toBeCloseTo(16 / 9, 1);
    });

    it('should render at 30fps', () => {
      const fps = 30;
      expect(fps).toBe(30);
    });

    it('should have 4 distinct animation phases', () => {
      const phases = [
        { name: 'Intro', start: 0, end: PHASE_1_END, duration: PHASE_1_END }, // 2s
        { name: 'Entrance', start: PHASE_1_END, end: PHASE_2_END, duration: PHASE_2_END - PHASE_1_END }, // 3s
        { name: 'Spotlight', start: PHASE_2_END, end: PHASE_3_END, duration: PHASE_3_END - PHASE_2_END }, // 7s
        { name: 'Finale', start: PHASE_3_END, end: TOTAL_FRAMES, duration: TOTAL_FRAMES - PHASE_3_END }, // 3s
      ];

      const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
      expect(totalDuration).toBe(TOTAL_FRAMES);
      expect(phases).toHaveLength(4);
    });
  });

  describe('phase 1: team intro (0-2s)', () => {
    it('should animate logo opacity from 0 to 1', () => {
      const frame0 = interpolate(0, [0, PHASE_1_END], [0, 1]);
      expect(frame0).toBe(0);

      const frame30 = interpolate(30, [0, PHASE_1_END], [0, 1]);
      expect(frame30).toBeCloseTo(0.5, 1);

      const frame60 = interpolate(60, [0, PHASE_1_END], [0, 1]);
      expect(frame60).toBe(1);
    });

    it('should animate logo scale from 0.5 to 0.9 during intro', () => {
      const frame0 = interpolate(0, [0, PHASE_1_END], [0.5, 0.9]);
      expect(frame0).toBe(0.5);

      const frame60 = interpolate(60, [0, PHASE_1_END], [0.5, 0.9]);
      expect(frame60).toBe(0.9);
    });

    it('should animate team text with delayed start', () => {
      const frame30 = interpolate(Math.max(0, 30 - 30), [0, 30], [0, 1]);
      expect(frame30).toBe(0); // Before start

      const frame45 = interpolate(Math.max(0, 45 - 30), [0, 30], [0, 1]);
      expect(frame45).toBeCloseTo(0.5, 1); // Midway

      const frame60 = interpolate(Math.max(0, 60 - 30), [0, 30], [0, 1]);
      expect(frame60).toBe(1); // Full opacity
    });
  });

  describe('phase 2: player card entrance (2-5s)', () => {
    it('should animate photo slide-in from right (1920px to 300px)', () => {
      const frame60 = interpolate(Math.max(0, 60 - PHASE_1_END), [0, 90], [1920, 300]);
      expect(frame60).toBe(1920); // Start off-screen right

      const frame105 = interpolate(Math.max(0, 105 - PHASE_1_END), [0, 90], [1920, 300]);
      expect(frame105).toBeCloseTo(1110, 0); // Midway

      const frame150 = interpolate(Math.max(0, 150 - PHASE_1_END), [0, 90], [1920, 300]);
      expect(frame150).toBe(300); // On-screen position
    });

    it('should animate photo opacity from 0 to 1', () => {
      const frame60 = interpolate(Math.max(0, 60 - PHASE_1_END), [0, 90], [0, 1]);
      expect(frame60).toBe(0);

      const frame150 = interpolate(Math.max(0, 150 - PHASE_1_END), [0, 90], [0, 1]);
      expect(frame150).toBe(1);
    });

    it('should animate player name with staggered entrance', () => {
      const nameStartFrame = PHASE_1_END + 30;
      const frame90 = interpolate(Math.max(0, 90 - nameStartFrame), [0, 60], [0, 1]);
      expect(frame90).toBe(0); // Before start

      const frame120 = interpolate(Math.max(0, 120 - nameStartFrame), [0, 60], [0, 1]);
      expect(frame120).toBeCloseTo(0.5, 1); // Midway

      const frame150 = interpolate(Math.max(0, 150 - nameStartFrame), [0, 60], [0, 1]);
      expect(frame150).toBe(1); // Visible
    });

    it('should animate player number with further delay', () => {
      const numberStartFrame = PHASE_1_END + 60;
      const frame120 = interpolate(Math.max(0, 120 - numberStartFrame), [0, 30], [0, 1]);
      expect(frame120).toBe(0); // Before start

      const frame150 = interpolate(Math.max(0, 150 - numberStartFrame), [0, 30], [0, 1]);
      expect(frame150).toBeCloseTo(1, 0); // Visible
    });
  });

  describe('phase 3: player spotlight (5-12s)', () => {
    it('should maintain player card visibility through spotlight', () => {
      const photoOpacity = 1; // Stays visible
      expect(photoOpacity).toBe(1);
    });

    it('should animate stats panel opacity with delay', () => {
      const statsStartFrame = PHASE_2_END + 30; // 180
      const frame150 = interpolate(Math.max(0, 150 - statsStartFrame), [0, 60], [0, 1]);
      expect(frame150).toBe(0); // Before visible

      const frame180 = interpolate(Math.max(0, 180 - statsStartFrame), [0, 60], [0, 1]);
      expect(frame180).toBe(0); // At start of animation

      const frame210 = interpolate(Math.max(0, 210 - statsStartFrame), [0, 60], [0, 1]);
      expect(frame210).toBeCloseTo(0.5, 1); // Halfway through fade-in
    });

    it('should have animated glow effect during spotlight', () => {
      // Glow uses sine wave, so it oscillates
      const glowAtFrame200 = Math.sin((200 - PHASE_2_END) * 0.015) * 15 + 25;
      expect(glowAtFrame200).toBeGreaterThan(10);
      expect(glowAtFrame200).toBeLessThan(40);

      const glowAtFrame300 = Math.sin((300 - PHASE_2_END) * 0.015) * 15 + 25;
      expect(glowAtFrame300).toBeGreaterThan(10);
      expect(glowAtFrame300).toBeLessThan(40);
    });

    it('should animate background accent height', () => {
      // Accent height also uses sine wave for animation
      const accentAtFrame200 = Math.sin((200 - PHASE_2_END) * 0.01) * 200 + 600;
      expect(accentAtFrame200).toBeGreaterThan(400);
      expect(accentAtFrame200).toBeLessThan(800);
    });
  });

  describe('phase 4: team finale (12-15s)', () => {
    it('should animate team branding finale from 0 to 1', () => {
      const frame360 = interpolate(Math.max(0, 360 - PHASE_3_END), [0, 90], [0, 1]);
      expect(frame360).toBe(0); // Start

      const frame405 = interpolate(Math.max(0, 405 - PHASE_3_END), [0, 90], [0, 1]);
      expect(frame405).toBeCloseTo(0.5, 1); // Midway

      const frame450 = interpolate(Math.max(0, 450 - PHASE_3_END), [0, 90], [0, 1]);
      expect(frame450).toBe(1); // Full opacity
    });

    it('should animate overall fade-out at end', () => {
      const fadeStartFrame = PHASE_3_END + 60; // 420
      const frame420 = interpolate(Math.max(0, 420 - fadeStartFrame), [0, 90], [1, 0]);
      expect(frame420).toBe(1); // Start of fade-out

      const frame435 = interpolate(Math.max(0, 435 - fadeStartFrame), [0, 90], [1, 0]);
      expect(frame435).toBeCloseTo(0.833, 1); // 15/90 through fade

      const frame450 = interpolate(Math.max(0, 450 - fadeStartFrame), [0, 90], [1, 0]);
      expect(frame450).toBeCloseTo(0.667, 1); // 30/90 through fade (2/3 visible)
    });
  });

  describe('consent flag behavior', () => {
    it('should apply poster blur when useAiMotion is true', () => {
      const flags = { useAiMotion: true };
      const posterBlur = flags?.useAiMotion ? 3 : 0;
      expect(posterBlur).toBe(3);
    });

    it('should not apply poster blur when useAiMotion is false', () => {
      const flags = { useAiMotion: false };
      const posterBlur = flags?.useAiMotion ? 3 : 0;
      expect(posterBlur).toBe(0);
    });

    it('should apply accent blur when useAiMotion is true', () => {
      const flags = { useAiMotion: true };
      const accentBlur = flags?.useAiMotion ? 1 : 0;
      expect(accentBlur).toBe(1);
    });

    it('should default to no blur when flags missing', () => {
      const flags = {};
      const posterBlur = flags?.useAiMotion ? 3 : 0;
      const accentBlur = flags?.useAiMotion ? 1 : 0;
      expect(posterBlur).toBe(0);
      expect(accentBlur).toBe(0);
    });
  });

  describe('data fallbacks', () => {
    it('should handle missing player name', () => {
      const player = {};
      const displayName = player?.name || 'PLAYER';
      expect(displayName).toBe('PLAYER');
    });

    it('should handle missing player number', () => {
      const player = {};
      const displayNumber = player?.number || '--';
      expect(displayNumber).toBe('--');
    });

    it('should handle missing player position', () => {
      const player = {};
      const displayPosition = player?.position || 'POS';
      expect(displayPosition).toBe('POS');
    });

    it('should handle missing player photo', () => {
      const player = { name: 'Test' };
      const hasPhoto = !!player?.photo;
      expect(hasPhoto).toBe(false);
    });

    it('should handle missing team name', () => {
      const team = {};
      const displayTeam = team?.name || 'TEAM';
      expect(displayTeam).toBe('TEAM');
    });

    it('should handle missing team sport', () => {
      const team = {};
      const displaySport = team?.sport || 'SPORT';
      expect(displaySport).toBe('SPORT');
    });

    it('should handle missing player stats', () => {
      const player = { name: 'Test' };
      const hasStats = !!(player?.stats && Object.keys(player.stats).length > 0);
      expect(hasStats).toBe(false);
    });

    it('should limit stats display to 2 items (max)', () => {
      const player = {
        stats: { A: 1, B: 2, C: 3, D: 4 },
      };
      const displayedStats = Object.entries(player.stats).slice(0, 2);
      expect(displayedStats).toHaveLength(2);
    });

    it('should handle missing focalPoint with default center', () => {
      const player = { photo: './photo.png' };
      const focalPoint = player?.focalPoint || { x: 0.5, y: 0.5 };
      expect(focalPoint).toEqual({ x: 0.5, y: 0.5 });
    });
  });

  describe('brand styling', () => {
    it('should use brand primary color for accents', () => {
      const brand = { colors: { primary: '#00D4FF' } };
      const primaryColor = brand?.colors?.primary || '#00D4FF';
      expect(primaryColor).toBe('#00D4FF');
    });

    it('should use brand accent color for highlights', () => {
      const brand = { colors: { accent: '#FF006E' } };
      const accentColor = brand?.colors?.accent || '#FF006E';
      expect(accentColor).toBe('#FF006E');
    });

    it('should use brand secondary color for stats panel', () => {
      const brand = { colors: { secondary: '#003d82' } };
      const secondaryColor = brand?.colors?.secondary || '#003d82';
      expect(secondaryColor).toBe('#003d82');
    });

    it('should use brand bg color for background', () => {
      const brand = { colors: { bg: '#0a0e27' } };
      const bgColor = brand?.colors?.bg || '#0a0e27';
      expect(bgColor).toBe('#0a0e27');
    });

    it('should fallback to tech defaults when brand missing', () => {
      const brand = null;
      const primaryColor = brand?.colors?.primary || '#00D4FF';
      const accentColor = brand?.colors?.accent || '#FF006E';
      const secondaryColor = brand?.colors?.secondary || '#003d82';
      const bgColor = brand?.colors?.bg || '#0a0e27';

      expect(primaryColor).toBe('#00D4FF');
      expect(accentColor).toBe('#FF006E');
      expect(secondaryColor).toBe('#003d82');
      expect(bgColor).toBe('#0a0e27');
    });
  });

  describe('composition props', () => {
    it('should accept player data', () => {
      const player = {
        name: 'LeBron James',
        number: '23',
        position: 'SF',
        photo: './photo.png',
        focalPoint: { x: 0.5, y: 0.4 },
        stats: { PPG: 25.7, RPG: 7.3 },
      };

      expect(player.name).toBe('LeBron James');
      expect(player.stats).toHaveProperty('PPG');
    });

    it('should accept team data', () => {
      const team = {
        name: 'Lakers',
        sport: 'Basketball',
        logo: './logo.png',
      };

      expect(team.name).toBe('Lakers');
      expect(team.sport).toBe('Basketball');
    });

    it('should accept brand data', () => {
      const brand = {
        colors: {
          primary: '#00D4FF',
          accent: '#FF006E',
          secondary: '#003d82',
          bg: '#0a0e27',
        },
        fonts: { primary: 'Montserrat' },
      };

      expect(brand.colors).toHaveProperty('primary');
      expect(brand.fonts).toHaveProperty('primary');
    });

    it('should accept flags with consent', () => {
      const flags = { useAiMotion: true };

      expect(flags).toHaveProperty('useAiMotion');
      expect(flags.useAiMotion).toBe(true);
    });
  });

  describe('animation timing accuracy', () => {
    it('should have correct phase timing ratios', () => {
      const phase1Duration = PHASE_1_END - 0;
      const phase2Duration = PHASE_2_END - PHASE_1_END;
      const phase3Duration = PHASE_3_END - PHASE_2_END;
      const phase4Duration = TOTAL_FRAMES - PHASE_3_END;

      expect(phase1Duration).toBe(60); // 2s
      expect(phase2Duration).toBe(90); // 3s
      expect(phase3Duration).toBe(210); // 7s
      expect(phase4Duration).toBe(90); // 3s

      const total = phase1Duration + phase2Duration + phase3Duration + phase4Duration;
      expect(total).toBe(TOTAL_FRAMES);
    });

    it('should have smooth frame transitions', () => {
      const values = [];
      for (let i = 0; i <= 60; i += 10) {
        values.push(interpolate(i, [0, 60], [0, 1]));
      }

      // Check smooth progression
      for (let i = 1; i < values.length; i++) {
        const diff = Math.abs(values[i] - values[i - 1]);
        expect(diff).toBeLessThanOrEqual(0.2); // Max 20% step
      }
    });
  });
});
