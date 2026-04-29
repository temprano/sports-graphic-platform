/**
 * Tech Dynamic Brand — Team Banner Composition
 * Remotion React composition for video rendering
 * 
 * Duration: 15 seconds (450 frames @ 30 fps)
 * Dimensions: 1920x1080 (Full HD)
 * 
 * Props: {
 *   player: { name, number, position, photo, focalPoint },
 *   team: { name, sport, logo },
 *   brand: { colors, fonts },
 *   flags: { useAiMotion }
 * }
 * 
 * Animation Sequence:
 * - Phase 1 (0-2s): Team logo and intro animation
 * - Phase 2 (2-5s): Player card entrance from right
 * - Phase 3 (5-12s): Player spotlight with stats and animations
 * - Phase 4 (12-15s): Team branding finale and CTA
 */

import { useFrame, useCurrentFrame, interpolate } from 'remotion';

export const TeamBanner = (props) => {
  const { player, team, brand, flags } = props;
  const frame = useCurrentFrame();
  
  // Tech-themed colors
  const primaryColor = brand?.colors?.primary || '#00D4FF';
  const accentColor = brand?.colors?.accent || '#FF006E';
  const bgColor = brand?.colors?.bg || '#0a0e27';
  const secondaryColor = brand?.colors?.secondary || '#003d82';
  
  // Animation phase markers (450 frames total, 15 seconds @ 30fps)
  const PHASE_1_END = 60; // Intro: 0-2s
  const PHASE_2_END = 150; // Player entrance: 2-5s
  const PHASE_3_END = 360; // Player spotlight: 5-12s
  const TOTAL_FRAMES = 450; // Finale: 12-15s
  
  // ========== PHASE 1: Team Intro (0-2s) ==========
  // Team logo fade-in + pulse
  const logoOpacity = frame < PHASE_1_END
    ? interpolate(frame, [0, PHASE_1_END], [0, 1])
    : 1;
  
  const logoPulse = Math.sin(frame * 0.02) * 0.1 + 1; // Pulse from 0.9 to 1.1
  const logoScale = frame < PHASE_1_END
    ? interpolate(frame, [0, PHASE_1_END], [0.5, 0.9]) * logoPulse
    : 0.9 * logoPulse;
  
  // Team name and sport reveal
  const teamTextOpacity = frame < PHASE_1_END
    ? interpolate(frame, [30, PHASE_1_END], [0, 1])
    : 1;
  
  // ========== PHASE 2: Player Card Entrance (2-5s) ==========
  // Player photo slides in from right
  const photoSlideX = frame >= PHASE_1_END && frame < PHASE_2_END
    ? interpolate(Math.max(0, frame - PHASE_1_END), [0, 90], [1920, 300])
    : 300;
  
  const photoOpacity = frame >= PHASE_1_END && frame < PHASE_2_END
    ? interpolate(Math.max(0, frame - PHASE_1_END), [0, 90], [0, 1])
    : 1;
  
  // Player info animates in sequentially
  const playerNameOpacity = frame >= PHASE_1_END + 30 && frame < PHASE_2_END
    ? interpolate(Math.max(0, frame - PHASE_1_END - 30), [0, 60], [0, 1])
    : frame >= PHASE_2_END ? 1 : 0;
  
  const playerNumberOpacity = frame >= PHASE_1_END + 60 && frame < PHASE_2_END
    ? interpolate(Math.max(0, frame - PHASE_1_END - 60), [0, 30], [0, 1])
    : frame >= PHASE_2_END ? 1 : 0;
  
  // ========== PHASE 3: Player Spotlight (5-12s) ==========
  // Animated border glow effect
  const glowSize = Math.sin((frame - PHASE_2_END) * 0.015) * 15 + 25;
  
  // Stats display animation
  const statsOpacity = frame >= PHASE_2_END + 30 && frame < PHASE_3_END
    ? interpolate(Math.max(0, frame - PHASE_2_END - 30), [0, 60], [0, 1])
    : frame >= PHASE_2_END + 90 ? 1 : 0;
  
  // Background accent animation
  const accentHeight = Math.sin((frame - PHASE_2_END) * 0.01) * 200 + 600;
  
  // ========== PHASE 4: Team Finale (12-15s) ==========
  // Team name and social proof fade-in
  const finaleOpacity = frame >= PHASE_3_END
    ? interpolate(Math.max(0, frame - PHASE_3_END), [0, 90], [0, 1])
    : 0;
  
  // Final fade-out (overall)
  const overallOpacity = frame >= PHASE_3_END + 60
    ? interpolate(Math.max(0, frame - PHASE_3_END - 60), [0, 90], [1, 0])
    : 1;
  
  // Consent-based effects
  const posterBlur = flags?.useAiMotion ? 3 : 0;
  const accentBlur = flags?.useAiMotion ? 1 : 0;
  
  return (
    <div style={{
      width: 1920,
      height: 1080,
      backgroundColor: bgColor,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      opacity: overallOpacity,
    }}>
      {/* ========== BACKGROUND ACCENT SHAPE ========== */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 300,
        height: accentHeight,
        background: `linear-gradient(90deg, ${primaryColor}00, ${primaryColor}20, ${accentColor}30)`,
        filter: `blur(${accentBlur}px)`,
        borderRadius: '0 200px 200px 0',
        opacity: 0.6,
      }} />

      {/* ========== TOP ACCENT LINE ========== */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 4,
        background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
        boxShadow: `0 0 20px ${primaryColor}`,
      }} />

      {/* ========== PHASE 1: TEAM INTRO ========== */}
      <div style={{
        position: 'absolute',
        top: 80,
        left: 100,
        opacity: logoOpacity,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        zIndex: 10,
      }}>
        {team?.logo && (
          <img
            src={team.logo}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: `3px solid ${primaryColor}`,
              boxShadow: `0 0 30px ${primaryColor}`,
              objectFit: 'cover',
              transform: `scale(${logoScale})`,
            }}
            alt={team.name}
          />
        )}
        <div style={{
          opacity: teamTextOpacity,
        }}>
          <div style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: primaryColor,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            {team?.name || 'TEAM'}
          </div>
          <div style={{
            fontSize: 24,
            color: accentColor,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
            {team?.sport || 'SPORT'}
          </div>
        </div>
      </div>

      {/* ========== PHASE 2 & 3: PLAYER CARD ========== */}
      {player?.photo && (
        <div style={{
          position: 'absolute',
          left: `${photoSlideX}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: photoOpacity,
          zIndex: 8,
        }}>
          <div style={{
            position: 'relative',
            width: 400,
            height: 550,
          }}>
            <img
              src={player.photo}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: player?.focalPoint
                  ? `${player.focalPoint.x * 100}% ${player.focalPoint.y * 100}%`
                  : '50% 50%',
                borderRadius: 8,
                filter: `blur(${posterBlur}px)`,
                border: `3px solid ${accentColor}`,
              }}
              alt="Player"
            />
            {/* Animated glow border */}
            <div style={{
              position: 'absolute',
              inset: -12,
              border: `2px solid ${primaryColor}`,
              borderRadius: 8,
              boxShadow: `0 0 ${glowSize}px ${primaryColor}, inset 0 0 ${glowSize * 0.5}px ${accentColor}`,
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      )}

      {/* ========== PLAYER INFO ========== */}
      <div style={{
        position: 'absolute',
        right: 100,
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: playerNameOpacity,
        zIndex: 8,
      }}>
        <h2 style={{
          fontSize: 72,
          fontWeight: 'bold',
          margin: '0 0 10px 0',
          color: primaryColor,
          textShadow: `0 0 20px ${primaryColor}`,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}>
          {player?.name || 'PLAYER'}
        </h2>
        <div style={{
          fontSize: 48,
          color: accentColor,
          textShadow: `0 0 15px ${accentColor}`,
          marginBottom: 30,
          letterSpacing: 1,
        }}>
          #{player?.number || '--'} · {player?.position || 'POS'}
        </div>
      </div>

      {/* ========== STATS BADGE ========== */}
      {player?.stats && Object.keys(player.stats).length > 0 && (
        <div style={{
          position: 'absolute',
          right: 100,
          bottom: 150,
          opacity: statsOpacity,
          background: `linear-gradient(135deg, ${secondaryColor}DD, ${bgColor}DD)`,
          padding: 25,
          borderRadius: 10,
          border: `2px solid ${accentColor}`,
          backdropFilter: 'blur(8px)',
          minWidth: 280,
          zIndex: 8,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 15,
          }}>
            {Object.entries(player.stats).slice(0, 2).map(([key, value], idx) => (
              <div key={idx}>
                <div style={{
                  fontSize: 14,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 5,
                }}>
                  {key}
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: primaryColor,
                }}>
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== PHASE 4: TEAM FINALE ========== */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: finaleOpacity,
        textAlign: 'center',
        zIndex: 10,
      }}>
        <div style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: primaryColor,
          textTransform: 'uppercase',
          letterSpacing: 2,
          textShadow: `0 0 25px ${primaryColor}`,
          borderTop: `2px solid ${accentColor}`,
          borderBottom: `2px solid ${accentColor}`,
          padding: '12px 30px',
        }}>
          OFFICIAL COLLECTION
        </div>
      </div>

      {/* ========== BOTTOM ACCENT LINE ========== */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 4,
        background: `linear-gradient(90deg, ${accentColor}, ${primaryColor})`,
        boxShadow: `0 0 20px ${accentColor}`,
      }} />

      {/* ========== BACKGROUND GRID ========== */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(90deg, transparent 48%, ${primaryColor}15 50%, transparent 52%), linear-gradient(0deg, transparent 48%, ${primaryColor}15 50%, transparent 52%)`,
        backgroundSize: '150px 150px',
        opacity: 0.08,
        pointerEvents: 'none',
      }} />
    </div>
  );
};

export default TeamBanner;
