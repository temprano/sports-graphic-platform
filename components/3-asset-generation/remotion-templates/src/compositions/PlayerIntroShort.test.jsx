import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Mock Remotion hooks
vi.mock('remotion', () => ({
  useCurrentFrame: vi.fn(() => 60), // Default to frame 60 (2 seconds into intro)
  useVideoConfig: vi.fn(() => ({ fps: 30 })),
  interpolate: (frame, inputRange, outputRange, options) => {
    // Simple linear interpolation for testing
    const [inStart, inEnd] = inputRange;
    const [outStart, outEnd] = outputRange;
    
    if (frame <= inStart) return outStart;
    if (frame >= inEnd) return outEnd;
    
    const progress = (frame - inStart) / (inEnd - inStart);
    return outStart + (outEnd - outStart) * progress;
  },
  Easing: {
    out: (easing) => easing,
    inOut: (easing) => easing,
  },
  AbsoluteFill: ({ children, style }) => (
    <div style={{ position: 'absolute', ...style }}>
      {children}
    </div>
  ),
  Img: ({ src, style }) => (
    <img src={src} style={style} alt="Test" />
  ),
}));

import { PlayerIntroShort } from './PlayerIntroShort.jsx';

describe('PlayerIntroShort composition', () => {
  const mockProps = {
    player: {
      name: 'LeBron James',
      firstName: 'LeBron',
      lastName: 'James',
      number: '23',
      position: 'SF',
      photo: 'https://example.com/photo.jpg',
      focalPoint: { x: 0.5, y: 0.5 },
    },
    team: {
      name: 'Lakers',
      sport: 'Basketball',
      logo: 'https://example.com/logo.png',
    },
    brand: {
      colors: { primary: '#00a8e8', accent: '#00ff88' },
      fonts: { display: 'Montserrat', body: 'Inter' },
    },
    flags: {
      useAiMotion: false,
    },
  };

  it('should render without crashing', () => {
    const { container } = render(
      <PlayerIntroShort {...mockProps} />
    );
    expect(container).toBeTruthy();
  });

  it('should render with default props', () => {
    const { container } = render(<PlayerIntroShort />);
    expect(container).toBeTruthy();
  });

  it('should display player name', () => {
    const { getByText } = render(
      <PlayerIntroShort {...mockProps} />
    );
    expect(getByText('LeBron')).toBeTruthy();
    expect(getByText('James')).toBeTruthy();
  });

  it('should display player number', () => {
    const { getByText } = render(
      <PlayerIntroShort {...mockProps} />
    );
    expect(getByText('23')).toBeTruthy();
  });

  it('should display player position', () => {
    const { getByText } = render(
      <PlayerIntroShort {...mockProps} />
    );
    expect(getByText('SF')).toBeTruthy();
  });

  it('should display team name', () => {
    const { getByText } = render(
      <PlayerIntroShort {...mockProps} />
    );
    expect(getByText('Lakers')).toBeTruthy();
  });

  it('should display sport', () => {
    const { getByText } = render(
      <PlayerIntroShort {...mockProps} />
    );
    expect(getByText('BASKETBALL')).toBeTruthy();
  });

  it('should render player photo when provided', () => {
    const { getByAltText } = render(
      <PlayerIntroShort {...mockProps} />
    );
    const img = getByAltText('Player');
    expect(img).toBeTruthy();
    expect(img.src).toBe('https://example.com/photo.jpg');
  });

  it('should handle missing player photo gracefully', () => {
    const propsWithoutPhoto = {
      ...mockProps,
      player: { ...mockProps.player, photo: null },
    };
    const { container } = render(
      <PlayerIntroShort {...propsWithoutPhoto} />
    );
    expect(container).toBeTruthy();
  });

  it('should handle custom focal point for photo', () => {
    const propsWithFocalPoint = {
      ...mockProps,
      player: {
        ...mockProps.player,
        focalPoint: { x: 0.7, y: 0.3 },
      },
    };
    const { getByAltText } = render(
      <PlayerIntroShort {...propsWithFocalPoint} />
    );
    const img = getByAltText('Player');
    expect(img.style.objectPosition).toBe('70% 30%');
  });

  it('should handle default focal point when not provided', () => {
    const propsWithoutFocalPoint = {
      ...mockProps,
      player: { ...mockProps.player, focalPoint: undefined },
    };
    const { getByAltText } = render(
      <PlayerIntroShort {...propsWithoutFocalPoint} />
    );
    const img = getByAltText('Player');
    expect(img.style.objectPosition).toBe('50% 50%');
  });

  it('should display CTA text', () => {
    const { getByText } = render(
      <PlayerIntroShort {...mockProps} />
    );
    expect(getByText('GET YOURS TODAY')).toBeTruthy();
    expect(getByText('ORDER NOW')).toBeTruthy();
  });

  it('should indicate AI motion is enabled when flag is true', () => {
    const propsWithAiMotion = {
      ...mockProps,
      flags: { useAiMotion: true },
    };
    const { getByText } = render(
      <PlayerIntroShort {...propsWithAiMotion} />
    );
    expect(getByText('AI Motion: ON')).toBeTruthy();
  });

  it('should not show AI motion indicator when flag is false', () => {
    const propsWithoutAiMotion = {
      ...mockProps,
      flags: { useAiMotion: false },
    };
    const { queryByText } = render(
      <PlayerIntroShort {...propsWithoutAiMotion} />
    );
    expect(queryByText('AI Motion: ON')).toBeFalsy();
  });

  it('should handle missing team data gracefully', () => {
    const propsWithoutTeam = {
      ...mockProps,
      team: {},
    };
    const { container } = render(
      <PlayerIntroShort {...propsWithoutTeam} />
    );
    expect(container).toBeTruthy();
  });

  it('should handle missing brand data gracefully', () => {
    const propsWithoutBrand = {
      ...mockProps,
      brand: {},
    };
    const { container } = render(
      <PlayerIntroShort {...propsWithoutBrand} />
    );
    expect(container).toBeTruthy();
  });

  it('should handle missing flags gracefully', () => {
    const propsWithoutFlags = {
      ...mockProps,
      flags: undefined,
    };
    const { container } = render(
      <PlayerIntroShort {...propsWithoutFlags} />
    );
    expect(container).toBeTruthy();
  });

  it('should use default values for all props', () => {
    const { getByText } = render(
      <PlayerIntroShort
        player={{}}
        team={{}}
        brand={{}}
        flags={{}}
      />
    );
    // Should render with defaults without crashing
    expect(getByText('Player')).toBeTruthy(); // default name
  });

  it('should have tech-themed colors in styles', () => {
    const { getByText } = render(
      <PlayerIntroShort {...mockProps} />
    );
    const playerName = getByText('LeBron');
    // Text shadow should include tech theme colors
    expect(playerName.style.textShadow).toBeTruthy();
  });

  it('should handle special characters in player name', () => {
    const propsWithSpecialName = {
      ...mockProps,
      player: {
        ...mockProps.player,
        firstName: "O'Brien",
        lastName: "Müller-García",
      },
    };
    const { getByText } = render(
      <PlayerIntroShort {...propsWithSpecialName} />
    );
    expect(getByText("O'Brien")).toBeTruthy();
    expect(getByText('Müller-García')).toBeTruthy();
  });

  it('should handle long player names', () => {
    const propsWithLongName = {
      ...mockProps,
      player: {
        ...mockProps.player,
        firstName: 'Alexander',
        lastName: 'Konstantinopolous',
      },
    };
    const { getByText } = render(
      <PlayerIntroShort {...propsWithLongName} />
    );
    expect(getByText('Alexander')).toBeTruthy();
    expect(getByText('Konstantinopolous')).toBeTruthy();
  });

  it('should have correct dimensions applied', () => {
    const { container } = render(
      <PlayerIntroShort {...mockProps} />
    );
    // The AbsoluteFill wrapper should be absolute positioned
    const absoluteFill = container.querySelector('[style*="position: absolute"]');
    expect(absoluteFill).toBeTruthy();
  });

  it('should apply dark background color', () => {
    const { container } = render(
      <PlayerIntroShort {...mockProps} />
    );
    const absoluteFill = container.querySelector('[style*="position: absolute"]');
    // Should have dark background
    expect(absoluteFill.style.backgroundColor).toBe('rgb(10, 14, 39)'); // #0a0e27
  });
});
