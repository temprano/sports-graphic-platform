# Component 3 — Asset Generation Pipeline

Brand template library. HTML + GSAP compositions for Hyperframes/Remotion
video rendering. Photoshop UXP scripts for print assets. Brand registry
(brand.json per brand). CSS custom property token system.

This is your internal creative studio layer — built first, before any
customer-facing code. A working brand template is the contract that
Components 1 and 2 build against.

## Start Here
See `/ARCHITECTURE.md` Component 3 section.
See `/docs/STYLE.md` for CSS token conventions, animation guidelines,
watermark spec, and print color profiles.
See `/SCHEMA.md` for the brand.json registry schema.
See `/TODO.md` Component 3 section for current tasks.

## Build Order
**This component is built first.** Prove one complete brand renders
correctly end-to-end before building the pipeline or customer UX.

## Brand Folder Structure
```
brands/
└── [brand-slug]/
    ├── brand.json                  registry entry + token schema
    ├── brand-tokens.css            CSS custom properties
    ├── preview/
    │   ├── thumbnail.jpg           shown in Component 1 brand selector
    │   └── demo.mp4                animated preview loop
    ├── compositions/
    │   ├── player-intro-full.html  30s 16:9
    │   ├── player-intro-short.html 8s 9:16
    │   └── team-banner.html        15s 16:9
    └── print/
        ├── poster-16x20.psjs       Photoshop UXP script
        ├── banner-2x6.psjs
        └── player-card-4x6.psjs
```

## Token Rule
No hardcoded hex values anywhere in compositions or print scripts.
Every color, font, and dimension that a customer can change must be
a CSS custom property defined in brand-tokens.css.

## Current Brands
| Slug | Status | Description |
|------|--------|-------------|
| cinematic-dark | 🔲 In progress | Bold, dramatic, high contrast |
