# Component 1: Web App - Implementation Roadmap

**Status**: ✅ Scaffolding Phase Complete  
**Last Updated**: April 29, 2026  
**Target Completion**: May 15, 2026

---

## 🎯 Current State

The Next.js 14 web app scaffold is **ready for backend integration**. All routes, pages, and UI components are created but disconnected from:
- Appwrite authentication
- Appwrite data queries
- Stripe payment processing
- Order state management
- Email notifications

---

## 📋 Implementation Checklist

### ✅ COMPLETED (22 items)

- [x] Next.js 14 App Router structure
- [x] Landing page (5 sections + CTA)
- [x] Team login form (UI only)
- [x] Parent entry form (code → player picker)
- [x] Team dashboard (sidebar, stats, recent orders)
- [x] Team orders list page
- [x] Team settings page
- [x] Parent store catalog (3 products)
- [x] Shopping cart page
- [x] Tailwind CSS dark theme
- [x] TypeScript configuration with path aliases
- [x] Environment variables template
- [x] Next.js security headers
- [x] Image optimization config
- [x] PostCSS + Tailwind pipeline
- [x] Global styles + animations
- [x] npm workspaces setup
- [x] Root package.json configured
- [x] .gitignore rules
- [x] README documentation
- [x] Git commit & push

### 🟡 IN PROGRESS (0 items)

None - Ready to begin Phase 1 implementation.

### ⏳ BLOCKED (0 items)

None - All prerequisites installed and ready.

### ⏸️ TO DO (25+ items)

---

## 🚀 Phase 1: Authentication (Days 1-2)

**Goal**: Enable team members to log in and access their dashboard.

### 1.1 Appwrite Setup

**File**: `APPWRITE_SETUP.md` (existing)  
**Time**: 30 minutes

**Tasks**:
- [ ] Create Appwrite project (Cloud or self-hosted)
- [ ] Create 4 collections with schemas:
  - `teams` (id, name, code, password_hash, logo_url, brand_folder, etc.)
  - `players` (id, team_id, name, number, photo_url, consent_log, etc.)
  - `orders` (id, team_id, status, deliverables, payment, etc.)
  - `parent_orders` (id, team_id, player_id, items, status, etc.)
- [ ] Set up Row-Level Security (RLS) rules
- [ ] Create Appwrite API key
- [ ] Record credentials in `.env.local`

**Reference**: [COMPONENT_1_ARCHITECTURE.md](../COMPONENT_1_ARCHITECTURE.md) → Data Models section

### 1.2 Team Authentication Implementation

**Files to Create**:
- `src/lib/auth/team-auth.ts` — Verification logic
- `src/lib/auth/password.ts` — Password hashing (bcryptjs)
- `src/hooks/useTeamAuth.ts` — Auth context hook
- `src/middleware.ts` — Protect team routes

**Time**: 2 hours

**Tasks**:
- [ ] Implement `verifyTeamCode(code, password)` → Appwrite query
  - Query teams collection: `team_code == code`
  - Compare password with `bcryptjs.compare()`
  - Return user object with team_id, role
- [ ] Implement JWT token generation
  - Payload: `{ sub: userId, team_id, role, exp: +60days }`
  - Use `jose` or `jsonwebtoken` library
- [ ] Implement cookie setter
  - Cookie: `httpOnly`, `secure`, `sameSite: 'lax'`, max-age: 60 days
- [ ] Create `useTeamAuth()` hook to read JWT from cookies
- [ ] Protect `/team/*` routes with middleware

**Test**: 
```bash
npm test -- team-auth.test.ts
```

### 1.3 Parent Session Implementation

**Files to Create**:
- `src/lib/auth/parent-auth.ts` — Session generation
- `src/hooks/useParentSession.ts` — Session context
- `src/lib/session-token.ts` — Temp token codec

**Time**: 1.5 hours

**Tasks**:
- [ ] Implement `verifyTeamCodeAndFetchPlayers(code)`
  - Query teams: `team_code == code` (public query, no auth)
  - Query players: `team_id == team_id`
  - Return player list
- [ ] Implement `createParentSession(team_id, player_id)`
  - Generate 24-hour session token with `jose` or similar
  - Return token to client
- [ ] Implement session token validation middleware
  - Decode token on protected parent routes
  - Verify expiry
  - Attach `session.team_id`, `session.player_id` to request
- [ ] Store session in `sessionStorage` (auto-expires on browser close)

**Test**:
```bash
npm test -- parent-auth.test.ts
```

### 1.4 Wire Forms to Backend

**File**: `components-1-customer-web/app/auth/team-login/page.tsx`

**Time**: 1 hour

**Tasks**:
- [ ] Replace `handleSubmit` console.log with actual API call
  - POST `/api/auth/team-login` with `{ teamCode, password }`
  - On success: Redirect to `/team/dashboard`
  - On error: Display error message from API
- [ ] Add loading state during submission
- [ ] Add error boundary

**File**: `components-1-customer-web/app/auth/parent-entry/page.tsx`

**Tasks**:
- [ ] Step 1: Replace mock code verification
  - POST `/api/auth/parent-entry/verify-code` with `{ teamCode }`
  - Fetch real players from API
  - Display actual player data
- [ ] Step 2: Wire player selection
  - POST `/api/auth/parent-entry/create-session` with `{ playerId }`
  - Store session token
  - Redirect to `/parent-store`

### 1.5 Create API Routes

**Files to Create**:
- `components-1-customer-web/app/api/auth/team-login/route.ts`
- `components-1-customer-web/app/api/auth/parent-entry/verify-code/route.ts`
- `components-1-customer-web/app/api/auth/parent-entry/create-session/route.ts`

**Time**: 2 hours

**Tasks**:
- [ ] `/api/auth/team-login` (POST)
  - Validate body: `{ teamCode, password }`
  - Call `verifyTeamCode()` from `src/lib/auth/team-auth.ts`
  - On success: Generate JWT, set httpOnly cookie, return `{ success: true, redirectUrl: '/team/dashboard' }`
  - On error: Return `{ error: 'Invalid code or password' }`
- [ ] `/api/auth/parent-entry/verify-code` (POST)
  - Validate body: `{ teamCode }`
  - Call `verifyTeamCodeAndFetchPlayers()` from `src/lib/auth/parent-auth.ts`
  - Return `{ players: [...], teamId }`
- [ ] `/api/auth/parent-entry/create-session` (POST)
  - Validate body: `{ playerId }`
  - Call `createParentSession()` from `src/lib/auth/parent-auth.ts`
  - Return `{ sessionToken, redirectUrl: '/parent-store' }`

**Test**:
```bash
npm run test:web -- api
```

### 1.6 Add Logout

**File**: `components-1-customer-web/app/team/layout.tsx`

**Time**: 30 minutes

**Tasks**:
- [ ] Wire logout button to POST `/api/auth/logout`
- [ ] Create `/api/auth/logout` route
  - Clear httpOnly cookie
  - Return `{ redirectUrl: '/' }`
- [ ] Redirect user to `/`

---

## 🎨 Phase 2: Team Dashboard & Order Display (Days 2-3)

**Goal**: Show team members their orders with status and proof review capabilities.

### 2.1 Fetch Team Orders

**File**: `src/hooks/useTeamOrders.ts` (new)

**Time**: 1.5 hours

**Tasks**:
- [ ] Create `useTeamOrders()` hook
  - Fetch orders for current team from Appwrite
  - Query: `orders.team_id == user.team_id` + sort by created_at DESC
  - Return `{ orders, loading, error }`
- [ ] Create `useOrderDetail(orderId)` hook
  - Fetch single order with deliverables and payment info
  - Return `{ order, loading, error }`

**Test**:
```bash
npm test -- useTeamOrders.test.ts
```

### 2.2 Update Dashboard Page

**File**: `components-1-customer-web/app/team/dashboard/page.tsx`

**Time**: 1 hour

**Tasks**:
- [ ] Import `useTeamOrders()` hook
- [ ] Fetch and display real stats:
  - Total orders (count all orders)
  - Pending review (count orders where status == 'PENDING_PROOF_REVIEW')
  - Revenue (sum all `payment.deposit_paid` + `payment.balance_paid`)
- [ ] Display recent orders table
  - Columns: Order ID, Players, Status, Created Date, Action (View)

### 2.3 Create Order Detail Page

**File**: `components-1-customer-web/app/team/orders/[orderId]/page.tsx` (new)

**Time**: 2 hours

**Tasks**:
- [ ] Create dynamic route handler
- [ ] Import `useOrderDetail()` hook
- [ ] Display order information:
  - Team name, order ID, created date
  - Status badge
  - Player list with their assigned videos
- [ ] Display proof carousel (scaffold for phase 3)
- [ ] Display payment status

### 2.4 Update Orders List Page

**File**: `components-1-customer-web/app/team/orders/page.tsx`

**Time**: 1 hour

**Tasks**:
- [ ] Import `useTeamOrders()` hook
- [ ] Display table of all orders
- [ ] Add filters: status, date range, player name
- [ ] Add link to individual order detail

---

## 💳 Phase 3: Stripe Payment Integration (Days 3-4)

**Goal**: Enable parents to purchase products and process payments.

### 3.1 Create Cart Store

**File**: `src/context/CartContext.tsx` or `src/store/cartStore.ts` (new)

**Time**: 1 hour

**Tasks**:
- [ ] Create Zustand store with state:
  - `items: [{ productId, format, quantity, price }]`
  - `addItem(product)` — Add to cart or increment quantity
  - `removeItem(productId)` — Remove from cart
  - `updateQuantity(productId, qty)` — Change quantity
  - `clear()` — Empty cart
  - `total()` — Calculate cart total
- [ ] Add localStorage persistence
  - Save to localStorage after each action
  - Restore on page load

**Test**:
```bash
npm test -- cartStore.test.ts
```

### 3.2 Wire Shopping Cart UI

**File**: `components-1-customer-web/app/parent-store/page.tsx`

**Time**: 1 hour

**Tasks**:
- [ ] Import cart store
- [ ] Wire "Add to Cart" buttons
  - Click → `store.addItem(product)`
  - Show toast: "Added to cart"
- [ ] Display cart count in header

**File**: `components-1-customer-web/app/parent-store/cart/page.tsx`

**Tasks**:
- [ ] Display cart items in table:
  - Product, Quantity, Price, Subtotal
  - Quantity +/- buttons
  - Remove button
- [ ] Display cart total and shipping estimate
- [ ] Show "Proceed to Checkout" button

### 3.3 Create Checkout API

**File**: `src/lib/stripe/checkout.ts` (new)

**Time**: 2 hours

**Tasks**:
- [ ] Create `createCheckoutSession(cart, email, redirectUrls)`
  - Initialize Stripe SDK: `new Stripe(STRIPE_SECRET_KEY, {...})`
  - Map cart items to Stripe line items
  - Create checkout session:
    ```js
    stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url,
      cancel_url,
      customer_email: email,
      metadata: { team_id, player_id, order_id }
    })
    ```
  - Return `{ sessionId, sessionUrl }`
- [ ] Create `verifyWebhookSignature(event, signature)`
  - Use `stripe.webhooks.constructEvent()`
  - Validate signature against `STRIPE_WEBHOOK_SECRET`

### 3.4 Create Checkout Route

**File**: `components-1-customer-web/app/api/checkout/route.ts` (new)

**Time**: 1.5 hours

**Tasks**:
- [ ] POST `/api/checkout`
  - Extract cart, email from request
  - Call `createCheckoutSession()`
  - Return `{ sessionId, redirectUrl }` or stripe session URL
- [ ] Frontend: Redirect to Stripe checkout on button click

### 3.5 Create Webhook Handler

**File**: `components-1-customer-web/app/api/webhooks/stripe/route.ts` (new)

**Time**: 2 hours

**Tasks**:
- [ ] POST `/api/webhooks/stripe`
  - Verify webhook signature
  - On `payment_intent.succeeded`:
    - Extract metadata (team_id, player_id, order_id)
    - Create parent_order in Appwrite
    - Set status to FULFILLMENT
    - Trigger print rendering job (BullMQ)
    - Send confirmation email
  - Return 200 status
- [ ] Test with Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  stripe trigger payment_intent.succeeded
  ```

### 3.6 Stripe Keys & Environment

**Time**: 30 minutes

**Tasks**:
- [ ] Add to `.env.local`:
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- [ ] Test stripe API calls

---

## 📸 Phase 4: Proof Review & Approval (Days 4-5)

**Goal**: Allow team members to review, approve, or request revisions on proofs.

### 4.1 Create Proof Review Component

**File**: `components-1-customer-web/components/ProofReviewCarousel.tsx` (new)

**Time**: 2 hours

**Tasks**:
- [ ] Build carousel showing proof videos side-by-side:
  - Before (original upload)
  - After (rendered with effects)
- [ ] Add controls:
  - Previous / Next buttons
  - Fullscreen toggle
  - Timeline scrubber
- [ ] Library: Use `embla-carousel-react` or custom HTML5 video

### 4.2 Add Approval/Rejection UI

**File**: `components-1-customer-web/app/team/orders/[orderId]/page.tsx` (update)

**Time**: 1.5 hours

**Tasks**:
- [ ] Add buttons below carousel:
  - "Approve" → Updates order status to `PROOF_APPROVED`
  - "Request Revision" → Updates status to `PROOF_REVISION_REQUESTED` + stores comment
- [ ] Add comment input field
- [ ] Wire to API endpoint: POST `/api/orders/[orderId]/approve`

### 4.3 Create Approval API

**File**: `components-1-customer-web/app/api/orders/[orderId]/approve/route.ts` (new)

**Time**: 1.5 hours

**Tasks**:
- [ ] POST `/api/orders/[orderId]/approve`
  - Validate user is team admin
  - Update order.status in Appwrite
  - Trigger final payment if approved
  - Trigger print rendering if all players approved
- [ ] POST `/api/orders/[orderId]/reject`
  - Update order.status
  - Store comment in order.proof_comments
  - Notify team + pipeline

---

## 🎬 Phase 5: Animations & Polish (Days 5-6)

**Goal**: Add visual polish with animations and loading states.

### 5.1 Landing Page GSAP Animations

**File**: `components-1-customer-web/app/page.tsx`

**Time**: 2 hours

**Tasks**:
- [ ] Import gsap and ScrollTrigger plugin
- [ ] Register plugin: `gsap.registerPlugin(ScrollTrigger)`
- [ ] Hero section: Fade-in-up on load (200ms stagger)
- [ ] Features: Stagger grid cards on scroll (200ms between each)
- [ ] How-it-works: Counter animation on scroll into view
- [ ] CTA section: Pulse animation when scrolled into viewport
- [ ] Test with npm run dev

### 5.2 Page Transitions

**File**: `src/components/PageTransition.tsx` (new)

**Time**: 1 hour

**Tasks**:
- [ ] Create wrapper component for fade-in effect on route change
- [ ] Use `usePathname()` to trigger animation on route change
- [ ] Wrap all pages with `<PageTransition>`

### 5.3 Loading Skeletons

**Files** (new):
- `src/components/SkeletonLoader.tsx`
- `src/components/OrderTableSkeleton.tsx`
- `src/components/ProductCardSkeleton.tsx`

**Time**: 1.5 hours

**Tasks**:
- [ ] Create reusable skeleton components
- [ ] Use in all data-fetching pages while `loading === true`
- [ ] Add pulse animation

### 5.4 Error Boundaries

**Files** (new):
- `src/components/ErrorBoundary.tsx`
- `src/app/error.tsx` (Next.js error boundary)

**Time**: 1 hour

**Tasks**:
- [ ] Wrap all pages with error boundary
- [ ] Display fallback UI on error
- [ ] Log errors to console/monitoring service

### 5.5 Toast Notifications

**File**: `src/components/Toast.tsx` (new)

**Time**: 1.5 hours

**Tasks**:
- [ ] Create toast component (success, error, info)
- [ ] Use context provider to show toasts
- [ ] Add to all success/error actions
  - "Added to cart"
  - "Order approved"
  - "Payment successful"
  - "Error: Please try again"

---

## 🧪 Phase 6: Testing & Quality (Day 6)

**Goal**: Achieve >80% code coverage and e2e test critical flows.

### 6.1 Unit Tests

**Target**: All lib/, hooks/, and utils/ files

**Time**: 2 hours

**Tasks**:
- [ ] Write tests for auth functions
- [ ] Write tests for cart store
- [ ] Write tests for API route handlers
- [ ] Run: `npm run test:web -- --coverage`
- [ ] Aim for >80% coverage

### 6.2 Integration Tests

**Target**: API + Appwrite + Stripe interactions

**Time**: 2 hours

**Tasks**:
- [ ] Test team login flow end-to-end
- [ ] Test parent entry + cart + checkout flow
- [ ] Mock Appwrite and Stripe responses
- [ ] Use `vitest` + `@testing-library/react`

### 6.3 E2E Tests (Playwright)

**Target**: User journeys

**Time**: 3 hours

**Tasks**:
- [ ] Install `@playwright/test`
- [ ] Test: Team login → Dashboard → View Orders → Approve Proof
- [ ] Test: Parent entry → Browse products → Checkout → Payment
- [ ] Run: `npx playwright test`

---

## 🚢 Phase 7: Deployment (Days 7+)

**Goal**: Deploy to production.

### 7.1 Environment & Secrets

**Time**: 1 hour

**Tasks**:
- [ ] Create `.env.production` with production Appwrite + Stripe keys
- [ ] Set up GitHub Secrets for CI/CD
- [ ] Configure environment variables in Vercel (if using)

### 7.2 Build & Test

**Time**: 1 hour

**Tasks**:
- [ ] `npm run build:web` — Production build
- [ ] `npm run test:web` — All tests pass
- [ ] Check build output size and bundle analysis

### 7.3 Deploy to Vercel

**Time**: 1 hour

**Tasks**:
- [ ] Connect GitHub repo to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy: `git push main`
- [ ] Verify: https://your-domain.vercel.app

### 7.4 VPS Deployment (Self-Hosted)

**Time**: 2 hours

**Tasks**:
- [ ] Build Docker image or prepare server
- [ ] Deploy to Hostinger VPS
- [ ] Set up HTTPS (Let's Encrypt)
- [ ] Configure PM2 for process management
- [ ] Set up CI/CD pipeline (GitHub Actions)

---

## 📊 Dependency Tree

| Phase | Dependencies | Duration |
|-------|--------------|----------|
| 1 | Appwrite setup | 2 days |
| 2 | Phase 1 complete | 1.5 days |
| 3 | Phase 1 complete, Stripe account | 1.5 days |
| 4 | Phase 1, 2, 3 complete | 1 day |
| 5 | All phases complete | 1.5 days |
| 6 | All phases complete | 1 day |
| 7 | All phases complete | 1 day |

**Total Estimated Time**: 9-10 days

---

## 🎯 Success Criteria

- [ ] Team members can log in and access dashboard
- [ ] Team members can view their orders and approve proofs
- [ ] Parents can enter team code, select player, and browse products
- [ ] Parents can add products to cart and checkout via Stripe
- [ ] Stripe webhook processes payments and triggers print rendering
- [ ] Landing page has smooth GSAP animations
- [ ] All critical flows have 80%+ test coverage
- [ ] Web app deployed to production
- [ ] Zero console errors in production
- [ ] Page load time < 2 seconds

---

## 📞 Resources

- **Architecture**: [COMPONENT_1_ARCHITECTURE.md](../COMPONENT_1_ARCHITECTURE.md)
- **Appwrite Setup**: [APPWRITE_SETUP_GUIDE.md](../APPWRITE_SETUP_GUIDE.md)
- **Conventions**: [CONVENTIONS.md](../CONVENTIONS.md)
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com
- **Stripe API**: https://stripe.com/docs/api
- **Appwrite Web SDK**: https://appwrite.io/docs/client/web

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev:all

# Run tests
npm run test:web

# Build for production
npm run build:web

# Deploy to Vercel
vercel deploy
```

---

**Next Action**: Begin Phase 1 with Appwrite collection setup.

