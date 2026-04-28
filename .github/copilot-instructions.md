# GitHub Copilot Instructions

## Project
Automated sports graphics platform. Four components:
1. Customer web app (Next.js, Stripe, Appwrite)
2. Automation pipeline (BullMQ, ComfyUI, Hyperframes, Photoshop UXP)
3. Asset generation (HTML/GSAP brand templates, Photoshop UXP print templates)
4. Business backend (Appwrite, order state machine, financial records)

## Non-Negotiable Rules

- ESM only. Never suggest `require()` or `.cjs` (except ecosystem.config.cjs)
- Tests before implementation. Always suggest test file alongside source file
- No hardcoded hex colors in compositions — always CSS custom properties
- No public Appwrite storage buckets — all assets behind authenticated endpoints
- Consent gate before every AI enhancement — check `consentLog` flags per player
- Finals only released when `PROOF_APPROVED` AND `PAID_IN_FULL` are both true
- Always `async/await` — never `.then()` chains
- Always `try/catch` around async operations

## Tech Stack
- Runtime: Node.js 20+ ESM
- Frontend: Next.js App Router + Tailwind CSS
- Database: Appwrite (Cloud dev / self-hosted VPS prod)
- Queue: BullMQ + Redis
- Video: Hyperframes + GSAP (primary), Remotion (complex sequences)
- Print: Photoshop UXP scripting
- AI Image: ComfyUI BiRefNet
- Photo validation: Transformers.js v4 (client-side)
- Payments: Stripe (two-stage deposit + balance)
- Fulfillment: Prodigi / Printful
- Process manager: PM2

## File Naming
- `kebab-case.js` for files
- `kebab-case.test.js` for tests
- `PascalCase` for React components
- `camelCase` for functions and variables

## Import Style
```javascript
// Always explicit extensions
import { something } from './module.js';
import { other } from '../lib/helper.js';
```

## Error Pattern
```javascript
try {
  const result = await operation();
  return result;
} catch (error) {
  logger.error('operation failed', { context, error });
  throw error;
}
```

## Order State Machine States
PENDING_PAYMENT → IN_PRODUCTION → PENDING_PROOF_REVIEW →
PROOF_APPROVED → PENDING_FINAL_PAYMENT → PAID_IN_FULL →
FULFILLMENT → DELIVERED

## Key Data Shapes
See SCHEMA.md for full team.json, order.json, and brand.json definitions.

## Test Runner
Vitest. Tests live alongside source files.
