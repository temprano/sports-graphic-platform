# Component 1: Customer Web App Architecture

> Sports Graphics Platform — Next.js + Stripe + Appwrite
> 
> Designed for: Team admins, team members, and parents (no code duplication)

---

## 🎯 Design Principles

1. **Single Entry Point for Parent Access**: Team code gates the parent store
2. **Role-Based Access**: Team members ≠ Parents (different views/permissions)
3. **No Code Proliferation**: One team code, multiple access paths
4. **Strict Separation**: Parents can browse/order but never manage team data
5. **Appwrite Collections**: Leverage row-level security (RLS) for access control

---

## 📐 App Structure

```
components-1-customer-web/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout (nav, auth context)
│   ├── page.tsx                  # Landing page (animations)
│   ├── (auth)/
│   │   ├── layout.tsx            # Auth layout (no nav)
│   │   ├── team-login/
│   │   │   └── page.tsx          # Team login form (team code + password)
│   │   └── parent-entry/
│   │       └── page.tsx          # Parent store entry (team code + select player)
│   │
│   ├── (team)/
│   │   ├── layout.tsx            # Team layout (nav + sidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Team overview (all orders, quick stats)
│   │   ├── orders/
│   │   │   ├── page.tsx          # Orders list
│   │   │   └── [orderId]/
│   │   │       └── page.tsx      # Order detail + proof review
│   │   ├── team-settings/
│   │   │   └── page.tsx          # Team branding, player roster
│   │   └── store/
│   │       └── page.tsx          # Internal team store (future)
│   │
│   └── (parent-store)/
│       ├── layout.tsx            # Parent store layout (minimal nav)
│       ├── page.tsx              # Parent store catalog
│       ├── cart/
│       │   └── page.tsx          # Shopping cart
│       ├── checkout/
│       │   └── page.tsx          # Stripe checkout
│       └── order-confirm/
│           └── page.tsx          # Order confirmation
│
├── components/
│   ├── landing/
│   │   ├── Hero.tsx              # Hero with scroll animations
│   │   ├── Features.tsx          # Feature sections (GSAP animations)
│   │   ├── Testimonials.tsx      # Team testimonials
│   │   └── CTA.tsx               # Call-to-action sections
│   │
│   ├── nav/
│   │   ├── MainNav.tsx           # Top navbar (responsive)
│   │   ├── TeamNav.tsx           # Team area sidebar nav
│   │   └── AuthChip.tsx          # User info + logout
│   │
│   ├── auth/
│   │   ├── TeamLoginForm.tsx     # Team authentication
│   │   └── ParentEntryForm.tsx   # Team code + player picker
│   │
│   ├── team/
│   │   ├── OrderCard.tsx         # Order display component
│   │   ├── OrderList.tsx         # Orders grid/table
│   │   ├── ProofReviewPanel.tsx  # Proof carousel + approval UI
│   │   ├── RosterTable.tsx       # Player roster management
│   │   └── TeamStats.tsx         # Quick stats dashboard
│   │
│   ├── store/
│   │   ├── ProductCard.tsx       # Product display (poster/banner)
│   │   ├── ProductGrid.tsx       # Product gallery
│   │   ├── Cart.tsx              # Cart sidebar/page
│   │   ├── CartItem.tsx          # Individual cart item
│   │   └── StripeCheckout.tsx    # Stripe integration
│   │
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
│
├── lib/
│   ├── auth/
│   │   ├── team-auth.ts          # Team login logic
│   │   └── parent-auth.ts        # Parent session (team code + player)
│   │
│   ├── appwrite/
│   │   ├── client.ts             # Appwrite client instance
│   │   ├── auth.ts               # Authentication methods
│   │   ├── teams.ts              # Team queries
│   │   ├── orders.ts             # Order queries
│   │   ├── players.ts            # Player queries
│   │   └── parent-orders.ts      # Parent store orders
│   │
│   ├── stripe/
│   │   ├── client.ts             # Stripe client setup
│   │   ├── checkout.ts           # Checkout session creation
│   │   └── webhooks.ts           # Webhook handlers
│   │
│   ├── animations/
│   │   ├── gsap-config.ts        # GSAP defaults + presets
│   │   ├── scroll-triggers.ts    # Scroll animation helpers
│   │   └── page-transitions.ts   # Page fade/slide effects
│   │
│   └── constants/
│       ├── routes.ts             # Route paths
│       └── config.ts             # API endpoints, feature flags
│
├── hooks/
│   ├── useAuth.ts                # Current user context
│   ├── useTeamAuth.ts            # Team authentication state
│   ├── useParentSession.ts       # Parent store session (team + player)
│   ├── useOrders.ts              # Orders fetching + caching
│   ├── useCart.ts                # Shopping cart state
│   └── useStripe.ts              # Stripe integration
│
├── context/
│   ├── AuthContext.tsx           # Global auth state
│   ├── CartContext.tsx           # Shopping cart state
│   └── ToastContext.tsx          # Toast notifications
│
├── styles/
│   ├── globals.css               # Tailwind + custom properties
│   ├── animations.css            # GSAP animation keyframes
│   └── brand.css                 # Team branding overrides
│
├── public/
│   ├── images/
│   ├── fonts/
│   └── videos/                   # Landing page demo videos
│
├── .env.example                  # Environment template
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔐 Access Control Model

### Authentication Flows

```
┌─────────────────────────────────────────────────────────────┐
│                    LANDING PAGE (/)                         │
│              Animations + CTA buttons                       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌──────────┐          ┌──────────────┐
   │  TEAM    │          │   PARENTS    │
   │  LOGIN   │          │  (ORDER      │
   │          │          │   POSTERS)   │
   └────┬─────┘          └──────┬───────┘
        │ Team code             │ Team code
        │ + password            │ + select player
        │                       │
        ▼                       ▼
   ┌──────────────┐      ┌──────────────┐
   │ TEAM AREA    │      │ PARENT STORE │
   │ - Dashboard  │      │ - Catalog    │
   │ - Orders     │      │ - Cart       │
   │ - Settings   │      │ - Checkout   │
   │ - Proofs     │      │              │
   └──────────────┘      └──────────────┘
```

### Access Layers

**Team Members:**
- Can view team dashboard, all orders, proofs
- Can approve/reject proofs
- Can manage team settings (players, branding)
- **Cannot**: Access parent store, create orders
- **Session**: User ID + Team ID in JWT

**Parents:**
- Can access parent store (team code + player selection)
- Can browse posters/banners for their player
- Can add to cart and checkout
- **Cannot**: View team area, manage team data, see other players
- **Session**: Team ID + Player ID (stateless or short-lived token)

---

## 📊 Data Models & Appwrite Collections

### `teams` Collection
```typescript
interface Team {
  id: string;
  name: string;
  code: string;                    // Unique, 6-8 chars (team access)
  password_hash: string;           // Team login auth
  logo_url: string;                // Team logo
  primary_color: string;           // Hex: #RRGGBB
  secondary_color: string;
  brand_folder: string;            // Reference: "tech-dynamic" or "cinematic-dark"
  render_engine: "remotion" | "hyperframes";
  created_at: string;              // ISO datetime
  updated_at: string;
  owner_id: string;                // User ID of team admin
}

// Row-level security:
// - Read: user.team_id == team.id OR is_admin
// - Write: owner_id == user.id
```

### `players` Collection
```typescript
interface Player {
  id: string;
  team_id: string;
  name: string;
  position: string;                // "QB", "RB", etc.
  photo_url: string;               // Original photo
  photo_url_processed: string;     // After AI enhancement
  jersey_number: number;
  consent_log: {
    ai_motion_applied: boolean;
    ai_photo_enhanced: boolean;
    timestamp: string;
  };
  created_at: string;
}

// Row-level security:
// - Read: user.team_id == player.team_id OR parent accessing own child
// - Write: user.team_id == player.team_id AND is_team_admin
```

### `orders` Collection
```typescript
interface Order {
  id: string;
  team_id: string;
  created_by: string;              // Team member who created
  status: "pending_payment" | "in_production" | "pending_proof" | "proof_approved" | "paid_in_full" | "fulfillment" | "delivered";
  deliverables: {
    player_id: string;
    format: "player-intro-full" | "player-intro-short" | "team-banner";
    video_url: string;
    proof_status: "pending_review" | "approved" | "revision_requested";
  }[];
  payment: {
    deposit_amount: number;
    balance_amount: number;
    deposit_paid: boolean;
    balance_paid: boolean;
    stripe_session_id: string;
  };
  created_at: string;
}

// Row-level security:
// - Read: user.team_id == order.team_id
// - Write: user.team_id == order.team_id AND is_team_admin
```

### `parent_orders` Collection (New)
```typescript
interface ParentOrder {
  id: string;
  team_id: string;
  player_id: string;
  parent_email: string;            // For contact
  items: {
    format: "poster-16x20" | "banner-2x6" | "card-4x6";
    quantity: number;
    price: number;                 // Dynamically calculated
  }[];
  status: "cart" | "pending_payment" | "fulfillment" | "delivered";
  payment: {
    subtotal: number;
    shipping: number;
    total: number;
    stripe_session_id: string;
  };
  shipping_address: {
    name: string;
    address1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  created_at: string;
}

// Row-level security:
// - Read: user.team_id == parent_order.team_id (team staff)
//         OR parent via team_code + player_id session
// - Write: Only via parent store checkout flow
```

---

## 🔄 Session/Auth Strategy

### Team Members (JWT + Session)
```typescript
// POST /api/auth/team-login
{
  "team_code": "ABC123",
  "password": "team_password"
}

// Response: JWT with claims
{
  "sub": "user-id",
  "team_id": "team-123",
  "team_code": "ABC123",
  "role": "member" | "admin",
  "exp": <60 days>
}

// Stored in: httpOnly cookie (secure)
// Used by: Team area (/teams/*)
```

### Parents (Session Token + Player Context)
```typescript
// Step 1: Parent enters team code on /parent-entry
// Step 2: System verifies team code + returns player list
{
  "team_code": "ABC123"
}

// Response: List of players in that team
[
  { "id": "player-1", "name": "Jordan Smith", "number": 42 },
  { "id": "player-2", "name": "Marcus Johnson", "number": 23 }
]

// Step 3: Parent selects their child
// Generates temporary session token (24 hours)
{
  "team_id": "team-123",
  "player_id": "player-1",
  "exp": <24 hours>
}

// Stored in: sessionStorage (or short-lived cookie)
// Used by: Parent store (/parent-store/*)
// API calls: Middleware injects team_id + player_id into all requests
```

### Middleware Protection

```typescript
// lib/middleware.ts

// Team area: Require valid JWT with team_id
export function requireTeamAuth(req) {
  const token = req.cookies.get('team_token');
  if (!token || !verifyJWT(token)) {
    return redirect('/auth/team-login');
  }
  return token;
}

// Parent store: Require team_id + player_id in session
export function requireParentSession(req) {
  const session = req.headers.get('x-parent-session');
  if (!session) {
    return redirect('/parent-entry');
  }
  return session;
}
```

---

## 🎨 Landing Page (/)

### Sections
1. **Hero** (Scroll animation reveal)
   - Video background or animated gradient
   - Main CTA: "Get Started"
   - Subtext: "Professional sports graphics for your team"

2. **Features** (Staggered entrance)
   - Video compositions (player intros, team banners)
   - Print products (posters, banners)
   - Fast turnaround, custom branding

3. **Testimonials** (Carousel, fade transition)
   - Team feedback, ROI stories

4. **Pricing** (Sticky scroll)
   - Deposit structure visualization
   - Format options

5. **CTA Section** (Bottom)
   - "Start for Your Team" button → `/auth/team-login`
   - "Order for Your Player" button → `/parent-entry`

### Tech
- **GSAP** for scroll triggers + stagger animations
- **Tailwind** for responsive layout
- **Next.js Image** for optimized media

---

## 📱 Team Area (/teams/*)

### Dashboard (/teams/dashboard)
- **Overview stats**: Total orders, pending approvals, revenue
- **Recent orders** card grid (clickable)
- **Quick actions**: "New order", "View proofs"

### Orders (/teams/orders)
- **Table/Grid** of all team orders
- **Filters**: Status, date range, player
- **Inline actions**: View detail, download proofs, approve

### Order Detail (/teams/orders/[orderId])
- **Order info**: Players, formats, status timeline
- **Proofs carousel**: Side-by-side comparison
- **Approve/Reject buttons** with revision reason input
- **Payment info**: Deposit status, balance due

### Team Settings (/teams/team-settings)
- **Branding**: Logo, colors, brand folder selector
- **Players roster**: Add/edit/remove players
- **Team info**: Name, code (display-only), update contact

---

## 🛍️ Parent Store (/parent-store/*)

### Entry (/parent-entry)
- **Form**: Team code input + "Next"
- **Player picker**: Show all players, let parent select
- **Session**: Set team_id + player_id in session storage

### Catalog (/parent-store)
- **Grid**: Show available products for selected player
- **Product cards**: Format, dimensions, price, "Add to Cart"
- **Filters**: Format type, price range (future)

### Cart (/parent-store/cart)
- **Sidebar or page**: Itemized cart
- **Quantity + remove** for each item
- **Subtotal + shipping** calculation
- **Checkout button**

### Checkout (/parent-store/checkout)
- **Shipping address form**
- **Stripe payment form** (deposit only? or full amount?)
- **Order confirmation** post-purchase

---

## 💳 Payment Flows

### Team Orders (Deposit + Balance)
1. Team creates order → Deposit invoice ($200-500)
2. Team pays deposit via Stripe → Status: IN_PRODUCTION
3. Proofs generated → Review phase
4. Team approves → Invoice for balance
5. Team pays balance → PAID_IN_FULL → Fulfillment

### Parent Store Orders (Single Payment)
1. Parent adds items to cart
2. Parent checks out → Shipping address + payment
3. Parent pays full amount via Stripe
4. Order → Fulfillment → Shipped

---

## 🔗 Integration Points with Existing Backend

```
┌──────────────────────────┐
│   Customer Web App       │
│    (Component 1)         │
└───────────┬──────────────┘
            │ API calls
            ▼
┌──────────────────────────┐
│   Appwrite Database      │
│  (Collections + Auth)    │
│                          │
│  - Teams                 │
│  - Players               │
│  - Orders                │
│  - Parent Orders         │
└───────────┬──────────────┘
            │
            ├─ Orders state machine triggers ──────┐
            │                                      │
            ▼                                      ▼
┌──────────────────────────┐        ┌──────────────────────────┐
│   BullMQ Job Queue       │        │   Stripe Webhooks        │
│   (render-video.js)      │        │   (Payment events)       │
│   (render-print.js)      │        └──────────────────────────┘
└──────────────────────────┘
```

---

## ✅ Implementation Checklist (MVP)

### Phase 1: Auth + Landing
- [ ] Landing page with GSAP animations
- [ ] Team login form + Appwrite auth
- [ ] Parent store entry (team code + player picker)
- [ ] Session management (JWT for team, stateless for parent)

### Phase 2: Team Dashboard
- [ ] Team dashboard overview
- [ ] Orders list view
- [ ] Proof review carousel + approval buttons
- [ ] Team settings (branding, roster)

### Phase 3: Parent Store
- [ ] Product catalog for selected player
- [ ] Shopping cart (localStorage or context)
- [ ] Stripe checkout integration
- [ ] Order confirmation email

### Phase 4: Polish + Deployment
- [ ] Error handling + edge cases
- [ ] Loading states + optimistic updates
- [ ] Responsive design testing
- [ ] Deployment to Vercel / custom VPS

---

## 🛡️ Security Considerations

1. **Never expose team code** in URLs or error messages
2. **Parent session expires** in 24 hours (must re-enter team code)
3. **Row-level security** in Appwrite prevents cross-team data access
4. **Stripe webhooks** verify payment legitimacy before updating status
5. **CSRF tokens** on all forms
6. **HTTPS only** for all auth pages
7. **Rate limiting** on login endpoints (brute force protection)

---

## 🚀 Tech Stack Summary

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) + React 18 |
| Styling | Tailwind CSS + GSAP animations |
| State | React Context + useReducer (or Zustand) |
| Database | Appwrite (collections + RLS) |
| Auth | JWT (team) + session token (parent) |
| Payments | Stripe (checkout + webhooks) |
| Photo Validation | Transformers.js v4 (browser-side ML) |
| Forms | React Hook Form + Zod validation |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel (frontend) + VPS (backend APIs) |

---

## 📝 Next Steps

1. **Scaffold Next.js project** with App Router
2. **Set up Appwrite collections** with RLS rules
3. **Build landing page** with GSAP scroll animations
4. **Implement team login** + session management
5. **Create team dashboard** components
6. **Integrate Stripe** for payment flows
7. **Build parent store** flow
8. **Deploy to staging** and test end-to-end

