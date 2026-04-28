# Security

## Asset Protection Model

### Storage Tiers

| Asset Type | Appwrite Bucket | Permissions | URL Lifetime |
|------------|----------------|-------------|--------------|
| Customer photo uploads | `uploads` | Pipeline service account only | N/A (no direct URL) |
| Proof assets (watermarked) | `proofs` | Signed URL, per-request | 15 minutes |
| Final assets | `finals` | Single-use signed URL | 48 hours |
| Parent store previews | `previews` | Authenticated session | Session duration |
| Brand templates | VPS filesystem | Pipeline read-only | N/A |

**No asset bucket is ever set to public.** All access goes through
authenticated API routes that validate ownership before generating URLs.

### Proof Asset Access Pattern
```javascript
// Every proof URL request MUST follow this pattern
async function getProofUrl(orderId, assetId, requestingUserId) {
  // 1. Verify user owns this order
  const order = await db.getOrder(orderId);
  if (order.customerId !== requestingUserId) throw new AuthError();

  // 2. Verify order is in a reviewable state
  const reviewable = ['PENDING_PROOF_REVIEW', 'PROOF_REVISION_REQUESTED'];
  if (!reviewable.includes(order.state)) throw new StateError();

  // 3. Log the access
  await db.logProofAccess({ orderId, assetId, userId: requestingUserId, timestamp: new Date() });

  // 4. Generate short-lived signed URL
  return appwrite.storage.getFileView('proofs', assetId, { expiry: 900 }); // 15 min
}
```

### Final Asset Delivery Pattern
```javascript
async function releaseFinalAsset(orderId, requestingUserId) {
  const order = await db.getOrder(orderId);

  // BOTH conditions must be true — never check individually
  const canRelease = order.state === 'PAID_IN_FULL' &&
                     order.proofLog.some(p => p.action === 'APPROVED');
  if (!canRelease) throw new ReleaseError();

  // Mark download as single-use before returning URL
  await db.markDownloadPending(orderId);

  const url = await appwrite.storage.getFileDownload('finals', order.finalAssetId, {
    expiry: 172800 // 48 hours
  });

  await db.recordDownloadLink(orderId, { url, expiry: Date.now() + 172800000 });
  return url;
}

// On download webhook / first access:
async function consumeDownloadLink(orderId) {
  await db.markDownloadUsed(orderId, { usedAt: new Date() });
  // Subsequent requests return 410 Gone
}
```

---

## Consent Requirements

### Legal Context
- Illinois BIPA and California AB 1836 require explicit consent for
  AI-generated likeness, particularly for minors (under 18)
- Consent must be granular (per enhancement type), not bundled in ToS
- Records must be permanent and auditable

### Consent Collection Rules
1. Consent is collected **per player** at order time
2. Each flag is a **separate explicit checkbox** — never pre-checked
3. The coach/parent signing consent must be an **authenticated user**
4. Consent is **irrevocable per order** — changes require a new order
5. `aiMotion` flag requires an **additional confirmation step** with
   plain-language explanation of what the enhancement does

### Consent Storage
```javascript
// Written once, never updated
const consentRecord = {
  playerId,
  orderId,
  flags: {
    backgroundRemoval: boolean,
    colorAdjustment: boolean,
    poseAdjustment: boolean,
    aiMotion: boolean,
    marketingUse: boolean
  },
  signedBy: userId,        // authenticated user ID
  timestamp: ISO8601,
  ipAddress: hashedIP,     // hashed, not raw
  userAgent: string,
  orderVersion: string,    // schema version at time of consent
  legalText: string        // exact text shown to user at consent time
};
```

### Pipeline Consent Gate
```javascript
// In every AI enhancement job — no exceptions
async function applyEnhancement(playerId, enhancementType, fn) {
  const consent = await getConsentLog(playerId);
  if (!consent.flags[enhancementType]) {
    logger.info('Enhancement skipped — no consent', { playerId, enhancementType });
    return applyFallback(enhancementType);
  }
  return fn();
}
```

---

## Payment Security

### Stripe Webhook Validation
All Stripe webhooks must be validated with the webhook secret.
Never process a webhook event that fails signature verification.

```javascript
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Process event
});
```

### Payment State Rules
- Order state transitions driven by **webhook events only** — never by
  client-side confirmation
- Deposit and balance are **separate Payment Intents** — never a single
  partial capture
- Financial records written on **every** Stripe event, including failures
- Refunds always logged to `financial_records` with reason

### Idempotency
All payment operations use Stripe idempotency keys:
```javascript
stripe.paymentIntents.create({ ... }, {
  idempotencyKey: `deposit-${orderId}`
});
```

---

## Authentication

### Session Rules
- All order management routes require authenticated session
- Parent store requires authentication (not just share code)
  — share code is for discovery, auth is for purchase
- Admin/pipeline routes use Appwrite service account API key
  — never exposed to client

### Rate Limiting
- Photo upload endpoint: 20 requests/minute per user
- Proof URL generation: 60 requests/minute per order
- Stripe webhook endpoint: no limit (Stripe IPs only via allowlist)
- Parent store order: 5 orders/minute per user

---

## Data Retention

| Data | Retention | Reason |
|------|-----------|--------|
| consent_logs | Permanent | Legal requirement |
| proof_approvals | Permanent | Legal requirement |
| financial_records | 7 years | Tax requirement |
| Customer uploads (originals) | 90 days post-delivery | Storage cost |
| Proof assets (watermarked) | 30 days post-delivery | Storage cost |
| Final assets | 1 year | Reorder support |
| team.json | Indefinite | Reorder flow |

---

## Incident Response

If asset theft is suspected:
1. Check `deliveryLog.downloadUsedAt` — was the link used?
2. Check proof access logs for unusual access patterns
3. Check embedded metadata in any found asset for order ID
4. Preserve all logs before any state changes
5. Do not delete order records — flag as `DISPUTED`
