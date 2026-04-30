# Monorepo vs Separate Project: Component 1 Web App

**Decision Framework for Sports Graphics Platform**

---

## 📊 Current State

**Today:** Monorepo contains Components 2, 3, 4 (pipeline + assets + backend)
- Single `package.json` with Node.js + BullMQ + Vitest
- Shared `src/` directory with business logic
- Shared Appwrite client, state machine, payment flows
- ESM throughout, single deployment to VPS

**Question:** Add Component 1 (Next.js web app) to same repo or separate?

---

## ⚖️ Tradeoff Analysis

### KEEP TOGETHER (Monorepo)

**Pros:**
1. **Shared types + data contracts**
   - Update Order schema in one place
   - Both frontend and backend get latest
   - TypeScript interfaces auto-sync

2. **Shared utilities**
   - `src/appwrite/client.ts` (single Appwrite instance)
   - `src/orders/state-machine.js` (order logic)
   - `src/pipeline/consent/check-consent.js` (consent gates)
   - `src/lib/storage.ts` (file handling)

3. **Coordinated updates**
   - Change payment logic → update both web UI + backend handler in one PR
   - Modify order state transitions → test end-to-end in single CI run
   - No sync delays or version mismatches

4. **Single source of truth**
   - One architecture document
   - One CI/CD pipeline
   - One deployment checklist

5. **Development workflow**
   - Clone once, run both locally
   - Test full stack in CI
   - Pre-deployment verification that they work together

6. **Deployment safety**
   - Atomic deploys (both updated together)
   - No "frontend waiting for backend API changes" scenarios
   - Rollback is simpler (one revision)

**Cons:**
1. **Different deployment targets**
   - Frontend → Vercel (or SSR on VPS)
   - Backend services → VPS (compute-heavy)
   - Requires separate CI jobs

2. **Dependency bloat**
   - `package.json` now has Next.js + Node.js services
   - Larger node_modules
   - Could use monorepo workspaces to isolate

3. **Scaling patterns differ**
   - Frontend stateless (scales horizontally easily)
   - Pipeline services stateful (Redis state)
   - Different resource requirements

4. **Development experience**
   - Need to run both `next dev` and pipeline services
   - More complex local setup

5. **Repository size**
   - Monorepo can get unwieldy
   - But unlikely issue for a single-person project

---

### SEPARATE PROJECTS

**Pros:**
1. **Independent deployment**
   - Update web app without touching pipeline
   - Different release cadences
   - Faster frontend iterations

2. **Dependency isolation**
   - Web app: `next`, `react`, `stripe`, `tailwind`
   - Pipeline: `bullmq`, `photoshop-uxt`, `remotion-client`, `nodemailer`
   - No bloat in either direction

3. **Infrastructure alignment**
   - Web app naturally goes to Vercel/Netlify (no build needed for backend)
   - Backend stays on VPS with pm2
   - Clear separation of concerns

4. **Team scaling**
   - If you hire, frontend dev gets `sports-web-app` repo
   - Backend dev gets `sports-graphics-platform` repo
   - No accidental cross-team changes

5. **Cleaner CI/CD**
   - Web app CI: build Next.js, run browser tests
   - Backend CI: test pipeline jobs, validate renders
   - Each optimized independently

**Cons:**
1. **Type duplication**
   - Frontend duplicates Order, Player, Team interfaces
   - Changes require updates in 2+ places
   - Easy to fall out of sync
   - Solution: Shared npm package (but extra complexity)

2. **Shared code duplication**
   - Appwrite client setup needs to be consistent
   - Auth logic duplicated
   - State machine logic might be duplicated
   - Consent gates logic duplicated

3. **Coordination overhead**
   - "What version of the API does the web app expect?"
   - Data model changes require synchronized PRs
   - Testing requires running both projects locally

4. **Deployment complexity**
   - Need to know: "Is backend ready before deploying frontend?"
   - Versioning becomes important
   - More deployment scripts needed

5. **Development friction**
   - Clone two repos
   - Run two services
   - Harder to do "make this change end-to-end"

---

## 🎯 YOUR SITUATION

Given your setup:
- **Single developer** (you)
- **Coordinated updates** needed (data model changes affect both)
- **Same Appwrite instance** (can't separate databases)
- **Shared business logic** (order state machine, consent gates)
- **VPS deployment** (both go to same server eventually)
- **Early-stage project** (things will change)

---

## 💡 RECOMMENDATION: Keep Together with Good Structure

### Why?

1. **Type safety** — Shared `src/types/` keeps data contracts in sync
2. **DRY principle** — One `src/appwrite/client.ts` used by both frontend and backend
3. **Your workflow** — You're making coordinated changes anyway
4. **Early stage** — Easier to separate later than integrate later
5. **Testing** — Can write tests that verify frontend ↔ backend integration

### How to Structure It (Avoiding Monorepo Pain)

```
sports-graphics-platform/
├── src/                          # Shared backend logic
│   ├── appwrite/
│   ├── orders/
│   ├── pipeline/
│   ├── queue/
│   ├── types/                    # ← Shared types!
│   └── lib/
│
├── components-1-customer-web/   # Next.js app (separate folder)
│   ├── app/
│   ├── components/
│   ├── lib/                      # Frontend-specific (useAuth, etc)
│   ├── public/
│   ├── package.json             # ← Can have its own package.json
│   ├── next.config.js
│   └── tsconfig.json            # Frontend-specific tsconfig
│
├── components-2-automation-pipeline/
├── components-3-asset-generation/
├── components-4-business-backend/
│
├── package.json                  # Root (Node.js pipeline deps)
├── pnpm-workspace.yaml          # (If using pnpm workspaces)
└── tsconfig.base.json           # Shared TS config
```

### Separation Strategy

**Use npm/pnpm workspaces:**

```json
// Root package.json
{
  "name": "sports-graphics-platform",
  "private": true,
  "workspaces": [
    "components-1-customer-web",
    "."
  ],
  "scripts": {
    "dev": "concurrently 'npm:dev:web' 'npm:dev:pipeline'",
    "dev:web": "cd components-1-customer-web && next dev",
    "dev:pipeline": "node ecosystem.config.cjs start",
    "build": "npm -w components-1-customer-web run build && npm run build:pipeline",
    "test": "vitest run",
    "test:web": "npm -w components-1-customer-web run test"
  }
}

// components-1-customer-web/package.json
{
  "name": "@sports-graphics/web-app",
  "version": "1.0.0",
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "stripe": "^13.0.0",
    "gsap": "^3.12.0",
    "@sports-graphics/core": "workspace:*"  // ← Reference shared types!
  }
}
```

### Shared Types Export

```typescript
// src/types/index.ts
export type {
  Team,
  Player,
  Order,
  ParentOrder,
  OrderStatus,
  Deliverable,
} from './teams.js';

export type {
  PaymentFlow,
  DepositPayment,
} from './payments.js';

// Export from web app:
import type { Order, Team, Player } from '@sports-graphics/core';
// Export from pipeline:
import type { Order } from '../types/index.js';
```

### Build Strategy

```bash
# Deploy backend + frontend together to VPS
npm run build                    # Builds Next.js + backend services
npm run start                    # Starts both

# Or deploy separately:
npm -w components-1-customer-web run build  # → Vercel OR static VPS
npm run start:pipeline                      # → VPS pm2
```

---

## 🚀 Best of Both Worlds

This approach gives you:

✅ **Together benefits:**
- Shared types (no duplication)
- Coordinated updates (one PR)
- Single test suite
- End-to-end testing

✅ **Separate benefits:**
- Frontend has its own `node_modules` (Next.js deps isolated)
- Can deploy frontend independently if needed (Vercel)
- Clear folder structure
- Each app can have its own CI job

✅ **Your preference:**
- One clone, one repo
- One deployment if you want
- Two deployments if you want
- Easy to split later

---

## 🔄 Alternative: Separate If...

You'd want a separate repo **if:**

- [ ] You're hiring a frontend developer (different repo)
- [ ] Frontend needs to scale to 10+ deployments (Vercel CI)
- [ ] Frontend changes 10x more than backend (different release cadence)
- [ ] You want strict version boundaries (API versioning needed)

**None of these apply to your project yet.** Keep together.

---

## 📋 Implementation Plan (If Keeping Together)

1. **Create `components-1-customer-web/` folder**
2. **Set up workspaces in root `package.json`**
3. **Create `next.config.js` in web app folder**
4. **Import shared types from `src/types/`**
5. **Create API routes that call `src/queue/jobs/`**
6. **Export shared utilities from root in `package.json` exports field**

```json
// Root package.json
{
  "exports": {
    "./types": "./src/types/index.js",
    "./appwrite": "./src/appwrite/client.js",
    "./orders": "./src/orders/state-machine.js"
  }
}
```

Then in web app:
```typescript
import { Order, Player } from '@sports-graphics/web-app/types';
import { appwriteClient } from '@sports-graphics/web-app/appwrite';
```

---

## ✅ Final Recommendation

**Keep together.** Reasons:

1. **You're a solo developer** — Coordination overhead is minimal
2. **Shared data models** — Changes are coordinated anyway
3. **Same Appwrite instance** — Would need anyway
4. **Same VPS** — Infrastructure shared
5. **Early stage** — Easier to separate later than integrate now
6. **Type safety** — Single source of truth

**Structure with workspaces** — Get the best of both worlds.

---

## 🔮 If You Later Want to Separate

This is **trivial with workspaces:**

1. Extract `components-1-customer-web/` to separate repo
2. Publish shared types as npm package
3. Web app imports from npm instead of local
4. Deploy independently

It's a 30-minute refactor. Keep together for now.

