# Style Guide

## Design Philosophy

Brand templates are **token-driven**. Every visual value that a customer
can customize must be a CSS custom property. No hardcoded hex values,
font names, or pixel dimensions in composition files.

---

## CSS Custom Property Naming

All brand tokens follow this pattern:
```css
--brand-[category]-[variant]
```

### Required Tokens (all brands must define these)
```css
:root {
  /* Colors */
  --brand-color-primary: #1a1a2e;      /* dominant background */
  --brand-color-accent: #e94560;       /* highlights, borders, emphasis */
  --brand-color-text: #ffffff;         /* primary text */
  --brand-color-background: #0f0f23;  /* deepest background layer */

  /* Typography */
  --brand-font-heading: 'Bebas Neue', sans-serif;
  --brand-font-body: 'Inter', sans-serif;

  /* Derived (computed from above, not customer-set) */
  --brand-color-primary-80: color-mix(in srgb, var(--brand-color-primary) 80%, transparent);
  --brand-color-accent-20: color-mix(in srgb, var(--brand-color-accent) 20%, transparent);
}
```

### Optional Tokens (brand-specific)
```css
:root {
  --brand-color-secondary: #16213e;
  --brand-color-glow: rgba(233, 69, 96, 0.4);
  --brand-gradient-hero: linear-gradient(135deg, var(--brand-color-primary), var(--brand-color-background));
  --brand-shadow-player: 0 0 40px var(--brand-color-glow);
}
```

---

## Composition Layout Rules

### Safe Zones
All compositions must keep critical content within safe zones to
accommodate edge bleed in print and UI chrome on video platforms.

```
Video compositions:
  Top/Bottom: 10% safe zone (no text or logos)
  Left/Right: 7% safe zone

Print compositions:
  All edges: 0.125" bleed area
  Critical content: 0.25" inside trim
```

### Player Photo Container
Player cutout photos are always positioned relative to a defined
focal point. The focalPoint field in team.json drives this.

```css
.player-photo {
  object-fit: cover;
  object-position: calc(var(--focal-x, 50%) * 100%) calc(var(--focal-y, 30%) * 100%);
}
```

### Typography Scale
```css
/* Video compositions (1920x1080 base) */
--type-display:  clamp(80px, 8vw, 140px);   /* player name */
--type-headline: clamp(40px, 4vw, 72px);    /* number, position */
--type-body:     clamp(20px, 2vw, 32px);    /* stats, details */
--type-caption:  clamp(14px, 1.5vw, 22px);  /* fine print */
```

---

## Animation Guidelines (GSAP)

### Timing Conventions
```javascript
// Standard durations
const DURATION = {
  instant:  0.15,
  fast:     0.3,
  normal:   0.6,
  slow:     1.0,
  cinematic: 1.8
};

// Standard easing
const EASE = {
  enter:  'power3.out',
  exit:   'power2.in',
  bounce: 'back.out(1.4)',
  smooth: 'sine.inOut'
};
```

### Composition Structure
Every composition follows this timeline structure:
```
0s   → 1s   : Intro / background establish
1s   → 3s   : Player photo entrance
3s   → 6s   : Name and number reveal
6s   → 10s  : Stats / details
10s  → 12s  : Logo / team branding
12s  → 14s  : Hold
14s  → 15s  : Outro / fade
```
Short-form (8s) compositions compress to:
```
0s   → 1s   : Background
1s   → 2s   : Player entrance
2s   → 5s   : Name + key stat
5s   → 7s   : Logo
7s   → 8s   : Outro
```

### AI Motion Guidelines
When `consentLog.aiMotion === true`, subtle motion only:
- Head turn: max 15 degrees, eased over 1.5s
- Breath simulation: scale 1.0 → 1.008, 3s sine loop
- Eye movement: max 8px shift

Never: lip movement, full body repositioning, expression change.

---

## Watermark Spec

Proof watermarks are baked into pixel data. Spec:

```
Text:     "PROOF · [ORDER_ID] · NOT FOR REPRODUCTION"
Font:     Inter Bold, all caps
Size:     3.5% of longest dimension
Color:    rgba(255, 255, 255, 0.35)
Angle:    -35 degrees
Pattern:  Tiled, covering full frame
Spacing:  200px between repeats
```

For video, watermark is composited onto every frame by FFmpeg:
```bash
ffmpeg -i input.mp4 -vf \
  "drawtext=text='PROOF · ${ORDER_ID}':fontsize=28:fontcolor=white@0.35:\
  x=mod(t*0+n*220\,w):y=mod(n*80\,h):angle=-0.61" \
  -c:a copy output_proof.mp4
```

---

## Print Color Profiles

All print assets use CMYK color space:
- Color profile: US Web Coated (SWOP) v2
- Black: Rich black for large areas `(C:60 M:40 Y:40 K:100)`
- Black: True black for text `(C:0 M:0 Y:0 K:100)`
- Resolution: 300 DPI minimum for all print products

---

## Brand Preview Assets

Each brand must include:
- `thumbnail.jpg` — 800x450px, shows composition at a glance
- `demo.mp4` — 6-8s loop, 1280x720, shows animation style
- `print-preview.jpg` — 600x800px, shows poster layout

These are shown to customers in the brand selector in Component 1.
