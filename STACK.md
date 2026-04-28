# Stack

## Technology Choices

### Runtime & Language
| Technology | Version | Rationale |
|------------|---------|-----------|
| Node.js | 20+ LTS | Existing expertise, ESM native, async pipeline fit |
| ESM modules | native | Consistency with OpenClaw VPS patterns |
| TypeScript | optional, progressive | Add where it reduces bugs; not mandatory day one |

### Frontend
| Technology | Rationale |
|------------|-----------|
| Next.js App Router | Full-stack, API routes, server components reduce client JS |
| Tailwind CSS | Utility-first, fast iteration, no CSS file sprawl |
| React | Component model for brand builder + proof viewer |

### Database & Backend Services
| Technology | Dev | Prod | Rationale |
|------------|-----|------|-----------|
| Appwrite | Cloud free tier | Self-hosted VPS | Same SDK both envs, self-hosted avoids vendor lock |
| Redis | Local Docker | VPS instance | Required by BullMQ |
| BullMQ | - | VPS PM2 process | Job queue for pipeline jobs, retry logic, dead-letter |

### Video / Motion Graphics
| Technology | Use Case |
|------------|----------|
| Hyperframes | HTML composition → MP4. Primary render engine for player intros |
| GSAP | Animation inside Hyperframes compositions |
| Remotion | Complex multi-scene sequences requiring React component model |
| FFmpeg | Format conversion, watermark baking, alpha channel output |

### Print / Static Assets
| Technology | Use Case |
|------------|----------|
| Photoshop UXP | Programmatic PSD rendering → print-ready PDF |
| CSS + HTML | Proof-quality static renders for non-print previews |

### AI / Image Processing
| Technology | Use Case |
|------------|----------|
| ComfyUI | BiRefNet background removal, FLUX image generation |
| Transformers.js v4 | Client-side photo validation (face detection, quality check) |

### Payments & Fulfillment
| Technology | Use Case |
|------------|----------|
| Stripe | Two-stage payments (deposit + balance), webhooks, invoices |
| Prodigi | Print fulfillment, drop-ship to customer |
| Printful | Alternative/backup fulfillment provider |

### Infrastructure
| Technology | Use Case |
|------------|----------|
| Hostinger KVM2 VPS | Ubuntu 24.04, pipeline workers, self-hosted Appwrite |
| PM2 | Process management, `ecosystem.config.cjs` for ESM compat |
| Tailscale | Encrypted tunnel between VPS and local dev machine |
| Vercel | Next.js hosting (or PM2 on VPS if self-contained preferred) |

---

## Key Version Constraints

```json
{
  "node": ">=20.0.0",
  "hyperframes": "latest",
  "gsap": "^3.x",
  "remotion": "^4.x",
  "bullmq": "^5.x",
  "stripe": "^14.x",
  "node-appwrite": "^21.x",
  "transformers": "^3.x",
  "vitest": "^1.x"
}
```

---

## Local Dev Setup

```bash
# 1. Clone repo
git clone [repo]
cd sports-graphics-platform

# 2. Install dependencies
npm install

# 3. Copy env template
cp .env.example .env
# Fill in Appwrite Cloud + Stripe test keys

# 4. Start Redis (Docker)
docker run -d -p 6379:6379 redis:alpine

# 5. Start Next.js dev server
npm run dev

# 6. Start BullMQ worker (separate terminal)
node src/queue/worker.js

# 7. Start Hyperframes studio (for template work)
npx hyperframes studio
```

---

## Appwrite Collections Setup

Run the setup script to initialize collections in your Appwrite project:
```bash
node scripts/setup-appwrite.js
```

This creates all collections defined in `SCHEMA.md` with correct
attributes, indexes, and permissions.

---

## Environment Variables

```bash
# Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=

# Appwrite Bucket IDs
APPWRITE_BUCKET_UPLOADS=
APPWRITE_BUCKET_PROOFS=
APPWRITE_BUCKET_FINALS=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# ComfyUI
COMFYUI_BASE_URL=http://localhost:8188

# Prodigi
PRODIGI_API_KEY=
PRODIGI_API_URL=https://api.prodigi.com/v4.0

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Why Not...

**Remotion only (no Hyperframes)?**
Remotion requires React components. Hyperframes uses plain HTML which is
simpler to template, easier for AI agents to generate correctly, and better
matches the brand token CSS approach. Remotion is kept for sequences that
genuinely benefit from the React component model.

**Supabase instead of Appwrite?**
Appwrite is fully self-hostable with an identical API between Cloud and
self-hosted. Migrating from dev (Cloud) to prod (VPS) is a config change.
Supabase self-hosting is more complex. Appwrite also handles file storage
natively with access control, which is critical for proof asset security.

**After Effects instead of Photoshop UXP?**
After Effects has no scriptable batch render API suitable for automated
pipelines. Photoshop UXP supports full Node.js-style scripting, file I/O,
and can be triggered headlessly from the pipeline.

**Serverless functions instead of BullMQ?**
The render pipeline can run for minutes per order. Serverless functions have
execution time limits incompatible with video rendering jobs. BullMQ workers
on the VPS run indefinitely and support job retries, priority queues, and
dead-letter handling.
