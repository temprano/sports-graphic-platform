/**
 * Tech Dynamic Brand — Player Intro Short Composition
 * Remotion React composition for video rendering
 * 
 * Duration: 8 seconds (240 frames @ 30 fps)
 * Dimensions: 1080x1920 (Vertical for social media)
 * 
 * Props: {
 *   player: { name, firstName, lastName, number, position, photo, focalPoint },
 *   team: { name, sport, logo },
 *   brand: { colors, fonts },
 *   flags: { useAiMotion }
 * }
 * 
 * Structure (8 seconds):
 * - 0-2s: Intro — Team branding and entrance
 * - 2-6s: Main — Player showcase with stats and photo
 * - 6-8s: Outro — Call-to-action and team logo
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  AbsoluteFill,
  Img,
} from 'remotion';

/**
 * Glitch Effect Component
 * Tech-themed visual effect with offset layers
 */
const GlitchEffect = ({ children, intensity = 0.02, enabled = true }) => {
  if (!enabled) return children;

  const offsetX = Math.random() * intensity * 100 - (intensity * 100) / 2;
  const offsetY = Math.random() * intensity * 100 - (intensity * 100) / 2;

  return (
    <div
      style={{
        position: 'relative',
        transform: `translate(${offsetX}px, ${offsetY}px)`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Neon Glow Effect
 * Cyan glow border for tech aesthetic
 */
const NeonGlow = ({ color = '#00a8e8', intensity = 1, children }) => (
  <div
    style={{
      position: 'relative',
      boxShadow: `0 0 ${20 * intensity}px ${color}`,
      border: `2px solid ${color}`,
    }}
  >
    {children}
  </div>
);

/**
 * PlayerIntroShort — 8-second vertical player introduction
 */
export const PlayerIntroShort = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Unpack props with defaults
  const {
    player = {},
    team = {},
    brand = { colors: {}, fonts: {} },
    flags = { useAiMotion: false },
  } = props;

  const {
    name = 'Player',
    firstName = 'First',
    lastName = 'Last',
    number = '00',
    position = 'Position',
    photo = null,
    focalPoint = { x: 0.5, y: 0.5 },
  } = player;

  const { name: teamName = 'Team', sport = 'Sport' } = team;
  const { useAiMotion } = flags;

  // Timeline segments (in frames at 30 fps)
  // Total 240 frames = 8 seconds
  const introEnd = fps * 2; // 0-2s: intro
  const mainEnd = fps * 6; // 2-6s: main content
  const outroEnd = fps * 8; // 6-8s: outro

  // ─── INTRO PHASE (0-2s) ───────────────────────────────────────────
  const introProgress = interpolate(
    frame,
    [0, introEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Team name slides in from top
  const teamNameTranslateY = interpolate(introProgress, [0, 1], [-100, 0]);
  const teamNameOpacity = interpolate(introProgress, [0, 0.5, 1], [0, 0.5, 1]);

  // ─── MAIN PHASE (2-6s) ────────────────────────────────────────────
  const mainProgress = interpolate(
    frame,
    [introEnd, mainEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Player photo scales in with glitch effect
  const photoScale = interpolate(mainProgress, [0, 0.2, 1], [0.8, 1.05, 1]);
  const photoOpacity = interpolate(mainProgress, [0, 0.3, 1], [0, 0.8, 1]);
  const photoRotate = interpolate(mainProgress, [0, 1], [5, 0]);

  // Stats overlay fades in
  const statsOpacity = interpolate(mainProgress, [0.3, 0.6, 1], [0, 0.5, 1]);
  const statsTranslateX = interpolate(mainProgress, [0.3, 1], [50, 0]);

  // Player name slides in from left
  const nameTranslateX = interpolate(mainProgress, [0.4, 0.8], [-200, 0]);
  const nameOpacity = interpolate(mainProgress, [0.4, 0.8], [0, 1]);

  // ─── OUTRO PHASE (6-8s) ────────────────────────────────────────────
  const outroProgress = interpolate(
    frame,
    [mainEnd, outroEnd],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Everything fades to call-to-action
  const contentOpacity = interpolate(outroProgress, [0, 0.5, 1], [1, 0.5, 0]);
  const ctaOpacity = interpolate(outroProgress, [0.3, 0.7, 1], [0, 1, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0e27',
        fontFamily: '"Inter", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ─── INTRO: Team Branding ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: teamNameOpacity,
          transform: `translateY(${teamNameTranslateY}px)`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#00ff88',
            letterSpacing: 2,
            textShadow: '0 0 10px #00ff88',
          }}
        >
          {sport?.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#00a8e8',
            marginTop: 8,
            textShadow: '0 0 15px #00a8e8',
          }}
        >
          {teamName}
        </div>
      </div>

      {/* ─── MAIN: Player Content ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: contentOpacity,
        }}
      >
        {/* Player Photo */}
        {photo && (
          <div
            style={{
              position: 'relative',
              width: 320,
              height: 360,
              marginTop: 80,
              marginBottom: 40,
              opacity: photoOpacity,
              transform: `scale(${photoScale}) rotate(${photoRotate}deg)`,
            }}
          >
            <NeonGlow color="#00a8e8" intensity={0.8}>
              <img
                src={photo}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: `${(focalPoint?.x || 0.5) * 100}% ${(focalPoint?.y || 0.5) * 100}%`,
                }}
                alt="Player"
              />
            </NeonGlow>
          </div>
        )}

        {/* Player Name */}
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 8,
            opacity: nameOpacity,
            transform: `translateX(${nameTranslateX}px)`,
            textShadow: '0 0 10px rgba(0, 168, 232, 0.5)',
          }}
        >
          {firstName} {lastName}
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 20,
            opacity: statsOpacity,
            transform: `translateX(${statsTranslateX}px)`,
          }}
        >
          {/* Number */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#00ff88',
                marginBottom: 4,
                textShadow: '0 0 8px #00ff88',
              }}
            >
              #
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              {number}
            </div>
          </div>

          {/* Position */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: '#00ff88',
                marginBottom: 4,
                textShadow: '0 0 8px #00ff88',
              }}
            >
              POS
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {position}
            </div>
          </div>
        </div>
      </div>

      {/* ─── OUTRO: Call-to-Action ────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: ctaOpacity,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#00a8e8',
            marginBottom: 12,
            textShadow: '0 0 15px #00a8e8',
          }}
        >
          GET YOURS TODAY
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#00ff88',
            letterSpacing: 1,
            textShadow: '0 0 10px #00ff88',
          }}
        >
          ORDER NOW
        </div>
      </div>

      {/* ─── AI Motion Indicator (Debug) ──────────────────────────── */}
      {useAiMotion && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            fontSize: 12,
            color: '#00ff88',
            opacity: 0.5,
            fontFamily: 'monospace',
          }}
        >
          AI Motion: ON
        </div>
      )}
    </AbsoluteFill>
  );
};

export default PlayerIntroShort;

