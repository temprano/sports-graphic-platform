# Architecture Decision Records

Running log of significant decisions, the context that drove them, and
the reasoning behind the choice. Update this when a major decision is made
or revisited.

---

## ADR-001 — Appwrite as primary database
**Date**: 2026-04  
**Status**: Accepted

**Context**: Need a backend-as-a-service that works identically in dev
(cloud) and prod (self-hosted VPS), handles file storage with access
control natively, and has a Node.js SDK.

**Decision**: Appwrite Cloud for development, self-hosted Appwrite on
Hostinger KVM2 VPS for production.

**Consequences**: Same codebase deploys to both environments with only
env var changes. File storage buckets handle proof asset security without
a separate S3-style service. Self-hosted prod avoids ongoing SaaS fees
at scale.

---

## ADR-002 — Two-stage Stripe payment (deposit + balance)
**Date**: 2026-04  
**Status**: Accepted

**Context**: Industry standard in sports photography and design. Protects
against customers who take proof assets without completing payment. Also
covers production costs before delivery.

**Decision**: 50% deposit at order placement. Balance invoiced after proof
approval. Finals released only when both payments confirmed via Stripe
webhook.

**Consequences**: More complex payment flow. Requires order state machine
to track both payment events separately. Stripe Payment Intents used for
both stages (not Checkout Sessions) for control over timing.

---

## ADR-003 — BullMQ for pipeline job queue
**Date**: 2026-04  
**Status**: Accepted

**Context**: Render jobs can take minutes. Serverless function time limits
are incompatible. Need retry logic, priority queues, dead-letter handling,
and job visibility.

**Decision**: BullMQ backed by Redis on VPS. Worker runs as PM2 process.

**Consequences**: Redis required as additional VPS service. PM2 manages
worker restarts. Job visibility via BullMQ dashboard (Bull Board).
Dead-letter queue for failed jobs requires manual intervention.

---

## ADR-004 — Hyperframes as primary video render engine
**Date**: 2026-04  
**Status**: Accepted

**Context**: Need deterministic, frame-accurate video rendering from HTML
templates. Puppeteer alone has CPU-timing issues. Remotion requires React
component model which adds complexity to template authoring.

**Decision**: Hyperframes for all standard player intro and banner
compositions. Remotion reserved for sequences requiring React component
model (complex data-driven animations).

**Consequences**: Two video rendering dependencies. Brand templates are
plain HTML + GSAP (no React required). Hyperframes handles frame sync
so render output is consistent regardless of server load.

---

## ADR-005 — Watermarks baked into proof assets server-side
**Date**: 2026-04  
**Status**: Accepted

**Context**: CSS overlay watermarks are trivially removable via DevTools.
Need to prevent proof asset theft before final payment.

**Decision**: Watermarks rendered directly into pixel data by FFmpeg
(video) and ImageMagick/Sharp (image) during proof generation. No CSS
overlay approach anywhere in the proof pipeline.

**Consequences**: Proof generation adds a processing step. Proof files
are separate from final files (not the same file with overlay). Storage
cost is slightly higher (both proof and final versions stored).

---

## ADR-006 — Consent logged per player per enhancement type
**Date**: 2026-04  
**Status**: Accepted

**Context**: State laws (Illinois BIPA, California AB 1836) treat AI
likeness generation for minors as requiring explicit consent. Blanket
terms-of-service consent is insufficient. Need granular, auditable
per-player consent records.

**Decision**: Four distinct consent flags per player (backgroundRemoval,
colorAdjustment, poseAdjustment, aiMotion). Each is an explicit opt-in
checkbox, not bundled. Stored permanently in consent_logs collection
with timestamp, IP, and signing user ID. Pipeline checks flags before
applying any AI enhancement.

**Consequences**: More friction in order flow for coach/parent. Mitigated
by friendly UX and clear explanation of each enhancement. Legal protection
significantly stronger. Pipeline requires consent gate logic.

---

## ADR-007 — Parent store as separate order flow
**Date**: 2026-04  
**Status**: Accepted

**Context**: Parents want to purchase individual player products. Coach
should not be responsible for collecting money from parents. Parent orders
should reuse already-rendered assets from the team order.

**Decision**: Parent store generated automatically after team order
delivery. Separate Stripe checkout flow for parent orders. Parent orders
fulfill directly via Prodigi/Printful to parent shipping address.
Team order assets reused — no re-render cost per parent order.

**Consequences**: Two customer flows in Component 1. Parent orders linked
to team order in Component 4 for reporting. Coach controls store
visibility, product availability, and close date.

---

## ADR-008 — ESM throughout application code
**Date**: 2026-04  
**Status**: Accepted

**Context**: Consistency with OpenClaw VPS codebase. Node 20+ has stable
ESM support. Mixing CJS and ESM creates import complexity.

**Decision**: All application code uses ESM. `"type": "module"` in
package.json. Exception: `ecosystem.config.cjs` for PM2 (PM2 requirement).

**Consequences**: Some older npm packages may require dynamic import()
wrappers. __dirname and __filename not available natively (use
import.meta.url pattern instead).

---

## Open Questions

- [ ] Self-hosted Appwrite vs Appwrite Cloud Pro for production?
      (revisit when order volume is known)
- [ ] Vercel for Next.js vs PM2 on VPS?
      (Vercel simpler, VPS cheaper at scale, keep open until launch)
- [ ] Prodigi vs Printful as primary fulfillment?
      (test both with first real orders, compare quality + margin)
- [ ] Direct-to-platform social posting as a paid add-on?
      (defer until core pipeline is proven)
