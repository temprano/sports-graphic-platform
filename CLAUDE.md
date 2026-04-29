# Sports Graphics Platform — Claude Code Context

## Project Overview
An automated AI-driven sports team photo and print fulfillment platform.
Customers order team/player motion graphics and print products. The system
batch-renders personalized assets using HTML templates, AI image processing,
and programmatic video/print pipelines, then fulfills via Prodigi/Printful
drop-ship or customer download.

## Four Core Components

| # | Component | Purpose |
|---|-----------|---------|
| 1 | Customer Web App | Order entry, brand builder, photo upload, payment |
| 2 | Automation Pipeline | ComfyUI → Hyperframes/Remotion → Photoshop UXP |
| 3 | Asset Generation | Brand templates, composition library, token registry |
| 4 | Business Backend | CRM, orders, financials, parent store, marketing |

## Current Focus
> Updated: April 29, 2026 — 19:30 UTC
- [x] Component 2 — Automation pipeline (video + print + packaging complete)
- [x] Component 3 — Asset generation (brand templates, Hyperframes + Remotion support)
- [x] Remotion integration Phase 1-4 (architecture, infrastructure, testing, 3 compositions, print templates)
- [x] Phase 4 — Remotion animation implementation + print templates deployed ✅
- [x] End-to-end video rendering demo (ffmpeg-encoded valid MP4 generation) ✅
- [ ] **Component 1 — Customer web app (Next.js + Stripe + Appwrite)** ← NEXT PRIORITY

## Tech Stack Summary
- **Runtime**: Node.js ESM (`.mjs` or `"type": "module"` in package.json)
- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Database**: Appwrite (Cloud for dev, self-hosted VPS for prod)
- **Video Rendering**: Hyperframes (compositions) + Remotion (React JSX)
  - Hyperframes: HTML/GSAP compositions, selected via `brand.renderEngine: "hyperframes"`
  - Remotion: React components, selected via `brand.renderEngine: "remotion"`
  - Engine selection in brand.json determines render path
  - Supported brands: cinematic-dark (Hyperframes), tech-dynamic (Remotion)
- **Print Rendering**: Photoshop UXP scripting
- **AI Image**: ComfyUI (BiRefNet masking, FLUX generation)
- **Animation**: GSAP inside Hyperframes compositions
- **Photo Validation**: Transformers.js v4 (client-side, browser)
- **Payments**: Stripe (two-stage: deposit + balance)
- **Fulfillment**: Prodigi / Printful
- **Job Queue**: BullMQ (Redis-backed)
- **VPS**: Hostinger KVM2 (Ubuntu 24.04) — same as OpenClaw
- **Process Manager**: PM2 with ecosystem.config.cjs (ESM compat)
- **Tunnel**: Tailscale (VPS ↔ local Windows dev machine)

## Architecture Rules — Never Violate These

1. **Brand and data are always separate.** Brand folders contain zero
   player-specific data. team.json contains zero layout/animation logic.

2. **No asset URLs are ever public or permanent.** All proof assets served
   via signed short-lived URLs through authenticated endpoints only.

3. **Consent is checked before every AI enhancement.** The pipeline reads
   `consentLog` per player before applying pose adjustment or AI motion.
   If consent flag is false, pipeline uses the fallback render path.

4. **Finals never render until PROOF_APPROVED + PAID_IN_FULL are both true.**
   These are checked as a compound condition, never individually.

5. **All download links are single-use and expire in 48 hours.**

6. **ESM throughout.** No `require()`. No `.cjs` except PM2 ecosystem config.

7. **Tests before code.** Write the test, confirm it fails, then implement.

## Order State Machine
```
PENDING_PAYMENT → IN_PRODUCTION → PENDING_PROOF_REVIEW
→ PROOF_REVISION_REQUESTED → PROOF_APPROVED
→ PENDING_FINAL_PAYMENT → PAID_IN_FULL
→ FULFILLMENT → DELIVERED
```

## Key Data Contracts
See `SCHEMA.md` for full definitions.
- `team.json` — brand, colors, fonts, logo, players, deliverables, consent
- `order.json` — order state, payment records, proof log, fulfillment status
- `brand.json` — template registry entry (one per brand in Component 3)

## What NOT To Do
- Do not hardcode hex values in compositions — always use CSS custom props
- Do not store full-resolution finals in public Appwrite buckets
- Do not skip the consent check even for "obviously fine" enhancements
- Do not use CommonJS modules in application code
- Do not implement payment release logic outside the order state machine
- Do not generate parent store assets from unapproved team order proofs
- Do not use `any` type in TypeScript files
- Do not commit `.env` files — use `.env.example` with all keys documented

## Session Start Checklist
1. Read this file
2. Read `TODO.md` for current sprint tasks
3. Read `CONVENTIONS.md` for code standards
4. Check which component you are working in
5. Confirm tests exist before writing implementation code
