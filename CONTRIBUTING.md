# Contributing to Butwal Hacks

Welcome! Butwal Hacks is an open-source ORCID-style verification system and hackathon management platform for youth tech talent in Nepal.

## Quick Start

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** (not pnpm or yarn)
- **Git**

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks/my-app
npm install

# 2. Copy environment file and fill in your keys
cp .env.example .env.local
# Edit .env.local with your Auth0, Supabase, etc. credentials

# 3. Start dev server
npm run dev
# → http://localhost:3000
```

### Docker (Optional — Local Supabase + Redis)

If you don't want cloud accounts for Supabase and Redis during local development:

```bash
# From project root
docker compose up -d

# This starts:
# - Supabase Studio on http://localhost:54321
# - Redis on localhost:6379

# Then update your .env.local:
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<from docker logs>
# UPSTASH_REDIS_REST_URL=http://localhost:6379
```

> ⚠️ The Docker setup is for **local development only**. Production uses hosted Supabase and Upstash Redis.

## Architecture

```
butwalhacks.com          → Zone 1: Public Marketing (Homepage, Blog, Docs)
app.butwalhacks.com      → Zones 2–9: Dashboards, Profiles, APIs
```

| Zone | Routes | Purpose |
|------|--------|---------|
| 1 | `/`, `/blog`, `/docs`, `/about` | Public marketing site |
| 2 | `/login`, `/sign-up` | Authentication |
| 3 | `/p/[slug_id]`, `/verify/[markerId]` | Public ORCID-style profiles |
| 4 | `/dashboard/hacker/*` | Hacker dashboard |
| 5 | `/dashboard/organizer/*` | Organizer dashboard |
| 6 | `/dashboard/maintainer/*` | Maintainer dashboard |
| 7 | `/orgs/[slug]/*` | Organization management |
| 8 | `/portal/*` | Recruiter/Sponsor portal |
| 9 | `/api/*` | REST API endpoints |

**Key Files:**
- `src/proxy.ts` — Middleware for subdomain routing and RBAC
- `src/lib/auth0.ts` — Auth0 SDK v4 client
- `src/lib/auth0-management.ts` — Management API (identity linking)
- `src/utils/supabase.ts` — Supabase client (anon + service role)
- `src/lib/rate-limiter.ts` — Upstash Redis rate limiting
- `src/lib/i18n.ts` — English/Nepali translation system

## Pre-commit Hooks

The project uses a pre-commit hook that runs ESLint on staged `.ts` and `.tsx` files:

```bash
git config core.hooksPath .husky/
```

Run this once after cloning. The hook also runs a **secrets audit** to prevent accidental credential commits.

## Code Style

### TypeScript

- **Strict mode**. No `any` types unless absolutely necessary (add `// ponytail:` comment explaining why).
- Use **conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Default to **server components**. Add `"use client"` only when you need hooks, state, or browser APIs.

### UI / Design System

All UI must follow the Butwal Hacks design language:

| Element | Rules |
|---------|-------|
| **Colors** | Tailwind hex values: `bg-[#FE0000]`, `border-[#E5E5E5]`, `text-[#1F1F1F]` |
| **Surfaces** | Solid white (`#FFFFFF`) or light gray (`#F7F7F8`). No backdrop blur for decoration. |
| **Borders** | Crisp 1px (`#E5E5E5`). Cards and inputs use solid borders. |
| **Buttons** | Pill-shaped (`rounded-full`) for primary. Red background + glow for CTAs. |
| **Typography** | Primary: DM Sans / Inter. Secondary: JetBrains Mono (IDs, dates, code). |
| **Trust Markers** | Verified = `border-[#FE0000]` with red badge. Self-reported = standard border. |
| **Animations** | Smooth, subtle. Use `cubic-bezier(0.4, 0, 0.2, 1)` for transitions. |

❌ **Never use**: Standard Tailwind color classes (`bg-gray-800`, `text-red-500`), inline `style` attributes for colors, or backdrop blur on cards.

### RBAC

Three roles: `hacker`, `organizer`, `maintainer`. Use `requireRole()` in `proxy.ts` for route protection. Never bypass RLS with `createServiceClient()` without authorization checks.

### Rate Limiting

Wrap mutation API routes with `withRateLimit()`:

```ts
import { withRateLimit } from "@/lib/rate-limiter";

export const POST = withRateLimit(handler);           // default: 5 req/60s
export const POST = withRateLimit(handler, "sensitive"); // 3 req/60s
```

## Verification

Always run these before submitting a PR:

```bash
cd my-app
npx tsc --noEmit       # TypeScript check
npm run lint            # ESLint (zero warnings)
npm test                # Vitest unit tests (800+ tests)
npm run build           # Full Next.js production build
```

All checks must pass. The pre-commit hook runs lint automatically.

## Project Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (main)/             # Public-facing routes
│   │   ├── api/                # API route handlers
│   │   ├── dashboard/          # Dashboard routes (hacker/organizer/maintainer)
│   │   └── portal/             # Recruiter/Sponsor portal
│   ├── components/             # React components
│   │   ├── home/               # Homepage section components
│   │   ├── hacker-id/          # Profile and certificate components
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── recruiters/         # Recruiter portal components
│   │   └── ui/                 # Shared UI primitives
│   ├── lib/                    # Business logic, actions, utilities
│   │   ├── actions/            # Server actions (Supabase queries)
│   │   ├── ai/                 # Groq AI integrations
│   │   └── pdf/                # Certificate PDF generation
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Supabase clients, helpers
├── supabase/
│   └── migrations/             # Database migrations
└── scripts/                    # Utility scripts
```

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add bento grid to homepage
fix: auth0 callback loop on logout
docs: update environment setup guide
chore: upgrade next.js to 16.2
refactor: extract rate limiter into lib/
```

## Reporting Issues

- Use [GitHub Issues](https://github.com/Prarambha369/Butwal-Hacks/issues) for bug reports and feature requests.
- Include reproduction steps, expected behavior, and actual behavior.
- For security vulnerabilities, email security@butwalhacks.com instead of opening a public issue.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
