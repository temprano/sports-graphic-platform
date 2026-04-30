# Component 1: Customer Web App

Sports Graphics Platform — Customer-facing Next.js application for team registration, order management, and parent store.

## Phase 0: Photo Upload Implementation ✅

Complete multi-step order creation with ML-powered photo validation.

### What's Implemented

**Components:**
- `PhotoUploadFlow` — Main photo upload container with state management
- `PoseBox` — Individual pose upload with drag-drop, preview, validation status
- `PlayerCard` — Player grouping with header
- `PoseBoxRow` — Responsive grid layout (1-col mobile, 3-col desktop)
- `ProgressBar` — Visual progress indicator
- `ActionBar` — Back/Continue buttons with completion gating
- `OrderCreationForm` — 4-step order creation wizard (Brand → Players → Photos → Review)

**Utilities:**
- `transformers-client.ts` — Client-side ML pose validation using PoseNet
  - Automatic pose angle detection (front, left, right)
  - Confidence scoring (0-100%)
  - Graceful fallback if model unavailable

**Hooks:**
- `usePhotoUpload` — Photo upload state and validation management
- `useOrder` — Global order context access

**Context:**
- `OrderContext` — Global order state with localStorage persistence

**API:**
- `POST /api/orders/create` — Order creation endpoint (skeleton)

**Pages:**
- `/team/orders/new` — Multi-step order creation page

**Types:**
- `Pose`, `Player`, `PhotoUpload`, `PhotoUploadState`, `OrderData`

### Features

✅ Photo upload with drag-drop
✅ ML-powered pose validation
✅ Multi-step form workflow
✅ localStorage persistence and recovery
✅ Responsive design (mobile/desktop)
✅ Dark theme with Tailwind CSS
✅ Type-safe React/TypeScript (strict mode)
✅ Graceful error handling
✅ Visual status indicators
✅ Photo preview with hover actions
✅ File size validation (10MB max)
✅ User override option for invalid poses

### Directory Structure

```
components-1-customer-web/
├── app/
│   ├── api/orders/create/route.ts
│   └── team/orders/new/page.tsx
├── components/team/
│   ├── order-creation/
│   │   ├── OrderCreationForm.tsx
│   │   └── index.ts
│   └── photo-upload/
│       ├── PhotoUploadFlow.tsx
│       ├── PoseBox.tsx
│       ├── PlayerCard.tsx
│       ├── PoseBoxRow.tsx
│       ├── ProgressBar.tsx
│       ├── ActionBar.tsx
│       └── index.ts
├── lib/
│   ├── types/order.ts
│   ├── context/OrderContext.tsx
│   ├── hooks/
│   │   ├── usePhotoUpload.ts
│   │   └── index.ts
│   └── pose-validation/transformers-client.ts
└── package.json (added @xenova/transformers)
```

### Getting Started

```bash
cd components-1-customer-web

# Check npm install status
npm list @xenova/transformers

# If not installed yet:
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000/team/orders/new` to see the multi-step form.

### Next Steps

1. **Appwrite Integration** — Connect database, storage, authentication
2. **Stripe Integration** — Two-stage payment (deposit + balance)
3. **Order Management** — Detail page, tracking, proof review
4. **Testing** — Unit tests, E2E tests, sample images
5. **Team Management** — Team creation, player roster, brand selection

---

## Original Features

## Features

- **Landing Page** with GSAP scroll animations
- **Team Login** — Secure access to team dashboard
- **Team Dashboard** — Orders, proofs, team settings
- **Parent Store** — Browse and purchase posters for specific players
- **Responsive Design** — Works on desktop, tablet, mobile
- **Dark Theme** — Professional sports aesthetic

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: GSAP (phase 2)
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand
- **Database**: Appwrite
- **Payments**: Stripe
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Install dependencies (from workspace root)
npm install

# Or from web app directory
cd components-1-customer-web
npm install
```

### Development

```bash
# From workspace root
npm run dev:web

# Or from web app directory
npm run dev
```

The app will start on `http://localhost:3000`

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Appwrite and Stripe credentials
3. Restart dev server

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (no nav)
│   │   ├── team-login/
│   │   └── parent-entry/
│   ├── (team)/              # Team area routes (protected)
│   │   ├── dashboard/
│   │   ├── orders/
│   │   └── settings/
│   └── (parent-store)/      # Parent store routes
│       ├── page.tsx
│       └── cart/
│
├── components/              # Reusable React components
├── lib/                    # Utilities and helpers
├── hooks/                  # Custom React hooks
├── context/                # React Context providers
└── styles/                 # Global styles
```

## API Integration

The web app integrates with:

1. **Appwrite** — User auth, data persistence
2. **BullMQ Queue** — Order pipeline trigger
3. **Stripe** — Payment processing
4. **Remotion/Hyperframes** — Video rendering status

## Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

```bash
# Deploy directly from GitHub
# Connect this repo to Vercel dashboard
# Set environment variables
# Deploy
```

### Self-hosted

```bash
# Build
npm run build

# Run
npm start
```

## Security Considerations

- ✅ HTTPS-only in production
- ✅ JWT tokens in httpOnly cookies
- ✅ CSRF protection on all forms
- ✅ Row-level security in Appwrite
- ✅ Stripe webhook verification
- ✅ Rate limiting on auth endpoints (future)

## Next Steps

- [ ] Implement team login with Appwrite
- [ ] Build order creation flow
- [ ] Integrate Stripe checkout
- [ ] Add GSAP animations to landing page
- [ ] Proof review UI (carousel + approval buttons)
- [ ] Parent session management
- [ ] Shopping cart state management
- [ ] Email notifications

## Contributing

See [CONVENTIONS.md](../../CONVENTIONS.md) for code style and standards.

## License

Proprietary — Sports Graphics Platform
