# Appwrite Setup Guide

## Current Status

✅ **setup-appwrite.js reviewed and fixed**
- Fixed import path: `../src/config.js` → `../config.js`
- Script is comprehensive and production-ready
- Handles existing collections gracefully (re-run safe)

✅ **config.js created and ready**
- Located at root (for now, will move to src/config.js when dirs organized)
- Validates all required env vars at startup
- Provides centralized access to configuration

⚠️ **Missing: Appwrite Credentials**
- APPWRITE_ENDPOINT: https://cloud.appwrite.io/v1 ✓
- APPWRITE_PROJECT_ID: (empty — needs value)
- APPWRITE_API_KEY: (empty — needs value)

## What setup-appwrite.js Does

### Collections Created (8 total)

1. **customers** — Team/coach accounts
   - Email (unique index)
   - School, sport, order history

2. **orders** — Team photo orders
   - State (enum: 10 states including DISPUTED)
   - Payment tracking (deposit + balance)
   - Proof log, delivery log, fulfillment info

3. **teams** — Brand configurations
   - Brand ID, team name, sport, season
   - Team JSON (layout, colors, fonts, logo, players)

4. **players** — Individual player data
   - Name, number, position, year
   - Photo metadata, stats
   - Team ID and order ID

5. **consent_logs** — Legal compliance (permanent)
   - 5 consent flags (backgroundRemoval, colorAdjustment, poseAdjustment, aiMotion, marketingUse)
   - All default to false
   - Signed by, timestamp, IP, user agent
   - Never deleted (7-year retention for legal)

6. **proof_approvals** — Audit trail (permanent)
   - Order ID, version, action (approve/revise)
   - Approved by, timestamp, IP, notes

7. **financial_records** — Accounting (7-year retention)
   - Stripe event/intent IDs
   - Payment stage, status
   - Gross, fees, fulfillment cost, profit

8. **parent_orders** — Parent store purchases
   - Team order ID, parent ID, player ID
   - State (4 states: PENDING_PAYMENT → PROCESSING → FULFILLED → DELIVERED)
   - Products, shipping, Stripe ID, fulfillment ref

9. **brands** — Brand template registry
   - Slug (unique), name, description
   - Active flag, sports, token schema

### Storage Buckets Created (4 total)

1. **uploads** (50MB max)
   - Customer photo uploads
   - Pipeline service account access only
   - jpg, jpeg, png, webp

2. **proofs** (500MB max)
   - Watermarked proof assets
   - Signed URL access, 15min expiry
   - jpg, jpeg, png, mp4, webm

3. **finals** (2GB max)
   - Final deliverables (print-ready + video pack)
   - Single-use download, 48hr expiry
   - jpg, jpeg, png, mp4, pdf, zip

4. **previews** (10MB max)
   - Parent store product mockups
   - Authenticated session access
   - jpg, jpeg, png, webp

## Setup Steps

### 1. Get Appwrite Credentials

**Option A: Appwrite Cloud (Dev)**
- Go to https://cloud.appwrite.io
- Sign up or log in
- Create new project (or use existing)
- Copy Project ID from Settings
- Create API Key with scopes: `databases.write`, `storage.write`
- Copy API Key

**Option B: Self-Hosted (Production)**
- Deploy Appwrite on VPS (Hostinger KVM2, Ubuntu 24.04)
- Access at: `http://your-vps-ip/v1`
- Same steps as Cloud

### 2. Update .env File

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<your-project-id>
APPWRITE_API_KEY=<your-api-key>
APPWRITE_BUCKET_UPLOADS=uploads
APPWRITE_BUCKET_PROOFS=proofs
APPWRITE_BUCKET_FINALS=finals
APPWRITE_BUCKET_PREVIEWS=previews

# Other required vars (already filled)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Setup Script

```bash
node scripts/setup-appwrite.js
```

**Output (successful):**
```
=== Sports Graphics Platform — Appwrite Setup ===

Endpoint:   https://cloud.appwrite.io/v1
Project ID: <your-id>

Database
  + Created database 'sports-graphics'

customers
  + Created collection 'customers'
    + Attribute 'name' (string)
    + Attribute 'email' (string)
    ...
  + Index 'idx_email'
  + Index 'idx_school'

[... all collections ...]

=== Setup complete ===

Next steps:
  1. Verify collections in the Appwrite console
  2. Seed the brands collection with active brand entries
     node scripts/seed-brands.js
  3. Start development:
     npm run dev
```

### 4. Verify in Appwrite Console

- Go to https://cloud.appwrite.io (or your self-hosted URL)
- Navigate to Databases → sports-graphics
- Verify all 9 collections exist with correct attributes
- Navigate to Storage
- Verify all 4 buckets exist with correct size limits

### 5. Seed Brands (Next)

```bash
node scripts/seed-brands.js
```

This will create:
- cinematic-dark brand
- Other default brands (TBD)

## Re-Running Setup

**Safe to re-run** — The script checks if resources exist before creating:
- If collection exists → skips (prints ✓)
- If attribute exists → skips (prints ✓)
- If index exists → skips (prints ✓)
- If bucket exists → skips (prints ✓)

This makes it safe for:
- CI/CD pipelines
- Development environment reset
- Adding new collections without recreating existing ones

## Troubleshooting

### "Missing required environment variable"

**Cause:** .env file not filled in properly  
**Fix:** Update .env with actual Appwrite credentials

```bash
# Check current values
cat .env | grep APPWRITE
```

### "Invalid API Key"

**Cause:** API key doesn't have proper scopes  
**Fix:** In Appwrite console, edit API key and enable:
- ✓ databases.write
- ✓ storage.write

### "Connection refused"

**Cause:** Appwrite endpoint is down or unreachable  
**Fix:**
- Appwrite Cloud: Check https://status.appwrite.io
- Self-hosted: Verify VPS is running and accessible

### "Collection/bucket already exists"

**This is normal** — Script skips existing resources. Just means setup was already run.

## Database Schema

All collections use Appwrite's native types:
- string (up to 65535 chars for JSON)
- boolean (default: false for all consent flags)
- integer (for amounts, counts)
- datetime (for timestamps)
- enum (for state machines)
- json (stored as string, requires manual parsing)

### Indexes for Performance

Created on:
- Email (unique): customers.email
- Order state: orders.state (for filtering by state)
- Created date (DESC): orders.createdAt (for recent-first queries)
- Foreign keys: All collection relationships indexed

## Data Retention Policies

| Collection | Retention | Notes |
|---|---|---|
| customers | Indefinite | Account records |
| orders | Indefinite | Order history |
| teams | Indefinite | Brand configs |
| players | Indefinite | Player data |
| consent_logs | 7 years | **Legal requirement** — never delete |
| proof_approvals | 7 years | **Audit trail** — never delete |
| financial_records | 7 years | **Tax/accounting** — never delete |
| parent_orders | Indefinite | Parent store purchases |
| brands | Indefinite | Brand templates |

## File Changes

**Before:**
```javascript
import { config } from '../src/config.js';
```

**After:**
```javascript
import { config } from '../config.js';
```

This reflects that config.js is at root for now (will organize to src/ when directory structure is finalized).

## Next: Run the Setup

**Prerequisites:**
1. ✅ config.js created
2. ✅ .env file exists
3. ⏳ .env needs valid Appwrite credentials
4. ✅ setup-appwrite.js reviewed and fixed

**When ready:**
```bash
node scripts/setup-appwrite.js
```
