# Next.js Web App Scaffold - Component 1

**Status**: ✅ Scaffolding Complete
**Date**: April 29, 2026
**Branch**: main

---

## 📁 What Was Created

### Project Structure

```
components-1-customer-web/
├── app/                          # Next.js App Router (all routes here)
│   ├── layout.tsx               # Root layout (nav, metadata)
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles + Tailwind
│   │
│   ├── auth/                     # Authentication flows (no nav)
│   │   ├── layout.tsx           # Auth page layout
│   │   ├── team-login/
│   │   │   └── page.tsx         # Team login form (code + password)
│   │   └── parent-entry/
│   │       └── page.tsx         # Parent entry (code → player picker)
│   │
│   ├── team/                     # Protected team routes
│   │   ├── layout.tsx           # Team layout (sidebar nav)
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Dashboard overview
│   │   ├── orders/
│   │   │   └── page.tsx         # Orders list/table
│   │   └── settings/
│   │       └── page.tsx         # Team branding & roster
│   │
│   └── parent-store/            # Protected parent routes
│       ├── layout.tsx           # Parent store layout
│       ├── page.tsx             # Product catalog
│       └── cart/
│           └── page.tsx         # Shopping cart
│
├── components/                   # Reusable React components (scaffold)
├── lib/                         # Utilities and helpers (scaffold)
├── hooks/                       # Custom React hooks (scaffold)
├── context/                     # React Context providers (scaffold)
├── public/                      # Static assets (scaffold)
│
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies & scripts
├── tsconfig.json               # TypeScript config with path aliases
├── tailwind.config.js          # Tailwind CSS configuration
├── next.config.js              # Next.js configuration
├── postcss.config.js           # PostCSS/Tailwind pipeline
└── README.md                    # Component documentation
```

### Root Configuration

**Updated `package.json`:**
- Added workspaces config (root + web app)
- New scripts: `dev:all`, `dev:web`, `dev:pipeline`, `build:web`
- Added `concurrently` for running both dev servers
- Maintains backward compatibility with pipeline scripts

---

## 🎯 Pages & Components Created

### Landing Page (`/`)
- ✅ Hero section with animations (placeholder)
- ✅ Features showcase (3-column grid)
- ✅ How-it-works section (numbered steps)
- ✅ Call-to-action section
- ✅ Footer
- ✅ Responsive dark theme

**Buttons:**
- "Get Started for Your Team" → `/auth/team-login`
- "Order Posters for Your Player" → `/parent-entry`

### Team Login (`/auth/team-login`)
- ✅ Form: team code + password
- ✅ Error handling placeholder
- ✅ Loading state
- ✅ Disabled states for empty fields

### Parent Entry (`/auth/parent-entry`)
- ✅ Step 1: Team code input
- ✅ Step 2: Player picker (fetches players from team code)
- ✅ Mock data for demo (3 players)
- ✅ Go back button to change team code

### Team Dashboard (`/team/dashboard`)
- ✅ Layout with sidebar navigation
- ✅ Stats cards (total orders, pending, revenue)
- ✅ Recent orders section placeholder
- ✅ Top navbar with logout button

### Orders List (`/team/orders`)
- ✅ Empty state placeholder
- ✅ Integrated with team layout

### Team Settings (`/team/settings`)
- ✅ Team name input
- ✅ Primary/secondary color pickers
- ✅ Save button placeholder
- ✅ Form structure ready for integration

### Parent Store (`/parent-store`)
- ✅ Product grid (3 products: poster, banner, card)
- ✅ Product cards with emoji placeholders
- ✅ Price display
- ✅ Add to cart button (placeholder)

### Shopping Cart (`/parent-store/cart`)
- ✅ Empty state
- ✅ Link back to store

---

## 🎨 Styling & Theme

### Tailwind CSS
- ✅ Dark theme (gray-900 bg, white text)
- ✅ Custom color system (brand primary/secondary/accent)
- ✅ Responsive breakpoints (sm, md, lg)
- ✅ Animation utilities (fade-in, slide-up, pulse)
- ✅ Component utilities (.btn, .btn-primary, .btn-ghost, etc.)

### Global Styles
- ✅ CSS custom properties for brand colors
- ✅ Smooth scrolling
- ✅ Typography hierarchy (.heading-1, .heading-2, .subheading)
- ✅ GSAP animation keyframes (placeholder for animations)

### Colors
- Primary: Blue-500 (default, customizable per team)
- Secondary: Purple-600 (default)
- Accent: Pink-500 (default)
- Neutral: Gray scale (900-50)

---

## ⚙️ Configuration Files

### TypeScript (`tsconfig.json`)
- ✅ Strict mode enabled
- ✅ Path aliases for clean imports
  - `@/*` → root directory
  - `@/app/*`, `@/components/*`, `@/lib/*`, etc.
- ✅ Next.js type support

### Next.js (`next.config.js`)
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- ✅ Image optimization with remotePatterns
- ✅ React strict mode
- ✅ SWC minification

### Tailwind (`tailwind.config.js`)
- ✅ Dark mode support
- ✅ Custom animations
- ✅ Extended theme with brand colors
- ✅ Content patterns for purging

---

## 📦 Dependencies

### Production Dependencies
- `next` 14.0+ — React framework
- `react`, `react-dom` 18.0+ — UI library
- `typescript` 5.0+ — Type safety
- `tailwindcss` 3.3+ — Styling
- `gsap` 3.12+ — Animations (prepared for phase 2)
- `stripe` — Payment processing (prepared)
- `appwrite` — Database & auth (prepared)
- `react-hook-form` — Form handling (prepared)
- `zod` — Schema validation (prepared)
- `zustand` — State management (prepared)

### Dev Dependencies
- `vitest`, `@testing-library/react` — Testing
- `eslint`, `autoprefixer` — Code quality
- `concurrently` — Run multiple npm scripts

---

## 🚀 Next Steps (Implementation Phase)

### Phase 1: Authentication
- [ ] Connect team login to Appwrite
  - Verify team code + password
  - Generate JWT token
  - Store in httpOnly cookie
- [ ] Implement parent entry flow
  - Validate team code
  - Fetch players from Appwrite
  - Create 24-hour session

### Phase 2: Team Dashboard
- [ ] Fetch real orders from Appwrite
- [ ] Display order status timeline
- [ ] Build proof review carousel
- [ ] Implement proof approval/rejection

### Phase 3: Parent Store
- [ ] Fetch products dynamically (from brand config)
- [ ] Build shopping cart (Zustand state)
- [ ] Implement Stripe checkout
- [ ] Order confirmation + email

### Phase 4: Animations & Polish
- [ ] Add GSAP scroll animations to landing page
- [ ] Page transitions + fade effects
- [ ] Loading skeletons
- [ ] Error boundary components
- [ ] Toast notifications

### Phase 5: Testing & Deployment
- [ ] Unit tests for auth flows
- [ ] Integration tests for checkout
- [ ] End-to-end tests (Playwright)
- [ ] Deploy to Vercel (web app)
- [ ] Deploy to VPS (if self-hosting)

---

## 🛠️ Development Workflow

### Install Dependencies

```bash
# From root directory
npm install

# This installs both root and web app dependencies via workspaces
```

### Start Development Servers

```bash
# Option 1: Run both web app + pipeline
npm run dev:all

# Option 2: Web app only
npm run dev:web

# Option 3: Pipeline only (from pipeline config)
npm run worker
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
# All tests
npm test

# Web app tests only
npm run test:web
```

---

## 🔌 API Integration Points (To Implement)

### Appwrite Collections to Connect
1. **Teams** — Team registration, code verification
2. **Players** — Player roster, photo storage
3. **Orders** — Order state, payment tracking
4. **ParentOrders** — Parent store orders

### Functions to Implement
1. **`lib/auth/team-auth.ts`** — Team login logic
2. **`lib/auth/parent-auth.ts`** — Parent session logic
3. **`lib/appwrite/teams.ts`** — Team queries
4. **`lib/appwrite/players.ts`** — Player queries
5. **`hooks/useAuth.ts`** — Auth context hook
6. **`hooks/useCart.ts`** — Cart state management

### API Routes to Create
- `POST /api/auth/team-login` — Team authentication
- `POST /api/auth/parent-entry` — Parent session creation
- `GET /api/teams/[teamId]/orders` — Fetch team orders
- `POST /api/stripe/checkout` — Create Stripe session
- `POST /api/webhooks/stripe` — Handle Stripe webhooks

---

## 📝 Environment Variables

Create `.env.local` from `.env.example`:

```env
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## ✅ Verification Checklist

- [x] App Router structure created
- [x] All route groups configured
- [x] Landing page built
- [x] Auth flows scaffolded (login + parent entry)
- [x] Team dashboard layout created
- [x] Parent store catalog created
- [x] Tailwind CSS configured
- [x] TypeScript paths configured
- [x] Environment example created
- [x] Workspaces configured in root package.json
- [x] README created
- [x] Committed to git
- [x] Pushed to GitHub

---

## 🎯 Current Component Status

| Component | Status | Focus |
|-----------|--------|-------|
| 1. Web App | 🟡 **Scaffolded** | Auth implementation |
| 2. Pipeline | ✅ **Complete** | Video + Print E2E validated |
| 3. Asset Gen | ✅ **Complete** | All templates ready |
| 4. Backend | ✅ **70% Complete** | Core logic done |

---

## 📞 Support

See [COMPONENT_1_ARCHITECTURE.md](../COMPONENT_1_ARCHITECTURE.md) for detailed system design.

See [components-1-customer-web/README.md](../components-1-customer-web/README.md) for component-specific docs.

