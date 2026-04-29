# Component 1: Customer Web App

Sports Graphics Platform — Customer-facing Next.js application for team registration, order management, and parent store.

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
