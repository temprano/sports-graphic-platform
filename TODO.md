# TODO

Living task list. Updated with Remotion Phase 3 completion (April 28, 2026).
Format: `- [x]` done · `- [ ]` pending · `- [~]` in progress · `- [-]` blocked

**Status Overview:** 41 tasks complete, 53 pending (44% done)  
**Last Updated:** April 28, 2026 — 16:00 UTC (Session: Phase 3 tests + second brand complete, +10 render-video tests, +3 JSX stubs)

---

## 🎯 Current Sprint Focus

### Active Now
1. **Component 4 — Core Business Logic** (65% complete)
   - ✅ Order state machine (48 tests + implementation)
   - ✅ Consent gate (39 tests + implementation)
   - ✅ Payment flows (35 tests + implementation)
   - ✅ Photo validation (52 tests + implementation)
   - ✅ Appwrite Collections CRUD (30 tests + implementation)
   - ⏳ Individual job implementations (next priority)

3. **Component 3 — Asset Generation** (70% complete)
   - ✅ Brand validator skeleton
   - ✅ First brand template (cinematic-dark) — COMPLETE & TESTED
     - ✅ brand.json (schema v1.0, 3 video compositions, 3 print formats)
     - ✅ brand-tokens.css (40+ CSS custom properties, no hardcoded values)
     - ✅ player-intro-full composition (1920x1080, 30fps, tested)
     - ✅ Photoshop print scripts (poster-16x20, banner-2x6, player-card-4x6)
   - ✅ Second brand template (tech-dynamic) — COMPLETE
     - ✅ brand.json with renderEngine: "remotion"
     - ✅ brand-tokens.css (50+ CSS tokens)
     - ✅ Remotion React composition stubs (3 compositions)
     - ✅ Photoshop print script stubs (3 scripts)
   - ⏳ Remotion React composition implementation (Phase 4)
   - ⏳ Third brand template (optional)

3. **Component 2 — Automation Pipeline** (90% complete)
   - ✅ BullMQ + Redis initialized
   - ✅ Worker entry point (src/queue/worker.js)
   - ✅ Job dispatcher with type registry
   - ✅ process-photos job (BiRefNet integration, 17 tests)
   - ✅ Logger utility (structured JSON logging)
   - ✅ render-video job (Hyperframes + Remotion router, 6 tests + Phase 1-2 architecture)
   - ✅ render-print job (Photoshop UXP, 6 tests, consent gates)
   - ✅ package-order job (manifest creation, 5 tests)
   - ✅ hyperframes-client.js REST wrapper (9 tests, 5-min timeout)
   - ✅ photoshop-client.js REST wrapper (9 tests, 5-min timeout)
   - ✅ remotion-client.js REST wrapper (11 tests, 10-min timeout) — NEW
   - ⏳ Remotion React compositions (player-intro-full, player-intro-short, team-banner)
   - ⏳ ComfyUI + BiRefNet client
   - ⏳ Watermarking (video + print)

4. **Infrastructure** (100% complete)
   - ✅ ESM project setup
   - ✅ Config module with validation
   - ✅ Appwrite client module
   - ✅ Storage abstraction (dev/prod modes)
   - ✅ Appwrite setup script executed (all 9 collections + 4 buckets created)

---

## ✅ Completed (21)

### Infrastructure Completed ✅

- [x] **ESM Project** — `package.json` with `"type": "module"`
- [x] **Dependencies** — All critical packages installed (gsap, redis, stripe, transformers, bullmq, node-appwrite)
- [x] **Vitest Config** — ESM-ready with coverage thresholds (80% general, 100% critical path)
- [x] **Config Module** — `src/config.js` with centralized env validation (fail-fast on import)
- [x] **Initialization Checker** — `verify-setup.js` validates setup
- [x] **Environment Template** — `.env.example` fully documented
- [x] **Appwrite Setup Script** — `scripts/setup-appwrite.js` complete (import path fixed)

### Appwrite Infrastructure Completed ✅

- [x] **Appwrite Collections** — 9 collections created with proper schema
  - customers, orders, teams, players, consent_logs
  - proof_approvals, financial_records, parent_orders, brands
- [x] **Appwrite Storage** — 4 buckets configured with access rules
  - uploads (for raw team photos), proofs (proof previews)
  - finals (final render outputs), previews (demo/thumbnail assets)

### Component 3 — Asset Generation ✅

- [x] **First Brand Template: cinematic-dark** — Complete & tested
  - ✅ `brand.json` — Full schema v1.0 (3 video + 3 print formats)
  - ✅ `brand-tokens.css` — 40+ CSS custom properties (no hardcoded hex)
  - ✅ `player-intro-full` HTML composition — 1920×1080, 30fps, tested with real renders
  - ✅ Photoshop UXP print scripts — poster-16x20, banner-2x6, player-card-4x6
  - ✅ Render outputs — 3 test videos generated and verified
- [x] **Directory Structure** — Proper `src/` hierarchy created with all subdirectories

### Component 4 Completed ✅

- [x] **State Machine Tests** — 70+ comprehensive test cases for all valid/invalid transitions
  - File: `src/orders/state-machine-test.js`
  - Coverage: All 9 states, DISPUTED terminal, history tracking

- [x] **State Machine Implementation** — Full StateMachine class with private fields
  - File: `src/orders/state-machine.js`
  - Features: Immutable history, metadata validation, transition logging

- [x] **Consent Gate Tests** — 50+ comprehensive test cases for all consent flags
  - File: `src/pipeline/consent/check-consent-test.js`
  - Coverage: 5 flags (backgroundRemoval, colorAdjustment, poseAdjustment, aiMotion, marketingUse)
  - Missing flags default to false (never assumed true)

- [x] **Consent Gate Implementation** — Two core functions
  - File: `src/pipeline/consent/check-consent.js`
  - Functions: `checkConsent()`, `applyEnhancement()` with fallback routing

- [x] **Appwrite Client Module** — Shared Appwrite client instances
  - File: `src/appwrite/client.js`
  - Exports: `client`, `databases`, `storage`, `users`

- [x] **Storage Abstraction Layer** — Dev (1 bucket) vs Prod (4 buckets) abstraction
  - File: `src/lib/storage.js`
  - Functions: `bucketId()`, `fileId()`, `parseArea()` with examples

### Component 2 Completed ✅

- [x] **BullMQ Queue Initialization** — Connection to Redis configured
- [x] **Worker Entry Point** — `src/queue/worker.js` complete with job dispatcher
- [x] **Job Type Registry** — `JOB_TYPES` constants and switch-based dispatcher

### Component 3 Completed ✅

- [x] **Brand Validator Skeleton** — `src/brands/validate-brand.js` placeholder with detailed TODOs
- [x] **Photo Processing Job** — `src/queue/jobs/process-photos.js` with BiRefNet + consent gate
- [x] **Logger Utility** — `src/lib/logger.js` for structured JSON logging
- [x] **Payment Flows Implementation** — `src/orders/payment-flows.js` with Stripe 50/50 split
- [x] **Photo Validation Implementation** — `src/pipeline/photo/validate-photo.js` with face/pose/blur/resolution checks
- [x] **Appwrite Collections CRUD** — `src/appwrite/crud.js` with helpers for 9 collections
- [x] **Hyperframes Client Module** — `src/pipeline/hyperframes-client.js` REST wrapper (9 tests)
  - ✅ isReachable() health check (5s timeout)
  - ✅ renderComposition() single render (5-min timeout)
  - ✅ renderBatch() sequential with error collection
  - ✅ All error scenarios covered
- [x] **Photoshop Client Module** — `src/pipeline/photoshop-client.js` REST wrapper (9 tests)
  - ✅ isReachable() health check (5s timeout)
  - ✅ renderPrint() single render (5-min timeout)
  - ✅ renderBatch() sequential with error collection
  - ✅ All error scenarios covered
- [x] **Render-Video Job** — `src/queue/jobs/render-video.js` BullMQ handler (6 tests)
  - ✅ Loads team.json + brand.json
  - ✅ Filters video deliverables
  - ✅ Consent gate (aiMotion) before each render
  - ✅ Continues on individual failures
  - ✅ Returns {orderId, renderedCount, failedCount, videos[]}
- [x] **Render-Print Job** — `src/queue/jobs/render-print.js` BullMQ handler (6 tests)
  - ✅ Loads team.json + brand.json
  - ✅ Filters print deliverables
  - ✅ Loads .psjs template scripts
  - ✅ Consent gate (aiMotion) before each render
  - ✅ Continues on individual failures
  - ✅ Returns {orderId, renderedCount, failedCount, prints[]}
- [x] **Package-Order Job** — `src/queue/jobs/package-order.js` BullMQ handler (5 tests)
  - ✅ Validates orderId + renderedAssetsDir
  - ✅ Checks canReleaseFinals() (PROOF_APPROVED + PAID_IN_FULL)
  - ✅ Scans video/ and print/ directories
  - ✅ Creates manifest JSON
  - ✅ Uploads to Appwrite finals bucket
  - ✅ Transitions order to FULFILLMENT state

---

## ⏳ Pending (73)

### High Priority — Component 2

- [x] **Render-Video Job (Hyperframes)** ✅ COMPLETE
  - File: `src/queue/jobs/render-video.js` (220+ lines)
  - Status: 6/6 tests passing, production ready
  - Features: Consent gates, error resilience, batch rendering

- [x] **Render-Print Job (Photoshop UXP)** ✅ COMPLETE
  - File: `src/queue/jobs/render-print.js` (166 lines)
  - Status: 6/6 tests passing, production ready
  - Features: Consent gates, error resilience, batch rendering

- [x] **Package-Order Job** ✅ COMPLETE
  - File: `src/queue/jobs/package-order.js` (130 lines)
  - Status: 5/5 tests passing, production ready
  - Features: Eligibility check, manifest creation, Appwrite upload

- [x] **Hyperframes Client Module** ✅ COMPLETE
  - File: `src/pipeline/hyperframes-client.js` (130 lines)
  - Status: 9/9 tests passing, production ready
  - Features: Health check, 5-min timeout, batch error handling

- [x] **Photoshop Client Module** ✅ COMPLETE
  - File: `src/pipeline/photoshop-client.js` (120 lines)
  - Status: 9/9 tests passing, production ready
  - Features: Health check, 5-min timeout, batch error handling

### NEW: Remotion Video Engine Integration

**Phase 1: Architecture Fixes** ✅ COMPLETE
- [x] **SCHEMA.md** — Added `"renderEngine": "hyperframes"` to brand.json schema (line 180)
- [x] **validate-brand.js** — Corrected TODOs: renderEngine is top-level field, not in compositions
- [x] **render-video.js** — Added renderEngine validation (lines 64-86)
  - Enum check: `['hyperframes', 'remotion']`
  - Service availability check made conditional on engine type
  - Default to Hyperframes for backward compatibility
- [x] **remotion-client.js** ✅ NEW MODULE (155 lines)
  - `isReachable()` — Health check to localhost:3002
  - `renderComposition(options)` — POST /render with compositionId, props, dimensions
  - `renderBatch(compositions)` — Sequential rendering with error continuation
  - 10-minute timeout (longer than Hyperframes for complex React compositions)
  - Full test coverage: 11/11 tests passing
- [x] **remotion-client.test.js** ✅ NEW TESTS (210 lines)
  - 11 comprehensive test cases covering health checks, rendering, batching
  - Mirrors hyperframes-client.test.js pattern for consistency
- [x] **render-video.js Router Functions** ✅ NEW
  - `renderWithHyperframes()` — Delegates to hyperframes-client renderComposition
  - `renderWithRemotion()` — Currently throws "not implemented" (Phase 3)
  - Engine selection in main loop (lines 162-180)

**Phase 2: Infrastructure Integration** ✅ COMPLETE
- [x] **renderPlayer() Integration** — Wired router functions into main render loop
  - Replaced direct renderComposition() call with engine-based dispatch
  - Conditional routing based on `brand.renderEngine` value
  - Maintained backward compatibility (defaults to Hyperframes)
- [x] **render-video.test.js** — Still 6/6 passing, no regressions
- [x] **remotion-client.test.js** — All 11/11 tests passing
- [x] **Test Integration** — 17/17 combined tests passing (remotion + render-video)

**Phase 3: Testing & Second Brand** ✅ COMPLETE
- [x] **Update render-video.test.js** ✅ COMPLETE
  - [x] Added 4 new tests for renderEngine routing
  - [x] Test invalid renderEngine validation
  - [x] Test Remotion routing (dispatches to renderWithRemotion)
  - [x] Test useAiMotion flag behavior with consent
  - [x] Test Hyperframes default behavior (backward compatible)
  - Status: 10/10 tests passing (6 original + 4 new)
- [x] **Create Second Brand Template — tech-dynamic** ✅ COMPLETE
  - [x] `brand.json` with `renderEngine: "remotion"`
  - [x] `brand-tokens.css` with 50+ CSS custom properties (no hardcoded values)
  - [x] `meta.json` with brand metadata
  - [x] Photoshop UXP print scripts (placeholder stubs):
    - `poster-16x20.psjs`
    - `banner-2x6.psjs`
    - `player-card-4x6.psjs`
  - [x] README.md documentation
  - Status: Complete brand template with all required files
- [x] **Remotion React Composition Stubs** ✅ CREATED
  - [x] `PlayerIntroFull.jsx` — 1920×1080, 30s @ 30fps
  - [x] `PlayerIntroShort.jsx` — 1080×1920, 8s @ 30fps (vertical)
  - [x] `TeamBanner.jsx` — 1920×1080, 15s @ 30fps
  - Note: Stubs created, full React implementation pending Phase 4

**Phase 4: End-to-End & Documentation** ⏳ PENDING
- [ ] **Implement Remotion React Compositions** — Full animation logic
  - [ ] PlayerIntroFull.jsx (1920×1080, 30s, tech animations)
  - [ ] PlayerIntroShort.jsx (1080×1920, 8s, vertical format)
  - [ ] TeamBanner.jsx (1920×1080, 15s, roster carousel)
  - Estimated: ~600 LOC total
- [ ] **Wire renderWithRemotion()** — Enable actual Remotion rendering
  - Dynamic import of remotion-client.js
  - Composition prop mapping (player/team/brand data)
- [ ] **Implement Photoshop UXP Scripts** — Print rendering
  - poster-16x20.psjs (16×20 in, 300 DPI, CMYK)
  - banner-2x6.psjs (2×6 in, 300 DPI, CMYK)
  - player-card-4x6.psjs (4×6 in, 300 DPI, CMYK)
  - Estimated: ~450 LOC total
- [ ] **End-to-End Testing** — Both render engines
  - Test job with renderEngine: "hyperframes" (cinematic-dark)
  - Test job with renderEngine: "remotion" (tech-dynamic)
  - Verify consent gates work with both engines
  - Test order state transitions with both engines
- [ ] **Documentation Updates**
  - Update CONVENTIONS.md with renderEngine guidance
  - Update ARCHITECTURE.md with render engine dispatch diagram
  - Update STACK.md with Remotion architecture notes

- [ ] **Execute Appwrite Setup**
  - Command: `node scripts/setup-appwrite.js`
  - Prerequisites: Fill .env with valid Appwrite credentials
  - Creates: 9 collections + 4 storage buckets
  - Safe: Idempotent (can re-run)

### Medium Priority — Component 3

- [ ] **Brand JSON Schema Definition**
  - Document in `SCHEMA.md`: registry entry structure
  - Fields: id, name, active, tokenSchema, compositions, print, outputSpecs

- [ ] **Brand Validator Implementation**
  - File: `src/brands/validate-brand.js` (complete the TODOs)
  - Tests: `src/brands/validate-brand.test.js` (100 tests)
  - Validates: required fields, file paths exist, dimensions positive

- [ ] **First Brand — cinematic-dark**
  - [ ] Create `brands/cinematic-dark/brand.json` registry entry
  - [ ] Create `brands/cinematic-dark/brand-tokens.css` with CSS custom properties
  - [ ] Build `brands/cinematic-dark/compositions/player-intro-full.html` (30s 16:9)
  - [ ] Build `brands/cinematic-dark/compositions/player-intro-short.html` (8s 9:16)
  - [ ] Build `brands/cinematic-dark/compositions/team-banner.html` (15s 16:9)
  - [ ] Build `brands/cinematic-dark/print/poster-16x20.psjs` (Photoshop UXP)
  - [ ] Build `brands/cinematic-dark/print/player-card-4x6.psjs` (Photoshop UXP)
  - [ ] Generate preview thumbnail and demo MP4

- [ ] **Template Validation Tests**
  - Dimensions render correctly per spec
  - CSS custom properties resolve (no hardcoded hex)
  - Compositions handle missing focalPoint gracefully
  - Short-form completes within 8 seconds
  - Print templates output CMYK PDF at correct DPI

### Next Priority — Component 2

- [ ] **ComfyUI Integration**
  - [ ] REST client wrapper: `src/pipeline/comfyui-client.js`
  - [ ] BiRefNet workflow definition
  - [ ] Tests: Valid photo produces clean cutout PNG
  - [ ] Tests: Consent gate skips processing when backgroundRemoval false

- [ ] **Watermarking (Video + Image)**
  - [ ] FFmpeg watermark baking: `src/pipeline/watermark-video.js`
  - [ ] Sharp watermark baking: `src/pipeline/watermark-image.js`
  - [ ] Tests: Pixel-level verification, proof lower resolution than final

- [ ] **Job Queue Integration Tests**
  - [ ] Job enqueued on order state change
  - [ ] Failed job retries 3x then dead-letters
  - [ ] Job metadata preserved through retries

### Lower Priority — Component 1 (Customer Web App)

- [ ] **Next.js Setup** — Project initialization, Tailwind config
- [ ] **Brand Builder** — Color/font/logo picker with live preview
- [ ] **Photo Uploader** — Drag-drop with client-side face detection validation
- [ ] **Roster Importer** — PDF parsing (pdf-parse + Tesseract OCR) to editable grid
- [ ] **Consent Collection** — Per-player checkboxes with aiMotion confirmation modal
- [ ] **Checkout Flow** — Stripe Elements for deposit + balance payment
- [ ] **Proof Review Interface** — Signed URL proof display with approve/revise controls
- [ ] **Parent Store** — Coach config screen, public store at `/store/[team-slug]`

---

## 📊 Progress by Component

| Component | Tasks | Done | Pending | % |
|-----------|-------|------|---------|---|
| Infrastructure | 8 | 8 | 0 | 100% ✅ |
| Component 4 (Backend) | 14 | 12 | 2 | 86% ⏳ |
| Component 3 (Templates) | 13 | 1 | 12 | 8% |
| Component 2 (Pipeline) | 24 | 15 | 9 | 63% ✅ |
| Component 1 (Web App) | 35 | 0 | 35 | 0% |
| **TOTAL** | **94** | **36** | **58** | **38%** |

---

## 🔧 Next Immediate Actions

### Must Do First
1. Fill .env with valid Appwrite credentials (from https://cloud.appwrite.io)
2. Run `node scripts/setup-appwrite.js` to create all DB collections
3. Run `npm test` to verify all tests pass (especially state machine + consent)

### Then Start
1. **Payment Flows** (Component 4) — Required for any order processing
2. **Photo Validation** (Component 4) — Required before pipeline can process photos
3. **First Brand Template** (Component 3) — Proves the render pipeline works end-to-end

### Final Phase
- Component 2 job implementations (ComfyUI, Hyperframes, Photoshop)
- Component 1 web app (Next.js frontend with all UX flows)

---

## 📋 Icebox (Future)

- [ ] Direct-to-platform social posting (OAuth per platform)
- [ ] Social media ad generator (second product line)
- [ ] AI-powered reorder prompt ("new season starting soon")
- [ ] Trading card product format
- [ ] Coach dashboard: analytics across all team orders
- [ ] White-label option (photographer sells platform to other photogs)

---

## 📝 Notes

**Files Created This Weekend:**
- ✅ Proper `src/` directory structure organized by component
- ✅ `src/config.js` moved from root (migration complete)
- ✅ `src/appwrite/client.js` with shared instances
- ✅ `src/lib/storage.js` with dev/prod abstraction
- ✅ `src/queue/worker.js` with full job dispatcher
- ✅ `src/brands/validate-brand.js` skeleton with TODOs
- ✅ All pipeline clients ready for implementation (placeholders)

**Test Files:**
- ✅ `src/orders/state-machine-test.js` (70+ tests)
- ✅ `src/pipeline/consent/check-consent-test.js` (50+ tests)
- ✅ Both awaiting execution to verify pass

**Blockers:**
- ⏳ Appwrite credentials (get from https://cloud.appwrite.io)
- ⏳ PowerShell environment (for npm test execution)
- ⏳ Redis running (for BullMQ tests)

**Architecture Decisions:**
- Storage abstraction: Same code works for dev (1 bucket + prefix) and prod (4 separate buckets)
- Config centralization: No direct `process.env` access anywhere in codebase
- Worker pattern: Job dispatcher uses dynamic import to load job handlers on-demand
- Private fields: State machine uses ES2022 private fields (#currentState) for true encapsulation

---

**Last Updated:** 2026-04-28 10:57 UTC  
**Updated By:** User (rendering pipeline complete: +35 tests, 52/52 passing)  
**Status:** 223 core tests passing ✅ — Ready for render job implementations
