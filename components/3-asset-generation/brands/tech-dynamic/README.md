# Tech Dynamic Brand Template

Modern, tech-forward brand designed for teams that want vibrant, cutting-edge graphics. Features Remotion React compositions with advanced animation capabilities.

## Overview

- **Render Engine**: Remotion (React-based)
- **Color Palette**: Cyan (#00a8e8), Deep Blue (#003d82), Neon Green (#00ff88) on dark background (#0a0e27)
- **Style**: Modern, tech-forward, high-energy
- **Target**: Tech companies, esports teams, innovation-focused sports brands

## Structure

```
tech-dynamic/
├── brand.json                 # Brand registry entry (renderEngine: remotion)
├── brand-tokens.css           # CSS custom properties (50+ tokens)
├── meta.json                  # Brand metadata and description
├── print/
│   ├── poster-16x20.psjs      # 16x20 inch poster template (Photoshop UXP)
│   ├── banner-2x6.psjs        # 2x6 inch banner template
│   └── player-card-4x6.psjs   # 4x6 inch player card template
└── README.md                  # This file
```

## Compositions

All compositions are built with **Remotion** (React-based video rendering).

### player-intro-full (30s, 1920x1080)
Full HD player introduction with tech animations
- 30-second duration @ 30 fps
- Three-act structure: Intro (5s) → Main (20s) → Outro (5s)
- Glitch effects, neon glow, dynamic framing
- Player photo, team branding, stats overlay

### player-intro-short (8s, 1080x1920)
Vertical short-form player introduction for social media
- 8-second duration @ 30 fps
- Optimized for Instagram Reels, TikTok, YouTube Shorts
- Fast cuts and transitions
- Quick team branding and highlight text

### team-banner (15s, 1920x1080)
Team roster banner with tech elements
- 15-second duration @ 30 fps
- Animated team logo entrance
- Dynamic player carousel (each ~2 seconds)
- Team stats and season highlights

## Print Templates

All print templates output **300 DPI CMYK PDF** via Photoshop UXP scripts.

### Specifications
- **Poster 16x20**: Large promotional poster with team photo and stats
- **Banner 2x6**: Narrow fundraising/promotional banner
- **Player Card 4x6**: Standard trading card format with tech border

## Usage Example

```javascript
// Queue a render job with tech-dynamic brand
const job = {
  orderId: 'ord_12345',
  teamJsonPath: '/path/to/team.json',
  brandJsonPath: '/path/to/tech-dynamic/brand.json',
  compositionsPath: '/path/to/tech-dynamic',
  outputDir: '/output/videos',
  renderEngine: 'remotion'  // Auto-detected from brand.json
};

// BullMQ worker automatically routes to Remotion
await queue.add('render-video', job);
```

## Customization

### Brand Colors
Edit `brand-tokens.css` to customize:
- Primary blue: `--color-primary`
- Secondary navy: `--color-secondary`
- Accent green: `--color-accent`
- Background: `--color-background-dark`
- Text: `--color-text-primary`

### Composition Logic
Remotion compositions are React components in:
- `../../remotion-templates/src/compositions/PlayerIntroFull.jsx`
- `../../remotion-templates/src/compositions/PlayerIntroShort.jsx`
- `../../remotion-templates/src/compositions/TeamBanner.jsx`

Update React code to modify animations, layout, typography.

## Phase Status

- [x] Brand registry (brand.json) with renderEngine: "remotion"
- [x] CSS tokens (brand-tokens.css)
- [x] Photoshop UXP scripts (placeholder stubs)
- [x] Remotion React compositions (placeholder stubs)
- [ ] Actual Remotion animation implementation (Phase 4)
- [ ] Photoshop UXP implementation (Phase 4)
- [ ] End-to-end testing with both engines (Phase 4)

## Integration

This brand is used in `render-video.test.js` tests to validate Remotion render path:
- Test: "should route to Remotion when renderEngine is remotion"
- Expected: Renders using remotion-client.js when brand.renderEngine === "remotion"

## Related Files

- `src/queue/jobs/render-video.js` — Job handler with engine routing
- `src/pipeline/remotion-client.js` — Remotion REST API wrapper (11 tests)
- `src/queue/jobs/render-video.test.js` — Test suite (10 tests, includes Remotion routing)
