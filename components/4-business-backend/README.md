# Component 4 — Business Backend

Appwrite collections, order state machine, financial records, parent store
management, consent log storage, and marketing layer. The data and financial
source of truth for the entire platform.

## Start Here
See `/ARCHITECTURE.md` Component 4 section.
See `/SCHEMA.md` for all Appwrite collection schemas.
See `/docs/SECURITY.md` for data retention policies and access rules.
See `/TODO.md` Component 4 section for current tasks.

## Appwrite Collections
```
customers           contact info, order history
orders              state machine, payment records
teams               saved team.json — preserved for reorders
players             per-player data + consent logs
brands              mirrors Component 3 brand registry
parent_orders       linked to team orders, separate fulfillment
financial_records   revenue, costs, profit per order
proof_approvals     permanent audit log
consent_logs        permanent legal record
```

## Setup
```bash
node scripts/setup-appwrite.js
```
Creates all collections, indexes, and storage buckets in your Appwrite
project. Safe to re-run (idempotent).

## Order State Machine
```
PENDING_PAYMENT → IN_PRODUCTION → PENDING_PROOF_REVIEW
→ PROOF_APPROVED → PENDING_FINAL_PAYMENT → PAID_IN_FULL
→ FULFILLMENT → DELIVERED

Any state → DISPUTED
```
Every transition is validated and logged. Invalid transitions throw.
See `src/orders/state-machine.js`.

## Critical Rules
- consent_logs and proof_approvals are NEVER deleted — permanent legal record
- financial_records retained 7 years minimum
- All state transitions driven by Stripe webhooks — never client-side events
- Profit calculated as: gross - fulfillment_cost - stripe_fees
