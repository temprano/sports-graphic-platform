# Coding Conventions

## Module System
- **ESM only** across all application code
- File extensions: `.js` with `"type": "module"` in package.json, or `.mjs`
- Exception: `ecosystem.config.cjs` for PM2 (required by PM2's loader)
- Imports use explicit extensions: `import { x } from './utils.js'`
- No barrel `index.js` files — import directly from the source file

## Naming Conventions

### Files and Folders
```
kebab-case/           for folders
kebab-case.js         for files
kebab-case.test.js    for test files
UPPER_CASE.md         for documentation files
```

### Code
```javascript
const camelCase        // variables, function names
const PascalCase       // classes, React components
const SCREAMING_SNAKE  // constants, env var references
kebab-case             // CSS classes, HTML ids, JSON keys
```

### Database Collections (Appwrite)
```
customers
orders
teams
players
brands
parent_orders
consent_logs
financial_records
proof_approvals
```

## Async Patterns
- Always `async/await` — no `.then()` chains
- Always wrap in `try/catch` — no unhandled promise rejections
- Use early returns to avoid deep nesting

```javascript
// Good
async function getOrder(orderId) {
  try {
    const order = await db.getDocument('orders', orderId);
    if (!order) return null;
    return order;
  } catch (error) {
    logger.error('getOrder failed', { orderId, error });
    throw error;
  }
}

// Bad
function getOrder(orderId) {
  return db.getDocument('orders', orderId)
    .then(order => order)
    .catch(err => console.log(err));
}
```

## Error Handling
- All errors include context: `{ operation, id, error }`
- User-facing errors never expose internal details
- Pipeline errors trigger job retry via BullMQ, then dead-letter after 3 attempts
- Payment errors always logged to `financial_records` regardless of outcome

```javascript
// Error shape
throw new AppError('PROOF_GENERATION_FAILED', {
  orderId,
  playerId,
  cause: originalError
});
```

## Environment Variables
- All env vars referenced via a central `config.js` module — never `process.env` inline
- Every var documented in `.env.example`
- Validated at startup — app fails fast if required vars are missing

```javascript
// config.js
export const config = {
  appwrite: {
    endpoint: required('APPWRITE_ENDPOINT'),
    projectId: required('APPWRITE_PROJECT_ID'),
    apiKey: required('APPWRITE_API_KEY'),
  },
  stripe: {
    secretKey: required('STRIPE_SECRET_KEY'),
    webhookSecret: required('STRIPE_WEBHOOK_SECRET'),
  }
};
```

## API Routes (Next.js App Router)
```
/api/orders/            POST   create order
/api/orders/[id]/       GET    get order
/api/orders/[id]/proof/ GET    get proof assets (authenticated, signed URL)
/api/orders/[id]/approve/ POST approve proof
/api/webhooks/stripe/   POST   stripe webhook handler
/api/parent-store/[slug]/ GET  get parent store
```

## File Organization Per Component

### Component 1 — Customer Web App
```
src/
├── app/                    Next.js App Router pages
├── components/
│   ├── brand-builder/      brand infographic builder
│   ├── photo-uploader/     Transformers.js validation
│   ├── roster-importer/    PDF parse + editable grid
│   └── proof-viewer/       watermarked proof review
├── lib/
│   ├── stripe.js           Stripe client + helpers
│   ├── appwrite.js         Appwrite client
│   └── validators.js       shared input validation
└── hooks/                  React hooks
```

### Component 2 — Automation Pipeline
```
src/
├── queue/
│   ├── worker.js           BullMQ worker entry point
│   └── jobs/
│       ├── process-photos.js     ComfyUI BiRefNet job
│       ├── render-video.js       Hyperframes render job
│       ├── render-print.js       Photoshop UXP job
│       └── package-order.js      zip + delivery job
├── pipeline/
│   ├── comfyui-client.js
│   ├── hyperframes-client.js
│   └── photoshop-client.js
└── consent/
    └── check-consent.js    consent gate before AI enhancement
```

### Component 3 — Asset Generation
```
brands/
├── [brand-name]/
│   ├── brand.json          registry entry + token schema
│   ├── brand-tokens.css    CSS custom properties
│   ├── compositions/
│   │   ├── player-intro-full.html      16:9 full length
│   │   ├── player-intro-short.html     9:16 short form
│   │   └── team-banner.html
│   └── print/
│       ├── poster-16x20.psjs           Photoshop UXP script
│       └── banner-2x6.psjs
```

### Component 4 — Business Backend
```
src/
├── appwrite/
│   ├── collections.js      collection IDs + schema
│   └── storage.js          bucket IDs + access rules
├── orders/
│   ├── state-machine.js    order state transitions
│   └── financial.js        profit calculation, Stripe data
├── parent-store/
│   ├── generate-store.js   spin up store after team approval
│   └── store-permissions.js
└── marketing/
    └── reorder-triggers.js
```

## Testing Conventions
See `tests/README.md` for full philosophy.

- Test files live alongside source: `thing.js` + `thing.test.js`
- Test runner: Vitest (ESM native, fast)
- Coverage threshold: 80% for pipeline code, 60% for UI code
- Every order state transition must have a test
- Every consent check must have a test
- Every payment flow must have a test

## Git Conventions
```
feat/component-N-description    feature branches
fix/description                 bug fixes
chore/description               non-feature work

Commit messages:
feat(pipeline): add BiRefNet consent gate
fix(payments): handle stripe webhook retry correctly
chore(deps): update hyperframes to 1.2.0
```

## Comments
- Comment **why**, not **what**
- TODOs include a ticket/issue reference: `// TODO(#42): handle retry logic`
- Consent and payment logic always gets a comment explaining the business rule
