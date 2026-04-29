/**
 * Tech Dynamic Brand — Player Intro Full Composition
 * Remotion React composition for video rendering
 * 
 * Duration: 30 seconds (900 frames @ 30 fps)
 * Dimensions: 1920x1080 (Full HD)
 * 
 * Props: {
 *   player: { name, firstName, lastName, number, position, photo, focalPoint, stats },
 *   team: { name, sport, logo },
 *   brand: { colors, fonts },
 *   flags: { useAiMotion }
 * }
 * 
 * Animation Sequence:
 * - Phase 1 (0-3s): Intro — Team branding, tech accent lines
 * - Phase 2 (3-7s): Player reveal — Name and position with glow
 * - Phase 3 (7-23s): Main showcase — Player photo, stats, position highlight
 * - Phase 4 (23-28s): Team close-up — Logo, team name, accomplishments
 * - Phase 5 (28-30s): CTA & fade — Call-to-action, final branding
 */

import { useFrame, useCurrentFrame, interpolate } from 'remotion';

export const PlayerIntroFull = (props) => {
  const { player, team, brand, flags } = props;
  const frame = useCurrentFrame();
  
  // Tech-themed colors
  const primaryColor = brand?.colors?.primary || '#00D4FF';
  const accentColor = brand?.colors?.accent || '#FF006E';
  const bgColor = brand?.colors?.bg || '#0a0e27';
  const secondaryColor = brand?.colors?.secondary || '#003d82';
  
  // Animation phase markers (900 frames total, 30 seconds @ 30fps)
  const PHASE_1_END = 90; // Intro: 0-3s
  const PHASE_2_END = 210; // Player reveal: 3-7s
  const PHASE_3_END = 690; // Main showcase: 7-23s
  const PHASE_4_END = 840; // Team close-up: 23-28s
  const TOTAL_FRAMES = 900; // Outro: 28-30s
  
  // ========== PHASE 1: Intro (0-3s) ==========
  // Team logo fade-in + scale
  const logoOpacity = frame < PHASE_1_END ? interpolate(frame, [0, PHASE_1_END], [0, 1]) : 1;
  const logoScale = frame < PHASE_1_END ? interpolate(frame, [0, PHASE_1_END], [0.7, 1]) : 1;
  
  // Tech accent line animation
  const accentLineWidth = frame < PHASE_1_END
    ? interpolate(frame, [0, PHASE_1_END], [0, 1920])
    : 1920;
  
  // ========== PHASE 2: Player Reveal (3-7s) ==========
  // Player name fade-in + scale
  const nameOpacity = frame >= PHASE_1_END && frame < PHASE_2_END
    ? interpolate(Math.max(0, frame - PHASE_1_END), [0, 120], [0, 1])
    : frame >= PHASE_2_END ? 1 : 0;
  
  const nameScale = frame >= PHASE_1_END && frame < PHASE_2_END
    ? interpolate(Math.max(0, frame - PHASE_1_END), [0, 120], [0.8, 1])
    : frame >= PHASE_2_END ? 1 : 0;
  
  // Number and position glow
  const numberGlow = frame >= PHASE_1_END && frame < PHASE_2_END
    ? interpolate(Math.max(0, frame - PHASE_1_END), [0, 120], [0, 40])
    : frame >= PHASE_2_END ? 40 : 0;
  
  // ========== PHASE 3: Main Showcase (7-23s) ==========
  // Player photo entrance + slide
  const photoOpacity = frame >= PHASE_2_END && frame < PHASE_3_END
    ? interpolate(Math.max(0, frame - PHASE_2_END), [0, 60], [0, 1])
    : frame >= PHASE_3_END ? 1 : 0;
  
  const photoSlide = frame >= PHASE_2_END && frame < PHASE_3_END
    ? interpolate(Math.max(0, frame - PHASE_2_END), [0, 60], [-200, 0])
    : 0;
  
  // Stats panel animated entrance (staggered)
  const statsOpacity = frame >= PHASE_2_END + 60 && frame < PHASE_3_END
    ? interpolate(Math.max(0, frame - PHASE_2_END - 60), [0, 60], [0, 1])
    : frame >= PHASE_2_END + 120 ? 1 : 0;
  
  // Photo glow pulse
  const glowIntensity = Math.sin((frame - PHASE_2_END) * 0.02) * 20 + 30;
  
  // ========== PHASE 4: Team Close-up (23-28s) ==========
  // Team branding fade-in
  const teamLogoOpacity = frame >= PHASE_3_END && frame < PHASE_4_END
    ? interpolate(Math.max(0, frame - PHASE_3_END), [0, 75], [0, 1])
    : frame >= PHASE_4_END ? 1 : 0;
  
  const teamScale = frame >= PHASE_3_END && frame < PHASE_4_END
    ? interpolate(Math.max(0, frame - PHASE_3_END), [0, 75], [0.6, 1])
    : frame >= PHASE_4_END ? 1 : 0;
  
  // Achievement count animation
  const achievementCount = frame >= PHASE_3_END + 30 && frame < PHASE_4_END
    ? Math.floor(interpolate(Math.max(0, frame - PHASE_3_END - 30), [0, 120], [0, 1.5]))
    : 1;
  
  // ========== PHASE 5: Outro (28-30s) ==========
  // Final fade-out
  const finalOpacity = frame >= PHASE_4_END
    ? interpolate(Math.max(0, frame - PHASE_4_END), [0, 60], [1, 0])
    : 1;
  
  // Consent-based effects
  const posterBlur = flags?.useAiMotion ? 3 : 0;
  const statsBlur = flags?.useAiMotion ? 2 : 0;
  
  return (
    <div style={{
      width: 1920,
      height: 1080,
      backgroundColor: bgColor,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      fontFamily: brand?.fonts?.primary || 'Arial',
      overflow: 'hidden',
      position: 'relative',
      opacity: finalOpacity,
    }}>
      {/* ========== TOP ACCENT LINE ========== */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: accentLineWidth,
        height: 6,
        background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
        boxShadow: `0 0 30px ${primaryColor}`,
        opacity: logoOpacity,
      }} />

      {/* ========== PHASE 1: INTRO SECTION ========== */}
      <div style={{
        position: 'absolute',
        top: 100,
        left: 80,
        opacity: logoOpacity,
        transform: `scale(${logoScale})`,
        display: 'flex',
        alignItems: 'center',
        gap: 30,
      }}>
        {team?.logo && (
          <img
            src={team.logo}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: `3px solid ${primaryColor}`,
              boxShadow: `0 0 25px ${primaryColor}80`,
              objectFit: 'cover',
            }}
            alt={team.name}
          />
        )}
        <div style={{ color: primaryColor }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', letterSpacing: 2 }}>
            {team?.name || 'TEAM'}
          </div>
          <div style={{ fontSize: 20, color: accentColor, letterSpacing: 1 }}>
            {team?.sport || 'SPORT'}
          </div>
        </div>
      </div>

      {/* ========== PHASE 2: PLAYER NAME REVEAL ========== */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        opacity: nameOpacity,
        zIndex: 10,
      }}>
        <h1 style={{
          fontSize: 96,
          fontWeight: 'bold',
          margin: 0,
          color: primaryColor,
          textShadow: `0 0 ${numberGlow}px ${primaryColor}, 0 0 ${numberGlow * 0.5}px ${accentColor}`,
          transform: `scale(${nameScale})`,
          textTransform: 'uppercase',
          letterSpacing: 3,
        }}>
          {player?.name || 'PLAYER'}
        </h1>
        <div style={{
          fontSize: 56,
          color: accentColor,
          marginTop: 20,
          letterSpacing: 2,
          textShadow: `0 0 20px ${accentColor}80`,
        }}>
          #{player?.number || '--'} · {player?.position || 'POS'}
        </div>
      </div>

      {/* ========== PHASE 3: MAIN SHOWCASE - PLAYER PHOTO ========== */}
      {player?.photo && (
        <div style={{
          position: 'absolute',
          left: `${100 + photoSlide}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: photoOpacity,
          zIndex: 5,
        }}>
          <div style={{
            position: 'relative',
            width: 500,
            height: 700,
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
                border: `4px solid ${accentColor}`,
              }}
              alt="Player"
            />
            {/* Glow effect around photo */}
            <div style={{
              position: 'absolute',
              inset: -10,
              border: `2px solid ${primaryColor}`,
              borderRadius: 8,
              boxShadow: `0 0 ${glowIntensity}px ${primaryColor}, inset 0 0 ${glowIntensity * 0.5}px ${accentColor}`,
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      )}

      {/* ========== PHASE 3: STATS OVERLAY ========== */}
      <div style={{
        position: 'absolute',
        right: 80,
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: statsOpacity,
        background: `linear-gradient(135deg, ${secondaryColor}CC, ${bgColor}CC)`,
        padding: 40,
        borderRadius: 12,
        border: `2px solid ${primaryColor}`,
        backdropFilter: 'blur(10px)',
        minWidth: 300,
        zIndex: 5,
      }}>
        <div style={{
          color: primaryColor,
          fontSize: 20,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 20,
          fontWeight: 'bold',
        }}>
          SEASON STATS
        </div>
        
        {player?.stats && Object.keys(player.stats).length > 0 ? (
          <div style={{ display: 'grid', gap: 15 }}>
            {Object.entries(player.stats).slice(0, 4).map(([key, value], idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 18,
                color: '#ffffff',
                filter: `blur(${statsBlur}px)`,
                opacity: 0.9,
              }}>
                <span style={{ color: accentColor }}>{key}:</span>
                <span style={{ fontWeight: 'bold', color: primaryColor }}>
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: 16,
            color: accentColor,
            fontStyle: 'italic',
          }}>
            Stats coming soon
          </div>
        )}
      </div>

      {/* ========== PHASE 4: TEAM CLOSE-UP ========== */}
      <div style={{
        position: 'absolute',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: teamLogoOpacity,
        textAlign: 'center',
        zIndex: 8,
      }}>
        {team?.logo && (
          <img
            src={team.logo}
            style={{
              width: 150,
              height: 150,
              borderRadius: '50%',
              border: `3px solid ${primaryColor}`,
              boxShadow: `0 0 40px ${primaryColor}`,
              objectFit: 'cover',
              transform: `scale(${teamScale})`,
              marginBottom: 20,
            }}
            alt={team.name}
          />
        )}
        <div style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: primaryColor,
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginBottom: 10,
        }}>
          {team?.name || 'TEAM'}
        </div>
        <div style={{
          fontSize: 24,
          color: accentColor,
          letterSpacing: 1,
        }}>
          🏆 {achievementCount} Championship{'s' === 's' ? 's' : ''}
        </div>
      </div>

      {/* ========== PHASE 5: CTA & OUTRO ========== */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: finalOpacity,
        textAlign: 'center',
        zIndex: 10,
      }}>
        <div style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginBottom: 15,
          textShadow: `0 0 20px ${accentColor}`,
        }}>
          EXCLUSIVE COLLECTION
        </div>
        <div style={{
          fontSize: 36,
          fontWeight: 'bold',
          color: primaryColor,
          textShadow: `0 0 30px ${primaryColor}`,
          borderTop: `2px solid ${primaryColor}`,
          borderBottom: `2px solid ${primaryColor}`,
          padding: '10px 20px',
          display: 'inline-block',
        }}>
          ORDER NOW
        </div>
      </div>

      {/* ========== BOTTOM ACCENT LINE ========== */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: accentLineWidth,
        height: 6,
        background: `linear-gradient(90deg, ${accentColor}, ${primaryColor})`,
        boxShadow: `0 0 30px ${accentColor}`,
        opacity: logoOpacity,
      }} />

      {/* ========== BACKGROUND GRID ========== */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(90deg, transparent 48%, ${primaryColor}20 50%, transparent 52%), linear-gradient(0deg, transparent 48%, ${primaryColor}20 50%, transparent 52%)`,
        backgroundSize: '100px 100px',
        opacity: 0.1,
        pointerEvents: 'none',
      }} />
    </div>
  );
};

export default PlayerIntroFull;
