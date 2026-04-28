# Testing Philosophy

## Core Principle: Tests Before Code

Write the test first. Confirm it fails. Then implement until it passes.
A feature is not done until its tests pass. A feature without tests
does not exist in this codebase.

## Test Runner

**Vitest** — ESM native, fast, compatible with Node 20+.

```bash
npm run test          # run all tests
npm run test:watch    # watch mode during development
npm run test:coverage # coverage report
```

---

## Coverage Thresholds

| Area | Minimum Coverage | Rationale |
|------|-----------------|-----------|
| Order state machine | 100% | Every transition must be tested |
| Consent gate | 100% | Legal requirement |
| Payment flows | 100% | Financial correctness |
| Pipeline jobs | 80% | Render logic is harder to unit test |
| API routes | 80% | Integration tested |
| UI components | 60% | Visual logic is lower risk |

---

## Test File Location

Tests live alongside source files:
```
src/orders/state-machine.js
src/orders/state-machine.test.js

src/pipeline/consent/check-consent.js
src/pipeline/consent/check-consent.test.js
```

---

## Test Categories

### Unit Tests
Test a single function or module in isolation.
Mock all external dependencies.

```javascript
// check-consent.test.js
import { describe, it, expect, vi } from 'vitest';
import { checkConsent, applyEnhancement } from './check-consent.js';

describe('checkConsent', () => {
  it('returns true when flag is explicitly set', () => {
    const consent = { flags: { backgroundRemoval: true } };
    expect(checkConsent(consent, 'backgroundRemoval')).toBe(true);
  });

  it('returns false when flag is absent', () => {
    const consent = { flags: {} };
    expect(checkConsent(consent, 'aiMotion')).toBe(false);
  });

  it('returns false when flag is explicitly false', () => {
    const consent = { flags: { aiMotion: false } };
    expect(checkConsent(consent, 'aiMotion')).toBe(false);
  });
});
```

### Integration Tests
Test that components work together. Use a test Appwrite instance
or mock the Appwrite SDK.

```javascript
// order-flow.test.js
describe('order state transitions', () => {
  it('transitions from PENDING_PAYMENT to IN_PRODUCTION on deposit webhook', async () => {
    const order = await createTestOrder();
    await processDepositWebhook(order.id, mockStripeEvent);
    const updated = await getOrder(order.id);
    expect(updated.state).toBe('IN_PRODUCTION');
  });

  it('does not transition without valid Stripe signature', async () => {
    const order = await createTestOrder();
    await expect(
      processDepositWebhook(order.id, { ...mockStripeEvent, signature: 'bad' })
    ).rejects.toThrow('Webhook Error');
  });
});
```

### Pipeline Tests
Test that jobs produce correct outputs given known inputs.
Use fixture files (small test images, simple compositions).

```javascript
// render-video.test.js
describe('renderVideo', () => {
  it('produces an MP4 file at the correct dimensions', async () => {
    const result = await renderVideo({
      composition: 'fixtures/simple-composition.html',
      data: testPlayerData,
      output: 'tmp/test-output.mp4',
      width: 1920,
      height: 1080
    });
    expect(result.success).toBe(true);
    expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
  });

  it('skips aiMotion when consent flag is false', async () => {
    const data = { ...testPlayerData, consentLog: { aiMotion: false } };
    const result = await renderVideo({ composition, data, output, width, height });
    expect(result.appliedEnhancements).not.toContain('aiMotion');
  });
});
```

---

## Required Tests Per Feature

### Every Order State Transition
```
PENDING_PAYMENT → IN_PRODUCTION
  ✓ transitions on valid deposit webhook
  ✓ does not transition on invalid signature
  ✓ does not transition if already IN_PRODUCTION

PROOF_APPROVED → PENDING_FINAL_PAYMENT
  ✓ transitions after valid approval with authenticated user
  ✓ does not transition without authenticated user
  ✓ logs approval with timestamp and IP

PAID_IN_FULL → FULFILLMENT
  ✓ only triggers when BOTH proof approved AND balance paid
  ✓ does not trigger on balance paid alone
  ✓ does not trigger on proof approved alone
```

### Every Consent Check
```
backgroundRemoval
  ✓ applied when consent true
  ✓ skipped when consent false
  ✓ skipped when consent absent

poseAdjustment
  ✓ applied when consent true
  ✓ fallback used when consent false

aiMotion
  ✓ applied when consent true
  ✓ static fallback used when consent false
  ✓ fallback produces valid output (not an error)
```

### Every Payment Flow
```
Deposit
  ✓ creates Payment Intent with correct amount
  ✓ uses idempotency key
  ✓ records to financial_records on success
  ✓ records to financial_records on failure

Balance
  ✓ only invoiced after PROOF_APPROVED state
  ✓ release gate checks both proof AND payment
  ✓ records to financial_records

Download link
  ✓ is single-use (second request returns 410)
  ✓ expires after 48 hours
  ✓ rejects unauthenticated requests
  ✓ rejects requests from non-owner users
```

### Photo Validation (Transformers.js)
```
✓ passes valid centered face photo
✓ rejects image with no detected face
✓ rejects image below minimum resolution
✓ rejects image with multiple faces (group photo)
✓ returns specific error message per failure type
✓ does not upload to server on validation failure
```

---

## Test Fixtures

```
tests/
├── fixtures/
│   ├── players/
│   │   ├── valid-photo.jpg          clean single-subject photo
│   │   ├── no-face.jpg              landscape photo
│   │   ├── group-photo.jpg          multiple faces
│   │   ├── low-res.jpg              below minimum resolution
│   │   └── valid-cutout.png         BiRefNet-processed output
│   ├── compositions/
│   │   └── simple-composition.html  minimal Hyperframes composition
│   ├── orders/
│   │   ├── valid-order.json
│   │   └── minimal-team.json
│   └── stripe/
│       ├── deposit-webhook.json     mock Stripe deposit event
│       └── balance-webhook.json     mock Stripe balance event
└── helpers/
    ├── create-test-order.js
    ├── mock-appwrite.js
    └── mock-stripe.js
```

---

## Running Tests in CI

Tests run on every push and pull request.
Pipeline will not deploy if any test fails or coverage drops below threshold.

```yaml
# .github/workflows/test.yml
- run: npm run test:coverage
- run: npm run test:coverage -- --coverage.thresholds.lines=80
```
