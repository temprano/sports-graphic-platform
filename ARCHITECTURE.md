# Architecture

## System Overview

An automated sports graphics platform with two customer types (coaches/teams
and parents), a production pipeline that batch-renders personalized motion
graphics and print assets, and a business backend that handles payments,
fulfillment, and reorder lifecycle.

```
┌─────────────────────────────────────────────────────────────┐
│  COMPONENT 1 — Customer Web App                             │
│  Coach/team order flow + Parent store                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ order confirmed + deposit paid
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  COMPONENT 4 — Business Backend                             │
│  Appwrite DB · Order state machine · Financial records      │
└──────────┬────────────────────────────────────┬─────────────┘
           │ queues job                          │ saves records
           ▼                                     │
┌──────────────────────────┐                    │
│  COMPONENT 2             │ pulls templates     │
│  Automation Pipeline     │◄────────────────────┤
│                          │                     │
│  ComfyUI (BiRefNet)      │                     │
│  Hyperframes / Remotion  │                     │
│  Photoshop UXP           │                     │
└──────────┬───────────────┘                     │
           │                     ┌───────────────┘
           │              ┌──────▼───────────────────────────┐
           │              │  COMPONENT 3                     │
           │              │  Asset Generation Pipeline       │
           │              │  Brand templates · Token registry│
           │              └──────────────────────────────────┘
           │
           ▼
     Proof package (watermarked)
           │
           ▼
     Customer approves + pays balance
           │
           ▼
     Prodigi/Printful fulfillment OR signed download link
```

---

## Component 1 — Customer Web App

### Responsibilities
- Team/coach order flow (brand selection, photo upload, roster import)
- Brand infographic builder (visual color/font/logo picker with live preview)
- Photo validation via Transformers.js (client-side, pre-upload)
- Roster PDF import → editable player grid
- Stripe two-stage checkout (deposit at order, balance at proof approval)
- Proof review interface (watermarked, authenticated, time-limited)
- Parent store (per-team storefront, coach-configured permissions)
- Order status tracking

### Key UX Flows
```
Coach Flow:
Select brand → Build brand board → Upload photos →
Import roster → Review order + pay deposit →
Review proof → Approve + pay balance →
Configure parent store → Receive finals

Parent Flow:
Visit team store URL → Select player products →
Pay full price → Receive fulfillment confirmation
```

### Technology
- Next.js App Router
- Tailwind CSS
- Transformers.js v4 (face detection, quality validation)
- Stripe.js (client) + Stripe SDK (server)
- Appwrite SDK
- pdf-parse or Tesseract OCR (roster PDF)

---

## Component 2 — Automation Pipeline

### Responsibilities
- Consume jobs from BullMQ queue (triggered by order state machine)
- Run ComfyUI BiRefNet masking on uploaded player photos
- Check consent log before applying any AI enhancement
- Render video compositions via Hyperframes / Remotion
- Render print assets via Photoshop UXP
- Generate watermarked proofs (baked-in, not CSS overlay)
- Package final assets on approval + full payment
- Trigger Prodigi/Printful fulfillment or generate signed download link

### Job Types
```
PROCESS_PHOTOS       ComfyUI BiRefNet on all player photos
RENDER_VIDEOS        Hyperframes/Remotion per player per format
RENDER_PRINTS        Photoshop UXP per player per print format
GENERATE_PROOFS      Watermarked versions of all outputs
PACKAGE_ORDER        Zip finals, generate delivery
FULFILL_PRINT        Push to Prodigi/Printful API
GENERATE_PARENT_STORE Spin up parent store after team approval
```

### Consent Gate (non-negotiable)
```javascript
// Every AI enhancement job checks this before running
const consent = await getConsentLog(playerId);
if (!consent.poseAdjustment) skipPoseAdjustment();
if (!consent.aiMotion) useStaticFallback();
```

### Render Targets (per deliverables array in team.json)
```
Social Pack Basic:    Instagram Feed 1:1 · Story 9:16 · Reel 9:16
Social Pack Full:     + TikTok · Twitter/X · Facebook · YouTube Short
Broadcast Pack:       16:9 1920x1080 (Hudl, YouTube, scoreboard)
Print Pack:           Poster 16x20 · Banner 2x6 · Player Card 4x6
Full Season Pack:     All of the above
```

### Technology
- BullMQ + Redis (job queue)
- ComfyUI API (BiRefNet workflow)
- Hyperframes CLI + GSAP
- Remotion (complex multi-scene sequences)
- Photoshop UXP scripting
- FFmpeg (format conversion, watermark baking)
- Prodigi API / Printful API

---

## Component 3 — Asset Generation Pipeline

### Responsibilities
- Design studio for building and maintaining brand templates
- Brand registry (available brands shown to customers in Component 1)
- CSS token schema (which colors/fonts are configurable per brand)
- Preview asset generation (what customers see when choosing a brand)
- Output spec definition (sizes, formats, deliverables per brand)

### Brand Folder Structure
```
brands/
└── [brand-slug]/
    ├── brand.json              registry entry
    ├── brand-tokens.css        CSS custom properties (no hardcoded values)
    ├── preview/
    │   ├── thumbnail.jpg       shown in brand selector
    │   └── demo.mp4            optional animated preview
    ├── compositions/
    │   ├── player-intro-full.html      30s 16:9 full length
    │   ├── player-intro-short.html     8s 9:16 short form
    │   ├── team-banner.html
    │   └── score-bug.html
    └── print/
        ├── poster-16x20.psjs   Photoshop UXP script
        ├── banner-2x6.psjs
        └── player-card-4x6.psjs
```

### brand.json Registry Entry
```json
{
  "id": "cinematic-dark",
  "name": "Cinematic Dark",
  "description": "Bold, dramatic. High contrast.",
  "sports": ["basketball", "football", "soccer"],
  "tokenSchema": {
    "colors": ["primary", "accent", "text", "background"],
    "fonts": ["heading", "body"],
    "logo": true
  },
  "deliverables": {
    "video": ["player-intro-full", "player-intro-short", "team-banner"],
    "print": ["poster-16x20", "banner-2x6", "player-card-4x6"]
  },
  "outputSpecs": {
    "player-intro-full": { "width": 1920, "height": 1080, "fps": 30, "duration": 30 },
    "player-intro-short": { "width": 1080, "height": 1920, "fps": 30, "duration": 8 },
    "poster-16x20": { "width": 4800, "height": 6000, "dpi": 300, "format": "PDF" }
  }
}
```

---

## Component 4 — Business Backend

### Responsibilities
- Customer and team records (reusable across seasons)
- Order lifecycle management (state machine)
- Financial records (revenue, fulfillment cost, profit per order)
- Proof approval audit log
- Parent store management
- Marketing layer (reorder triggers, customer segmentation)
- Consent log storage (permanent, legal record)

### Appwrite Collections
```
customers           id, name, email, phone, school, sport, orderHistory
orders              id, customerId, teamId, state, depositPaid, balancePaid
teams               id, customerId, teamJson, brandId, season, sport, school
players             id, teamId, name, number, position, photoPath, consentLog
brands              id, slug, name, active (mirrors Component 3 registry)
parent_orders       id, parentId, teamOrderId, playerId, products, state
financial_records   id, orderId, stripePaymentId, gross, fulfillmentCost, profit
proof_approvals     id, orderId, approvedBy, timestamp, ipAddress, version
consent_logs        id, playerId, orderId, flags, signedBy, timestamp, ip
```

### Payment Flow
```
Stripe Payment Intent (deposit 50%)
    → order.state = PENDING_PAYMENT → IN_PRODUCTION
Stripe Payment Intent (balance 50%)
    → order.state = PENDING_FINAL_PAYMENT → PAID_IN_FULL → FULFILLMENT
```

### Parent Store Trigger
```
order.state === DELIVERED
    AND coach.parentStoreEnabled === true
    → generate parent store at /store/[team-slug]
    → notify coach with store URL + share code
    → store.closeDate set per coach config
```

---

## Integration Points

### Order Handoff (Component 1 → 2)
BullMQ job enqueued with `{ orderId, teamJsonPath, assetsPath }`
on Stripe deposit webhook confirmation.

### Template Resolution (Component 2 → 3)
Pipeline reads `team.json.brand`, loads
`brands/[brand-slug]/brand.json` to resolve composition paths and
output specs before rendering.

### Proof Delivery (Component 2 → 1)
Watermarked proof assets written to private Appwrite storage bucket.
Order state set to `PENDING_PROOF_REVIEW`.
Customer notified via email. Proof URLs generated on-demand
as signed short-lived tokens (15 min expiry).

### Financial Recording (Component 2 → 4)
Every Prodigi/Printful fulfillment call records cost.
Profit = stripe gross - fulfillment cost - stripe fees.
Written to `financial_records` on order completion.

---

## Security Boundaries

| Asset Type | Storage | Access |
|------------|---------|--------|
| Uploaded photos | Private Appwrite bucket | Pipeline only |
| Proof assets | Private Appwrite bucket | Signed URL, 15min, logged |
| Final assets | Private Appwrite bucket | Single-use download, 48hr |
| Parent store previews | Private bucket | Authenticated session |
| brand.json templates | VPS filesystem | Pipeline read-only |

---

## Deployment

### Development
- Appwrite Cloud (free tier)
- Local Next.js dev server
- Local ComfyUI instance
- Hyperframes CLI local

### Production
- Appwrite self-hosted on Hostinger KVM2 VPS
- Next.js deployed to Vercel (or VPS via PM2)
- ComfyUI on VPS or dedicated GPU instance
- BullMQ worker as PM2 process on VPS
- Tailscale tunnel between VPS services
