# Butwal Hacks — Architecture & Engineering Reference

> **Consolidated document.** This single file merges the former `docs/*` wiki
> (architecture, ADRs, codebase overview, API reference, authentication, security,
> threat model, platform constraints, deployment, coding standards, testing,
> error handling, performance budget, Cloudinary metadata, design system, and
> user stories). Root-level `README.md` is the entry point; `DESIGN.md` and
> `PRODUCT.md` cover visual design and product direction separately.

## Table of Contents

- [Architecture](#architecture)
- [Architectural Decisions — Butwal Hacks](#architectural-decisions-butwal-hacks)
- [Butwal Hacks — Codebase Overview](#butwal-hacks-codebase-overview)
- [API Reference](#api-reference)
- [Authentication — Butwal Hacks](#authentication-butwal-hacks)
- [Security Architecture — Butwal Hacks](#security-architecture-butwal-hacks)
- [Threat Model - Butwal Hacks](#threat-model-butwal-hacks)
- [Platform Constraint Checklist - Butwal Hacks](#platform-constraint-checklist-butwal-hacks)
- [Deployment — Butwal Hacks](#deployment-butwal-hacks)
- [Coding Standards — Butwal Hacks](#coding-standards-butwal-hacks)
- [Testing Strategy — Butwal Hacks](#testing-strategy-butwal-hacks)
- [Error Handling Strategy — Butwal Hacks](#error-handling-strategy-butwal-hacks)
- [Performance Budget — Butwal Hacks](#performance-budget-butwal-hacks)
- [Cloudinary Structured Metadata Configuration](#cloudinary-structured-metadata-configuration)
- [Design System](#design-system)
- [User Stories — Butwal Hacks](#user-stories-butwal-hacks)

---

## Architecture

### Overview

Butwal Hacks is a Next.js 16 App Router application deployed on Vercel. It combines an ORCID-style credential verification system with a Devpost/MLH-style hackathon management platform.

```
Browser ──► Vercel (Next.js 16) ──┬── Auth0 (Authentication)
                                   ├── Supabase (PostgreSQL Database)
                                   ├── Cloudinary (Image CDN)
                                   ├── Upstash Redis (Rate Limiting)
                                   ├── Resend (Transactional Email)
                                   └── Open Collective (Payments)
```

---

### 9-Zone Route Architecture

The application uses subdomain routing: `butwalhacks.com` serves public marketing content, while `app.butwalhacks.com` serves authenticated dashboards and API routes.

| Zone | Routes | Subdomain | Auth Required |
|------|--------|-----------|---------------|
| 1. Public Marketing | `/`, `/about`, `/blog`, `/chapters`, `/community` | `butwalhacks.com` | No |
| 2. Auth | `/sign-in`, `/sign-up`, `/auth/*` | `butwalhacks.com` | No |
| 3. Public Profiles | `/p/[slug_id]`, `/verify/[markerId]` | `butwalhacks.com` | No |
| 4. Hacker Dashboard | `/dashboard/hacker/*` | `app.butwalhacks.com` | Yes |
| 5. Organizer Dashboard | `/dashboard/organizer/*` | `app.butwalhacks.com` | Yes (Organizer) |
| 6. Maintainer Dashboard | `/dashboard/maintainer/*` | `app.butwalhacks.com` | Yes (Maintainer) |
| 7. Organizations | `/orgs/[slug]/*` | `app.butwalhacks.com` | Yes |
| 8. Sponsor Portal | `/portal/sponsors/*`, `/portal/bounties/*` | `app.butwalhacks.com` | Yes (Sponsor) |
| 9. API | `/api/*` | `app.butwalhacks.com` | Varies |

---

### Data Flow

#### Authentication Flow (Auth0)

```
User → Auth0 Login → Auth0 Callback → proxy.ts Middleware
                                           │
                                    Auth0 Post-Login Action
                                           │
                                    Webhook → /api/webhooks/auth0
                                           │
                                    Supabase: Upsert Profile
                                           │
                                    User redirected to Dashboard
```

#### API Request Flow

```
Browser → proxy.ts (Auth0 Session Middleware)
              │
              ↓
        Next.js API Route
              │
          ├── withRateLimit()  (Upstash Redis)
          ├── getSession()     (Auth0 cookie)
          ├── Zod Validation   (Input sanitization)
          └── Supabase         (Service Role Key, bypasses RLS)
```

#### ORCID Engine

```
Organizer issues marker ──► /api/v1/issue-marker
                                │
                            Ghost Profile (unclaimed)
                                │
                            Email sent via Resend
                                │
                            Recipient claims via Auth0 login
                                │
                            Profile claimed → Trust Marker active
                                │
                            Cryptographically signed (Ed25519)
                                │
                            Verifiable at /verify/[marker_id]
```

---

### Key Design Decisions

#### Why Auth0 (not Supabase Auth)?
- Auth0 provides enterprise-grade SSO, MFA, and social login
- Auth0 Organizations power multi-chapter support
- Auth0 Post-Login Actions sync user data to Supabase via webhook
- Supabase Auth is disabled; only the database layer is used

#### Why Service Role Key (not RLS)?
- RLS is disabled for simplicity at MVP stage
- All mutations are gated by Auth0 session validation in the API route
- The service role key is never exposed to the browser

#### Design Philosophy
The interface blends solid, grounded surfaces with selective depth effects. Cards and panels use solid backgrounds and crisp 1px borders — they feel like paper. Blur and shadow are reserved for moments that need visual separation: modal overlays, floating toasts, image captions. Butwal Red (`#FE0000`) is used sparingly for CTAs and verified trust markers — when you see red, it means something.

---

### Directory Structure

```
Butwal-Hacks/
├── my-app/                     # Next.js application
│   ├── src/
│   │   ├── app/                # App Router (pages + API routes)
│   │   │   ├── (main)/         # Public pages (home, about, blog, events...)
│   │   │   ├── (auth)/         # Auth pages (sign-in, sign-up)
│   │   │   ├── dashboard/      # Hacker/Organizer/Maintainer dashboards
│   │   │   ├── p/              # Public BH-ID profiles
│   │   │   ├── verify/         # Trust marker verification
│   │   │   ├── widget/         # Embeddable verification widget
│   │   │   ├── api/            # 51 route handlers
│   │   │   ├── layout.tsx      # Root layout with metadata
│   │   │   ├── globals.css     # Design tokens & utilities
│   │   │   ├── sitemap.ts      # Dynamic sitemap
│   │   │   ├── robots.ts       # robots.txt config
│   │   │   └── manifest.ts     # PWA manifest
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Business logic, i18n, content
│   │   └── utils/              # Supabase client factories
│   └── public/                 # Static assets
├── supabase/migrations/        # 66 database migrations
├── docs/                       # Consolidated architecture reference (ARCHITECTURE.md)
└── .github/                    # CI workflows, issue templates
```

---

## Architectural Decisions — Butwal Hacks

Every significant technical choice, recorded with context, rationale, and consequences.

---

### ADR-001: Auth0 over Supabase Auth

**Date:** 2024 (project inception)
**Status:** Accepted

#### Context
Supabase ships its own Auth module (GoTrue). Using it would mean one fewer service to manage. However, Butwal Hacks needs multi-provider OAuth (Google, GitHub, email/password), webhook-synced profiles, and ghost profile flows.

#### Decision
Use Auth0 for all authentication. Supabase is used for the database only, accessed via the Service Role Key.

#### Rationale
- Auth0's Post-Login Actions allow real-time profile sync to Supabase on every login
- Ghost profile flow (issue marker to email -> create unclaimed profile -> claim via Auth0 login) maps directly to Auth0's invitation flow
- Auth0's Organizations feature (planned for Phase 2 multi-chapter support) integrates cleanly
- Supabase Auth's webhook support was immature at the time of decision

#### Consequences
- One additional service to manage
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the client (server-only)
- All backend queries use the service role, bypassing Supabase RLS entirely
- Auth routes mount at `/auth/*` via `proxy.ts`, NOT `/api/auth/*`

#### Related
- `#authentication-butwal-hacks` (this document) — full auth flow documentation
- `src/proxy.ts` — Auth0 middleware configuration
- `src/app/api/webhooks/auth0/route.ts` — Auth0 user sync webhook

---

### ADR-002: Service Role Key Architecture (Bypass RLS)

**Date:** 2024 (project inception)
**Status:** Accepted

#### Context
Supabase offers Row-Level Security (RLS) as its primary authorization mechanism. Typical Supabase projects use the anon key with RLS policies for public access, and the service role key for admin operations.

#### Decision
Use the Supabase Service Role Key for ALL backend database operations (API routes, Server Actions, webhooks). Do NOT use RLS.

#### Rationale
- Simplified permission model: backend code handles authorization via Auth0 session checks, not database-level policies
- RLS policies are harder to review and test than application-level authorization
- Service role bypasses RLS entirely, giving direct table access
- Public data access uses the anon key client (via `@/utils/supabase` server client) but with explicitly scoped queries

#### Consequences
- `SUPABASE_SERVICE_ROLE_KEY` is the single most sensitive credential — must only appear in `process.env`, never in client code
- Two Supabase client factories: `createClient()` (anon key, RLS enforced) and `createServiceClient()` (service role, RLS bypassed)
- Authorization logic lives in application code, not in SQL policies
- No risk of RLS policy misconfiguration causing data leaks

#### Related
- `src/utils/supabase.ts` — all three clients in one file: `createClient()` (browser), `createServerClient()` (anon), `createServiceClient()` (service role)
- `SECURITY.md` — vulnerability reporting

---

### ADR-003: Cloudinary for Media CDN

**Date:** 2024 (project inception)
**Status:** Accepted

#### Context
The platform needs image upload, transformation, and CDN delivery. Requirements: free tier, signed uploads, automatic optimization, metadata tagging, and gallery support.

#### Decision
Use Cloudinary as the sole media CDN for all images (profile avatars, event banners, project covers, photo galleries).

#### Rationale
- Generous free tier (25GB storage, 25GB bandwidth/month for a non-profit)
- Signed uploads via server-generated signatures prevent unauthorized uploads
- Automatic optimization (`q_auto,f_auto,w_{width}`) reduces bundle size without manual intervention
- Metadata tagging (event ID, uploader ID) enables filtering and gallery queries
- Image cropping and transformation APIs support the crop dialog component
- DiceBear used as fallback for avatars (avataaars style, deterministic by seed)

#### Consequences
- Upload flow: client requests signature from `/api/cloudinary-signature`, then uploads directly to Cloudinary
- All image URLs include optimization parameters via `cloudinaryUrl()` utility
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is public (safe in client)
- `CLOUDINARY_API_SECRET` is server-only

#### Related
- `src/components/cloudinary-upload.tsx` — upload component
- `src/lib/utils.ts` — `cloudinaryUrl()` utility
- `src/app/api/cloudinary-signature/route.ts` — signature endpoint
- [Cloudinary Structured Metadata](#cloudinary-structured-metadata-configuration) (this document) — metadata schema

---

### ADR-004: Ed25519 Trust Marker Signing

**Date:** 2025 (Phase 1)
**Status:** Accepted

#### Context
Trust markers (verified credentials) need cryptographic signing so third parties can verify them independently. The signing must be public-key based, cheap to generate/verify, and the key material must be easy to rotate.

#### Decision
Sign trust markers with Ed25519 key pairs using Node.js `crypto` module.

#### Rationale
- Ed25519 signatures are small (64 bytes) and fast to verify
- Node.js `crypto` module provides native Ed25519 support (no additional dependencies)
- PEM-encoded keys are easy to store as environment variables
- Public key can be embedded in verification pages without exposing the private key
- Meets Open Badges 3.0 compatibility requirements (planned for Phase 3)

#### Consequences
- `TRUST_MARKER_PRIVATE_KEY` and `TRUST_MARKER_PUBLIC_KEY` must be in environment variables
- Private key must be PEM-encoded as a single line (newlines escaped as `\n`)
- `/verify/[markerId]` page displays signature verification status
- Revocation marks the marker as revoked in the database (signature remains valid but marker status overrides)
- Key rotation requires re-signing all active markers

#### Related
- `src/lib/crypto/sign.ts` — signing implementation
- `src/app/verify/[markerId]/page.tsx` — verification page
- `src/app/api/v1/issue-marker/route.ts` — marker issuance
- `.env.example` — key generation instructions

---

### ADR-005: No Turbopack

**Date:** 2025 (project migration to Next.js 16)
**Status:** Accepted

#### Context
Next.js 16 ships Turbopack as the default bundler for development. It offers faster hot module replacement and faster initial compilation.

#### Decision
Do NOT use Turbopack. Use the standard Next.js webpack-based build.

#### Rationale
- Compatibility issues with `proxy.ts` (Auth0 middleware) when using Turbopack
- Some dependencies (notably `@sentry/nextjs`) have better webpack integration
- Production builds always use webpack regardless of Turbopack setting
- The difference in development speed is negligible for this project size

#### Consequences
- Set `--no-turbopack` in dev script or omit the flag
- Standard build is well-tested and stable
- Can revisit when Turbopack reaches full compatibility

---

### ADR-006: Resend for Email

**Date:** 2024 (project inception)
**Status:** Accepted

#### Context
Transactional email is needed for ghost profile notifications, contact form, and future notification emails. Requirements: free tier for non-profit, API-based (no SMTP), simple SDK.

#### Decision
Use Resend for all transactional email.

#### Rationale
- Generous free tier (100 emails/day for a non-profit)
- Simple REST API with TypeScript SDK
- React Email compatibility for template rendering
- No SMTP configuration needed
- Fast delivery with good deliverability reputation

#### Consequences
- `RESEND_API_KEY` required in environment
- Email templates in `src/lib/emails/`
- Contact form at `/api/contact` sends via Resend (rate-limited at 5/60s)

#### Related
- `src/lib/emails/ghost-marker-notification.ts` — ghost profile email template
- `src/app/api/contact/route.ts` — contact form handler

---

### ADR-007: Upstash Redis for Rate Limiting

**Date:** 2025 (Phase 1)
**Status:** Accepted

#### Context
API routes need rate limiting to prevent abuse. Requirements: serverless-compatible (HTTP-based, no persistent connection), free tier for low traffic, sliding window algorithm.

#### Decision
Use Upstash Redis with `@upstash/ratelimit` for all rate limiting.

#### Rationale
- Serverless-native (HTTP REST API, no TCP connection)
- `@upstash/ratelimit` provides sliding window rate limiting out of the box
- Generous free tier (10,000 requests/day)
- Falls back to allow-all if Redis is unreachable (fail-open, never block legitimate traffic)
- Works seamlessly with Vercel serverless functions

#### Consequences
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` required in environment
- Five rate limit tiers: `public_form` (5/60s), `sensitive` (3/60s), `user_action` (5/60s), `frequent` (10/60s), `bulk` (30/60s)
- Wrapper pattern: `withRateLimit(handler, "tier")` for simple routes
- Direct check pattern: `checkRateLimit(request, "tier")` for complex routes

#### Related
- `src/lib/rate-limiter.ts` — rate limiting implementation
- All `src/app/api/*/route.ts` files — usage

---

### ADR-008: Flat Design System (Kloner.app Foundation)

**Date:** 2025 (design pivot)
**Status:** Accepted

#### Context
The original design used dark glassmorphism (backdrop-blur, translucent surfaces). This created visual noise, accessibility issues, and dated aesthetics.

#### Decision
Pivot to a flat, layered Kloner.app-inspired design system with a single red accent. No backdrop-blur, no glass effects, no parallax.

#### Rationale
- Flat surfaces load faster (no GPU-composited blur layers)
- Better accessibility: solid backgrounds provide higher contrast
- The single red accent (`#FE0000`) means something — used only on CTAs and verified trust markers
- Depth comes from tonal layering (lighter content, darker sidebars), not shadows or blur
- Distinguishes Butwal Hacks from the 2023 AI-startup aesthetic (glass, gradients, glow-everything)

#### Consequences
- All `backdrop-filter: blur()` removed from components
- `globals.css` redesigned around `--bh-*` CSS custom properties
- Dark mode uses solid dark surfaces (`#1a1a1a` / `#2a2a2a`), not translucent glass
- `bh-*` utility classes defined in `@layer utilities` for consistent component styling
- Red glow (`--bh-glow-red`) appears only on primary CTA hover and verified trust markers

#### Related
- `DESIGN.md` — complete design system reference
- `PRODUCT.md` §2 — design direction
- `src/app/globals.css` — token implementation
- `src/components/ui/` — primitive components

---

### ADR-009: Subdomain Routing via proxy.ts

**Date:** 2025 (Phase 1)
**Status:** Accepted

#### Context
Auth0 v4 SDK requires mounting at `/auth/*` via middleware. The project also needs separate hosts for marketing (`butwalhacks.com`) versus dashboard/app (`app.butwalhacks.com`).

#### Decision
Use a single `src/proxy.ts` file (Next.js middleware convention) for both Auth0 route mounting and subdomain-aware routing. No `middleware.ts` file.

#### Rationale
- Auth0 v4 requires explicit middleware for route mounting
- Single middleware file simplifies the routing logic
- Subdomain detection (butwalhacks.com vs app.butwalhacks.com) + route rewriting handled in one place
- During local development (`localhost`), all routes are accessible from one origin

#### Consequences
- `proxy.ts` handles: Auth0 callback/login/logout routes, subdomain detection, route rewriting
- No separate `middleware.ts` file
- Vercel production config must set `butwalhacks.com` and `app.butwalhacks.com` as domains
- Local development requires no subdomain configuration

---

### ADR-010: Open Collective for Funding (No Stripe)

**Date:** 2024 (project inception)
**Status:** Accepted

#### Context
The platform needs to handle payments for bounties, sponsorships, and community funding. Stripe was considered but requires complex PCI compliance and tax handling.

#### Decision
Use Open Collective for all financial transactions. Do NOT integrate Stripe.

#### Rationale
- Open Collective handles tax compliance, invoicing, and fiscal sponsorship automatically
- Transparent budgeting: all income/expense is publicly visible
- No PCI compliance burden on the project
- Open Collective Gift Cards enable sponsor payouts and bounties
- Aligns with the non-profit / open-source nature of the project

#### Consequences
- Sponsors must have or create an Open Collective account
- Bounty payouts go through Open Collective's fiscal host
- `/transparency` page displays budget data via Open Collective API
- No credit card storage or payment processing code
- `/api/webhooks/opencollective/route.ts` handles OC webhook events

#### Related
- `src/app/(main)/transparency/page.tsx` — budget transparency page
- `src/app/api/webhooks/opencollective/route.ts` — OC webhook handler
- `src/app/api/admin/annual-report/route.ts` — admin annual report endpoint

---

### ADR-011: PostHog + Vercel Analytics for Observability

**Date:** 2025 (Phase 1)
**Status:** Accepted

#### Context
The project needs analytics (traffic, page views) and product analytics (funnels, user behavior, feature adoption). Sentry handles error monitoring separately.

#### Decision
Use both Vercel Analytics (traffic) and PostHog (product analytics). Sentry for errors.

#### Rationale
- Vercel Analytics: zero-config, privacy-friendly, covers basic traffic metrics
- PostHog: self-hostable, supports funnels, feature flags, and session recording
- Together they provide full observability without overlapping
- Both have generous free tiers for non-profits

#### Consequences
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` must be in client-side env
- PostHog provider wraps the app in `layout.tsx`
- Vercel Analytics is a simple `<Analytics />` component
- CSP must include PostHog CDN and API domains in `connect-src` and `script-src`

#### Related
- `src/components/posthog-provider.tsx` — PostHog provider component
- `src/app/layout.tsx` — Analytics + PostHog providers
- `next.config.ts` — CSP for PostHog domains

---

### ADR-012: Supabase Realtime for Task Board Updates

**Date:** 2025 (Phase 1)
**Status:** Accepted

#### Context
The Notion-style work distribution (Kanban board) needs real-time updates when team members drag tasks between columns.

#### Decision
Use Supabase Realtime subscriptions for live task board updates.

#### Rationale
- No additional service needed (Supabase already in the stack)
- Realtime uses PostgreSQL replication slots to stream database changes
- `@supabase/supabase-js` has built-in Realtime client support
- `usePresence()` hook uses a separate presence channel for online status
- Works with serverless functions (WebSocket connection from the browser)

#### Consequences
- Realtime must be enabled on the `tasks` table in Supabase dashboard
- `usePresence()` hook uses a `presence` channel for online indicators
- Client subscribes to `tasks` changes in the workspace context
- Rate limit: Realtime connections counted in Supabase project limits

#### Related
- `supabase/migrations/092_enable_realtime_tasks.sql` — database setup
- `src/hooks/use-presence.ts` — presence tracking hook
- `src/hooks/use-task-subscription.ts` — task update subscription
- `src/components/tasks/kanban-board.tsx` — Kanban UI

---

### ADR-013: No Supabase RLS — Application-Level Authorization

**Date:** 2024 (project inception)
**Status:** Accepted (see also ADR-002)

#### Context
Supabase RLS is the standard way to restrict row-level access. However, managing RLS policies across 66 migrations becomes complex and hard to audit.

#### Decision
Do not use Supabase RLS for access control. All authorization is enforced at the application layer via Auth0 session checks.

#### Rationale
- RLS policies are SQL — harder to review in PRs than TypeScript conditionals
- Application-layer authorization is testable with standard test frameworks
- Service role key bypasses RLS anyway, making policies redundant for backend queries
- Reduces migration complexity (no RLS policy migrations to maintain)

#### Consequences
- Every mutation route must check `getSession()` and verify permissions
- Role-based access (hacker/organizer/maintainer/sponsor) enforced in route handlers
- Public routes use the anon key client with explicitly scoped SELECT queries
- Audit logging captures all state-changing actions

#### Related
- `src/utils/supabase.ts` — anon client for public reads, service client for all mutations (single file)
- All `src/app/api/*/route.ts` files — session checks

---

### ADR-014: Monorepo with Single Application

**Date:** 2024 (project inception)
**Status:** Accepted

#### Context
The project needs to serve both a public marketing site and an authenticated application under subdomains.

#### Decision
Single Next.js application in a flat monorepo. The root `Butwal-Hacks/` directory contains configuration, documentation, and CI, while `my-app/` contains the Next.js application.

#### Rationale
- Single deploy target (Vercel) — simpler than managing multiple apps
- Shared components, utilities, and types between marketing and app routes
- Subdomain routing handled at the middleware layer (`proxy.ts`), not at the deployment level
- Monorepo tools (npm workspaces) unnecessary for a single application

#### Consequences
- Root `package.json` runs the app via npm workspaces (`build: "cd my-app && npm run build"`); CI/CD workflows use `working-directory: my-app` for all npm commands
- Vercel preview deployments serve both marketing and app routes from the same URL
- Shared config files (`.gitignore`, `LICENSE`, `README.md`) live at the root

#### Related
- `vercel.json` — deployment configuration
- `.github/workflows/ci.yml` — CI with working-directory
- `README.md` — project structure documentation

---

## Butwal Hacks — Codebase Overview

---

### 1. Executive Summary

**Butwal Hacks** is a nonprofit youth technology initiative building an **ORCID-style credential verification system** and **hackathon management platform** (Devpost/MLH clone) for Nepal's next generation of builders.

The platform allows hackers to:
- Claim a verifiable **BH-ID** (Butwal Hacks Identifier)
- Earn **Trust Markers** (cryptographically signed credentials for achievements)
- Create **projects** and **teams** during hackathons
- Showcase their work on a public **Hacker ID profile** (`/p/[slug_id]`)
- Participate in **chapters** (regional communities across Nepal)

**Current state:** Post-MVP phase. Auth migrated from Clerk to Auth0. UI uses semantic @theme CSS variables with dark/light mode support. The core credentialing engine (Trust Markers, Ghost Profiles, Ed25519 signing) is built and stable. Dashboards for all three roles (Hacker, Organizer, Maintainer) exist along with sponsor portal, mentor directory (with Cal.com integration), team formation V2 (manual force-create), QR code check-in with scanner, certificate bulk PDF export, health endpoint (DB + Redis), and AI pitch generator. Nepali i18n covers 200+ translation keys across top UI surfaces. Test suite covers 811 tests across 41 test files (19 server action test files) with full mock isolation and CI integration.

---

### 2. Tech Stack & Integrations

| Layer | Technology | Role |
|-------|-----------|------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework, server components, API routes |
| **Language** | TypeScript 5 | Type-safe codebase |
| **Styling** | Tailwind CSS 4 + `tw-animate-css` | Utility-first CSS with flat, solid-surface design system |
| **Auth** | Auth0 (`@auth0/nextjs-auth0` v4) | Universal Login, session management, M2M API access |
| **Database** | Supabase (`@supabase/supabase-js`) | Postgres database via Service Role Key (RLS disabled — auth handled by Auth0) |
| **Media** | Cloudinary (`cloudinary`) | Image uploads, transformations, CDN |
| **Rate Limiting** | Upstash Redis + Ratelimit | API rate limiting (5 tiers: public_form, sensitive, user_action, frequent, bulk) |
| **Email** | Resend | Transactional email (contact form, ghost marker notifications) |
| **Analytics** | PostHog (`posthog-js`) | Product analytics, session recording |
| **Observability** | Sentry (`@sentry/nextjs`) | Error monitoring with source maps |
| **Finance** | Open Collective API | Transparent funding, bounty payouts |
| **Background** | Vercel Cron | Scheduled tasks (daily stats, cleanup expired sessions) |
| **AI** | Groq (Llama 3) | BH Bot chatbot, AI certificate extraction, AI pitch generation |
| **PWA** | Service Worker + manifest | Offline support, install prompt |
| **i18n** | Custom (`src/lib/i18n.ts`) | English + Nepali translations |
| **Validation** | Zod | Schema validation for API routes and forms |
| **Toast/UI** | Sonner | Toast notifications |

#### Dependencies (key)
```json
{
  "next": "^16.1.6",
  "react": "^19.2.0",
  "@auth0/nextjs-auth0": "^4.25.0",
  "@supabase/supabase-js": "^2.108.2",
  "@upstash/ratelimit": "^2.0.8",
  "cloudinary": "^2.10.0",
  "resend": "^6.17.1",
  "posthog-js": "^1.396.6",
  "zod": "^3.25.76",
  "lucide-react": "^0.454.0"
}
```

---

### 3. Core Features Implemented

#### ✅ Authentication & Profiles
- **Auth0 Universal Login** — `/auth/login`, `/auth/callback`, `/auth/logout` via `proxy.ts` middleware
- **Auth0 Webhook** — Post-login Action syncs user to Supabase `profiles` table
- **BH-ID Generation** — Sequential IDs (`BH-YY-NNN`) with year suffix
- **Ghost Profiles** — Unclaimed profiles created via email (Trust Markers issued before user registers)
- **Three Role RBAC** — 🟢 Hacker, 🟡 Organizer, 🔴 Maintainer (role-based dashboard routing)

#### ✅ Design System (flat, solid surfaces)
- **Custom CSS variables** in `globals.css` with dark/light mode support (native `classList.toggle` + `localStorage`, no `next-themes` dep)
- **Solid surfaces** — cards use solid white `#FFFFFF` on `#F7F7F8`, 1px `#E5E5E5` borders, no backdrop blur (reserved for functional overlays only)
- **Brand palette** — Primary `#FE0000`, Deep Red `#B10000`, Dark Red `#7b0000`
- **Utility classes** — `bh-card`, `bh-btn-primary`, `bh-btn-secondary`, `bh-btn-ghost`, `bh-input`, `bh-trust-marker-verified`, etc.
- **Red glow** (`--bh-glow-red`) — only on primary CTA hover and verified trust markers

#### ✅ Public Pages
- **Homepage** — Hero, Mission, Value Pillars, What We Do, Bento showcase grid, Stats counter, Latest updates
- **Community** — Member directory with filtering, testimonials
- **Chapters** — Chapter discovery and info pages
- **Events** — Event listing with filter (upcoming/past), event detail with countdown + registration
- **Projects** — Project grid/detail with likes, comments, GitHub sync
- **Hacker ID** (`/p/[slug_id]`) — Public profile with identity card, trust markers, projects, event timeline, photo gallery, certificates
- **Blog** — Blog listing with categories, search, newsletter signup
- **Explore** — Hub/explore page
- **Transparency** — Financial transparency with Open Collective
- **Contact** — Contact form via Resend
- **About, Philosophy, Governance, Donors, Initiatives, Programs** — Static content pages

#### ✅ Dashboard (Server-side rendered)
- **Hacker Dashboard** — Activity feed, level progression, XP tracking, profile settings, projects management, teams management, certificates, GitHub sync, skill trees with unlockable micro-credentials
- **Organizer Dashboard** — Event management (create/edit/analytics), attendee management with CSV export + QR code check-in scanner, trust marker issuance, API keys, team force-creation
- **Maintainer Dashboard** — User management, trust override/revoke, moderation panel, audit log, site config, annual report generation, school dedication
- **Sponsor Portal** — Bounty board, opportunity management, hacker talent search with marker-type filtering

#### ✅ Trust Marker System
- **Issue markers** — Organizers can issue markers to hackers by email
- **Ghost marker flow** — Unclaimed → email notification → claim via sign-in
- **Cryptographic signing** — Ed25519 keypair for verifiable markers
- **Verification** — `/verify/[markerId]` route with signature verification
- **Badge assertions** — Open Badges 3.0 compatible JSON-LD format
- **Certificate scanner** — AI-powered extraction from uploaded certificate images

#### ✅ API Routes (51 endpoints)
- Auth0 webhook sync, Cloudinary signed uploads, event CRUD + registration + check-in + QR scan
- Project CRUD + likes + GitHub deep sync, team management (manual force-create), profile management
- AI chat (BH Bot), AI certificate extraction, AI pitch generator
- Contact form, feedback submission, notifications, reviews, sponsor + bounty operations
- Trust marker issuance (v1 API), badge assertions, annual report generation, health check
- Mentor directory, QR code check-in scanner, certificate bulk PDF export
- Cron jobs (daily stats, cleanup), Open Collective webhook, proxy webhooks
- Bounty listing with pagination, skill trees with status, GitHub deep sync

#### ✅ Infrastructure
- **PWA** — Service worker, install prompt, offline page
- **Rate limiting** — 5 tiers with Upstash Redis
- **Error monitoring** — Sentry + structured logger (console)
- **Analytics** — PostHog event capture (server + client)
- **SEO** — Dynamic metadata builder, JSON-LD schema, hreflang tags
- **i18n** — English + Nepali with 200+ translation keys
- **Command palette** — Cmd+K search across hackers, projects, events
- **Feedback widget** — Anonymous feedback collection
- **BH Bot** — RAG chatbot with Groq Llama 3
- **Mentor Directory** — Profiles with "Available for Mentorship" flag + Cal.com integration for 15-min chat requests
- **Team Formation V2** — Organizer manual force-create teams and assign members
- **QR Code Check-in** — Per-hacker QR code generation + scanner for marking attendance
- **Certificate Export** — Bulk PDF export of all trust markers for an event
- **Health Endpoint** — `/api/health` checking DB and Redis connectivity
- **AI Pitch Generator** — Groq-powered Devpost-style project description generation

---

### 4. Architecture & Data Flow

#### Authentication Flow
```
User → /auth/login → Auth0 Universal Login → Redirect → /auth/callback
                                                          ↓
                                              Auth0 creates session
                                                          ↓
                                              Auth0 Action fires POST /api/webhooks/auth0
                                                          ↓
                                              Supabase profiles table upsert
                                                          ↓
                                              BH-ID generated (sequential)
```

#### Auth Enforcement
- **Middleware** (`proxy.ts`): Auth0 mounts auth routes at `/auth/*`, protects `/portal/*`
- **Server components**: `auth0.getSession()` → redirect to `/auth/login` if unauthenticated
- **API routes**: `withRateLimit()` wraps handlers, `auth0.getSession()` + `createServiceClient()` for DB access
- **Client components**: `useUser()` from `@auth0/nextjs-auth0/client` for conditional rendering

#### Database Pattern
```
Supabase is used as a database ONLY (no Supabase Auth).
- Service Role Key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS
- ANON key (NEXT_PUBLIC_SUPABASE_ANON_KEY) for public reads
- auth0_user_id links Auth0 identity → Supabase profile
- All authenticated DB access goes through createServiceClient()
```

#### Data Flow Example (Event Registration)
```
User clicks "Register" → EventRegisterButton (client)
                         → POST /api/events/register
                           → auth0.getSession() check
                           → withRateLimit("user_action")
                           → createServiceClient() → Supabase insert
                           → captureServerEvent("event_registered")
                           → posthogLog.info()
                           → Response { success: true }
```

#### Security Layers
1. **Edge Middleware** — Auth0 session check, subdomain routing
2. **Rate Limiting** — 5 tiers via Upstash (3/min for sensitive ops, 30/min for webhooks)
3. **Input Validation** — Zod schemas on all POST routes
4. **Sanitization** — XSS prevention on form inputs (sanitizeName, sanitizeEmail, sanitizeDescription)
5. **Content Security** — `rejectOversized()` for payload limits
6. **Webhook Security** — `AUTH0_WEBHOOK_SECRET` header verification (production)
7. **Cryptography** — Ed25519 signing for trust marker verification

---

### 5. Route Map

#### Public Routes
| Route | Type | Description |
|-------|------|-------------|
| `/` | Page | Homepage (Hero, Impact, Bento grid, Featured projects, Updates) |
| `/community` | Page | Member directory + testimonials |
| `/chapters` | Page | Chapter discovery |
| `/chapters/[slug]` | Page | Chapter detail |
| `/events` | Page | Events listing + filter |
| `/events/list` | Page | Events listing (alternative view) |
| `/events/[slug]` | Page | Event detail (countdown, registration, timeline, FAQ) |
| `/events/[slug]/projects` | Page | Event project expo grid |
| `/projects` | Page | Project listing grid |
| `/projects/[id]` | Page | Project detail (likes, comments, contributions) |
| `/projects/impact/[id]` | Page | Impact report |
| `/explore` | Page | Community hub |
| `/blog` | Page | Blog listing with categories + search |
| `/blog/[slug]` | Page | Blog post detail |
| `/p/[slug_id]` | Page | Public Hacker ID profile |
| `/profile/[bh_id]` | Page | Profile redirect |
| `/verify/[markerId]` | Page | Trust marker verification |
| `/verify/[bhId]/embed` | API | Embedded verification widget |
| `/widget/[slugId]` | Page | Embeddable profile widget |
| `/about` | Page | About page |
| `/annual-report` | Page | Annual report |
| `/contact` | Page | Contact form |
| `/transparency` | Page | Financial transparency |
| `/legal/privacy` | Page | Privacy policy |
| `/legal/terms` | Page | Terms of service |
| `/cookie-policy` | Page | Cookie policy |
| `/governance` | Page | Governance |
| `/philosophy` | Page | Philosophy page |
| `/donors` | Page | Donors page |
| `/gallery` | Page | Photo gallery |
| `/initiatives` | Page | Initiatives listing |
| `/initiatives/[slug]` | Page | Initiative detail |
| `/programs/[slug]` | Page | Program detail |
| `/mentors` | Page | Mentor directory |
| `/opportunities` | Page | Bounties + opportunities |
| `/resources` | Page | Resources |
| `/support` | Page | Support |
| `/sitemap` | Page | Sitemap |
| `/teams` | Page | Team listing |
| `/teams/create` | Page | Create team |
| `/teams/[team_id]` | Page | Team detail |
| `/offline` | Page | Offline fallback |
| `/docs/*` | Page | Documentation pages |

#### Auth Routes
| Route | Description |
|-------|-------------|
| `/auth/login` | Auth0 Universal Login (mounted by proxy.ts) |
| `/auth/callback` | Auth0 post-login callback |
| `/auth/logout` | Auth0 logout |
| `/sign-in` | Sign-in page |
| `/sign-up` | Sign-up page |
| `/login` | Login page |
| `/claim/[token]` | Ghost profile claim flow |

#### Dashboard Routes (Protected)
| Route | Role | Description |
|-------|------|-------------|
| `/dashboard` | All | Dashboard overview (activity feed, XP, stats) |
| `/dashboard/hacker` | Hacker | Hacker dashboard home |
| `/dashboard/hacker/profile` | Hacker | Profile settings |
| `/dashboard/hacker/projects` | Hacker | My projects |
| `/dashboard/hacker/teams` | Hacker | My teams |
| `/dashboard/hacker/certificates` | Hacker | Certificate scanner |
| `/dashboard/hacker/api-keys` | Hacker | API keys |
| `/dashboard/hacker/chat` | Hacker | Team chat |
| `/dashboard/hacker/skills` | Hacker | Skill trees |
| `/dashboard/hacker/team-matching` | Hacker | Team matching |
| `/dashboard/hacker/work` | Hacker | Task board (Kanban) |
| `/dashboard/organizer` | Organizer | Organizer dashboard |
| `/dashboard/organizer/events` | Organizer | Event management |
| `/dashboard/organizer/events/new` | Organizer | Create event |
| `/dashboard/organizer/events/[event_id]` | Organizer | Event detail/edit |
| `/dashboard/organizer/events/[event_id]/analytics` | Organizer | Event analytics |
| `/dashboard/organizer/events/[event_id]/attendees` | Organizer | Attendee list + CSV export |
| `/dashboard/organizer/events/[event_id]/qr` | Organizer | QR check-in codes |
| `/dashboard/organizer/events/[event_id]/scan` | Organizer | QR scan check-in |
| `/dashboard/organizer/events/[event_id]/teams` | Organizer | Team management |
| `/dashboard/organizer/issue-marker` | Organizer | Issue trust markers |
| `/dashboard/organizer/api-keys` | Organizer | API key management |
| `/dashboard/organizer/work` | Organizer | Organizer task board |
| `/dashboard/maintainer` | Maintainer | Maintainer dashboard |
| `/dashboard/maintainer/users` | Maintainer | User management |
| `/dashboard/maintainer/audit-log` | Maintainer | Audit log |
| `/dashboard/maintainer/trust-override` | Maintainer | Trust marker override/revoke |
| `/dashboard/maintainer/site-config` | Maintainer | Site configuration |
| `/dashboard/maintainer/dedicate-school` | Maintainer | School dedication |
| `/dashboard/projects/new` | Owner | Submit project |
| `/dashboard/projects/[projectId]/edit` | Owner | Edit project |

#### Portal Routes (Protected — Sponsor/Recruiter)
| Route | Description |
|-------|-------------|
| `/portal` | Sponsor portal |
| `/portal/bounties` | Bounty board |
| `/portal/bounties/new` | Create bounty |
| `/portal/bounties/[id]/edit` | Edit bounty |
| `/portal/sponsors` | Sponsor directory |
| `/portal/sponsors/company` | Sponsor company profile |
| `/portal/payouts` | Payout management |
| `/portal/recruiters` | Recruiter directory |

#### Org Routes (Chapter subdomains)
| Route | Description |
|-------|-------------|
| `/orgs/[slug]` | Chapter page |
| `/orgs/[slug]/dashboard` | Chapter dashboard |
| `/orgs/[slug]/events` | Chapter events |
| `/orgs/[slug]/events/new` | Create chapter event |
| `/orgs/[slug]/members` | Chapter members |

#### API Routes (51 total)
| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/webhooks/auth0`, `POST /api/auth/link/initiate`, `GET /api/auth/link/status`, `POST /api/auth/link/unlink`, `GET /api/auth/link/callback` |
| **Events** | `GET /api/events`, `POST /api/events/register`, `POST /api/events/checkin`, `GET /api/events/[eventId]/registrations`, `GET /api/events/ical`, `GET /api/events/[eventId]/export-certificates` |
| **Projects** | `GET/POST /api/projects`, `POST /api/projects/like`, `POST /api/github/sync`, `POST /api/github/deep-sync`, `GET /api/impact/report/[projectId]` |
| **Profiles** | `POST /api/profile/complete`, `POST /api/profile/update` |
| **Teams** | `GET/POST /api/teams` (force-create is a server action in `actions/teams.ts`) |
| **Media** | `POST /api/cloudinary-signature` |
| **AI** | `POST /api/ai/chat` (BH Bot), `POST /api/ai/pitch-generator`, `POST /api/certificates/extract` |
| **Badges** | `GET /api/badges/check`, `GET /api/badges/assertions/[markerId]`, `GET /api/badges/issuer` |
| **Trust** | `POST /api/v1/issue-marker`, `GET /api/v1/profile/[slugId]`, `GET /api/v1/api-keys`, `POST /api/v1/api-keys`, `GET /api/verify/[bhId]`, `GET /api/verify/[bhId]/embed` |
| **Admin** | `GET /api/admin/annual-report` |
| **Contact** | `POST /api/contact` |
| **Feedback** | `POST /api/reviews` |
| **Webhooks** | `POST /api/webhooks/opencollective`, `POST /api/webhooks/proxy` |
| **Sponsors** | `POST /api/sponsor` |
| **Resources** | `POST /api/resources/complete` |
| **Metrics** | `GET /api/organizer/metrics`, `GET /api/metrics` |
| **Notifications** | `GET /api/notifications` |
| **System** | `GET /api/health`, `GET /api/keep-alive`, `POST /api/report-error` |
| **Bounties** | `GET /api/bounties` (paginated) |
| **Skill Trees** | `GET /api/skill-trees` (paginated) |
| **Tasks** | `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/[id]`, `GET/POST /api/workspaces` |
| **Search** | `POST /api/search` |
| **Certificates** | `GET /api/certificates` |

---

### 6. The Vision

Butwal Hacks is building a **credential authority for youth tech talent in Nepal**.

#### End Goal
A platform where any young technologist in Nepal can:
1. **Claim a verifiable identity** (BH-ID) — their permanent, portable credential
2. **Earn Trust Markers** — cryptographically signed attestations of skills, achievements, and participation
3. **Showcase work** — projects, hackathon wins, certificates in one canonical profile
4. **Get discovered** — by recruiters, sponsors, and chapter organizers
5. **Verify anywhere** — embeddable widget, Open Badges 3.0, API access

#### Key Differentiators
- **Ghost Profiles** — Trust Markers can be issued before a user registers (email-based claim flow)
- **Cryptographic verification** — Ed25519 signing ensures marker authenticity
- **Chapter system** — Decentralized regional communities across Nepal
- **Zero-cost for users** — Funded via Open Collective, no Stripe/fees
- **Flat aesthetic** — Solid surfaces, crisp 1px borders, selective red glow on CTAs and verified markers

#### North Star Metrics
- Community of student builders, mentors, and organizers across Lumbini Province
- Regular hackathons, game jams, and workshops
- Open-source and hackathon projects built by the community
- Participants from across Lumbini and neighboring provinces
- Chapter network in planning — no active chapters yet

---

### 7. Component Architecture

#### Directory Structure
```
src/
├── app/                    # Next.js App Router (routes + API)
│   ├── (auth)/             # Auth pages (sign-in, sign-up, claim)
│   ├── (main)/             # Public pages with Navbar + Footer
│   │   ├── dashboard/      # Protected dashboard (hacker/organizer/maintainer)
│   │   ├── portal/         # Sponsor/recruiter portal
│   │   ├── orgs/           # Chapter subdomain pages
│   │   └── ...             # Public pages
│   ├── api/                # 51 API route handlers
│   ├── p/[slug_id]/        # Public Hacker ID profile
│   ├── verify/             # Trust marker verification
│   └── widget/             # Embeddable widget
├── components/
│   ├── sections/           # Navbar, Footer, Hero, WhatWeDo, ValuePillars, etc.
│   ├── hacker-id/          # Identity card, certificates, projects, timeline
│   ├── dashboard/          # Activity feed, level badge, skill tree, team management
│   ├── events/             # Event detail, filter, countdown, register button
│   ├── projects/           # Project card, grid, detail, submission form
│   ├── home/               # Bento grid, featured projects, stats counter
│   ├── ui/                 # Button, card, badge, skeleton, glass-primitive
│   └── ...                 # Providers, utilities, widgets
├── lib/
│   ├── actions/            # Server actions (profile, events, projects, teams, etc.)
│   ├── analytics/          # PostHog server events
│   ├── emails/             # Email templates
│   ├── gamification/       # Level/XP calculation
│   └── ...                 # auth0, i18n, logger, rate-limiter, validation, seo
└── utils/
    └── supabase.ts         # Client, server, service client factories (single file)
```

---

### 7a. Reusable UI Primitives

All UI primitives live in `src/components/ui/` and are imported throughout the application. They follow the flat, solid-surface design system.

#### Button (`src/components/ui/button.tsx`)
A polymorphic button component using plain variant maps (no `class-variance-authority` dep).

| Prop | Variants |
|------|----------|
| `variant` | `default` (red pill), `ghost` (transparent), `outline` (bordered), `destructive` (dark red), `secondary` (subtle), `link` (text only) |
| `size` | `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg` |
| `asChild` | Uses a custom 3-line `Slot` pattern (replaces `@radix-ui/react-slot`) |

Default variant includes `shadow-[0_0_20px_var(--glow-bh-red)]` and hover `scale-[1.03]` animation.

#### Card (`src/components/ui/card.tsx`)
Standard card with 5 subcomponents:
- `Card` — container wrapper with `rounded-xl border bg-surface`
- `CardHeader` — top section with flex column layout
- `CardTitle` — heading with `font-semibold tracking-tight`
- `CardDescription` — muted description text using `text-secondary`
- `CardContent` — main body area
- `CardFooter` — bottom action area

#### Badge (`src/components/ui/badge.tsx`)
Tiny label/tag for status indication. Uses plain variant maps.

| Variant | Use Case |
|---------|----------|
| `default` | Generic tag (border-glass, subtle text) |
| `verified` | Trust marker verified (red-tinted) |
| `organizer` | Organizer role badge (yellow-tinted) |
| `ghost` | Minimal, transparent |
| `secondary` | Muted background |
| `outline` | Border-only |

#### RoseLoader & RoseSpinner (`src/components/ui/rose-loader.tsx`)
Custom red-themed loading spinner with animated SVG circles.

| Component | Variants |
|-----------|----------|
| `RoseLoader` | `size`: `fullscreen` (fixed overlay), `lg`, `md`, `sm`. Accepts optional `text` prop. |
| `RoseSpinner` | `size`: `lg` (48px), `md` (28px), `sm` (16px). Inline, used inside buttons/containers. |

#### Skeleton (`src/components/ui/skeleton.tsx`)
Loading placeholder with multiple presets.

| Variant | Shape |
|---------|-------|
| `default` | Generic 16px bar |
| `card` | Large card placeholder (h-48) |
| `text` | 3/4 width text line |
| `circle` | Circular avatar placeholder |
| `image` | Image placeholder (h-40) |

Also exports pre-composed skeletons: `BlogCardSkeleton`, `BlogGridSkeleton`, `PageSkeleton`.

#### EmptyState (`src/components/ui/empty-state.tsx`)
`NoResultsState` component — displays a `SearchX` icon, message, and "Clear filters" button. Used by the blog search.

#### CSS Utility Classes (from `globals.css`)

| Class | Definition |
|-------|-----------|
| `.bh-card` | Solid white card, 1px border, 12px radius |
| `.bh-btn-primary` | Red pill button with glow on hover |
| `.bh-btn-secondary` | Outline pill button |
| `.bh-btn-ghost` | Transparent button |
| `.bh-input` | Form input with focus ring |
| `.bh-trust-marker-verified` | Verified credential badge (red border + glow) |
| `.bh-trust-marker-self-reported` | Self-reported credential badge (standard border) |
| `.bh-trust-marker-revoked` | Revoked credential badge (strikethrough) |

---

### 8. Technical Debt & Known Issues

Historical debt items from the 2026 audits are all resolved. The ponytail-audit CI job (`.github/actions/ponytail-audit/audit.mjs`) continuously scans for dead code, unused dependencies, and empty directories.

---

## API Reference

### Public REST API

Endpoints listed below are accessible without authentication unless noted otherwise.

#### `POST /api/v1/issue-marker`

Issue a trust marker (credential) to a hacker.

**Auth:** Organizer or Maintainer session required.

**Request:**
```json
{
  "profile_id": "auth0|abc123",
  "title": "Best Web App - Hackathon 2024",
  "description": "Awarded for building the most impressive web application",
  "category": "achievement"
}
```

**Response (201):**
```json
{
  "success": true,
  "marker": {
    "id": "marker-uuid",
    "slug_id": "BH-24-001",
    "title": "Best Web App - Hackathon 2024",
    "signature": "base64-ed25519-signature"
  }
}
```

---

#### `GET /api/v1/profile/[slug_id]`

Fetch a public hacker profile.

**Auth:** None (public).

**Response (200):**
```json
{
  "bh_id": "BH-24-001",
  "full_name": "Jane Doe",
  "bio": "Full-stack developer passionate about edtech",
  "avatar_url": "https://res.cloudinary.com/...",
  "role": "Hacker",
  "trust_markers": [
    {
      "id": "marker-uuid",
      "title": "Best Web App - Hackathon 2024",
      "verified": "Verified",
      "signature": "base64-ed25519-signature"
    }
  ],
  "skills": ["React", "Node.js", "TypeScript"],
  "socials": {
    "github": "https://github.com/janedoe",
    "linkedin": "https://linkedin.com/in/janedoe"
  }
}
```

---

#### `GET /api/v1/api-keys` **(Authenticated)**

List API keys for the authenticated user.

**Auth:** Authenticated user session required.

**Response (200):**
```json
{
  "keys": [
    {
      "id": "key-uuid",
      "prefix": "bhk_abc...",
      "created_at": "2024-01-01T00:00:00Z",
      "last_used_at": null
    }
  ]
}
```

---

#### `POST /api/v1/api-keys` **(Authenticated)**

Generate a new API key.

**Auth:** Authenticated user session required.

**Request:**
```json
{
  "name": "My Portfolio Site"
}
```

**Response (201):**
```json
{
  "key": "bhk_generated-full-key",
  "id": "key-uuid"
}
```

> **Note:** The full key is only shown once on creation.

---

### Webhooks

#### `POST /api/webhooks/auth0`

Receives Auth0 user events (signup, profile update).

**Auth:** Validated via `AUTH0_WEBHOOK_SECRET`.

**Events handled:**
- `user.signup` - Creates a new profile in Supabase with BH-ID.
- `user.update` - Syncs profile changes.
- `user.delete` - Marks profile as suspended.

**Response (200):**
```json
{
  "success": true,
  "profile_id": "auth0|abc123",
  "bh_id": "BH-24-001"
}
```

---

#### `POST /api/webhooks/opencollective`

Receives Open Collective payment events (donations, bounties).

**Auth:** Not yet verified (see [`OC_WEBHOOK_SECRET` issue](https://github.com/Prarambha369/Butwal-Hacks/issues)).

**Events handled:**
- `expense.paid` - Processes bounty payouts, awards XP to hacker.
- `donation.created` - Tracks donations on `/transparency` page.

**Response (200):**
```json
{
  "success": true,
  "event": "expense.paid"
}
```

---

#### `POST /api/webhooks/proxy`

Forwards platform events to Slack/Discord via configured webhook URLs.

**Auth:** Validated via `CRON_SECRET`.

**Events forwarded:**
- Event registrations
- Marker issuances
- Project submissions

---

### Internal API Routes

These are used by the frontend and are documented for contribution purposes.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/events` | GET/POST | List/create events |
| `/api/events/register` | POST | Register for an event |
| `/api/events/checkin` | POST | Organizer check-in |
| `/api/events/[eventId]/registrations` | GET | List event registrations |
| `/api/events/[eventId]/export-certificates` | GET | Export certificates as PDF |
| `/api/events/ical` | GET | Export events as iCal feed |
| `/api/projects` | GET/POST | List/submit projects |
| `/api/projects/like` | POST | Like/unlike a project |
| `/api/teams` | GET/POST | List/create teams |
| `/api/contact` | POST | Submit contact form |
| `/api/sponsor` | POST | Submit sponsor inquiry |
| `/api/reviews` | POST | Submit event review |
| `/api/resources/complete` | POST | Mark resource as completed |
| `/api/github/sync` | POST | Sync GitHub repos metadata |
| `/api/github/deep-sync` | POST | Deep sync: commits + README |
| `/api/badges/check` | GET | Check badge eligibility |
| `/api/ai/chat` | POST | AI assistant chat (BH Bot) |
| `/api/ai/pitch-generator` | POST | AI project pitch generator |
| `/api/certificates` | GET | List user certificates |
| `/api/certificates/extract` | POST | OCR certificate extraction |
| `/api/profile/complete` | POST | Complete profile onboarding |
| `/api/profile/update` | PATCH | Update profile fields |
| `/api/auth/link/initiate` | POST | Initiate account linking |
| `/api/auth/link/callback` | POST | Complete account linking |
| `/api/auth/link/status` | GET | Check link status |
| `/api/auth/link/unlink` | POST | Unlink a connected account |
| `/api/tasks` | GET/POST | List/create tasks |
| `/api/tasks/[id]` | PATCH/DELETE | Update/delete task |
| `/api/workspaces` | GET/POST | List/create workspaces |
| `/api/search` | POST | Full-text search across platform |
| `/api/health` | GET | Health check (DB + Redis) |
| `/api/keep-alive` | GET | Cron job keep-alive |
| `/api/metrics` | GET | Platform metrics |
| `/api/notifications` | GET | List user notifications |
| `/api/bounties` | GET/POST | List/create sponsor bounties |
| `/api/skill-trees` | GET | List skill trees |
| `/api/organizer/metrics` | GET | Organizer dashboard metrics |
| `/api/admin/annual-report` | GET | Annual report generation |
| `/api/impact/report/[projectId]` | GET | Project impact report |
| `/api/verify/[bhId]` | GET | Public BH-ID verification |
| `/api/verify/[bhId]/embed` | GET | Embeddable verification widget |
| `/api/cloudinary-signature` | POST | Generate Cloudinary upload signature |

---

### Rate Limiting

All public mutation endpoints are rate-limited via Upstash Redis:

| Endpoint | Limit |
|----------|-------|
| `/api/contact`, `/api/sponsor` | 5 req/min per IP (`public_form`) |
| Issue marker, reviews, GitHub sync, certificate extraction, AI pitch | 3 req/min (`sensitive`) |
| Event registration, check-in, teams, profile completion | 5 req/min (`user_action`) |
| Profile updates, likes, AI chat, Cloudinary signatures | 10 req/min (`frequent`) |
| Auth0 webhook, webhook proxy | 30 req/min (`bulk`) |

Exceeded limits return `429 Too Many Requests` with a `Retry-After` header.

---

## Authentication — Butwal Hacks

**Current auth provider: Auth0** (Regular Web Application)

### Architecture

```
User → /auth/login → Auth0 Hosted Login → Callback: /auth/callback
                                              ↓
                                Auth0 Post-Login Action
                                              ↓
                              POST /api/webhooks/auth0
                                              ↓
                              Supabase profiles table (created/updated)
```

- **Auth0 SDK**: `@auth0/nextjs-auth0` v4
- **Auth routes**: Mounted at `/auth/*` via `src/proxy.ts` middleware (NOT route handlers)
- **Database sync**: Auth0 Post-Login Action calls `/api/webhooks/auth0` to create/update Supabase profiles
- **Supabase**: Used as a database only — no Supabase Auth. Service role key bypasses RLS.
- **RBAC**: 3 roles — `hacker`, `organizer`, `maintainer` — stored in `profiles.role`

---

### Setup

#### 1. Auth0 Application

Create a **Regular Web Application** in Auth0 Dashboard:

| Setting | Development | Production |
|---|---|---|
| **Allowed Callback URLs** | `http://localhost:3000/auth/callback` | `https://butwalhacks.com/auth/callback` |
| **Allowed Logout URLs** | `http://localhost:3000` | `https://butwalhacks.com` |
| **Allowed Web Origins** | `http://localhost:3000` | `https://butwalhacks.com` |

> ⚠️ The path is `/auth/callback`, NOT `/api/auth/callback`. Auth0 SDK v4 mounts routes at `/auth/*` via the middleware proxy (`src/proxy.ts`).

#### 2. Environment Variables

```env
AUTH0_SECRET=<openssl rand -hex 32>
AUTH0_DOMAIN=auth.butwalhacks.com
AUTH0_CLIENT_ID=<from Auth0 Application>
AUTH0_CLIENT_SECRET=<from Auth0 Application>
AUTH0_BASE_URL=http://localhost:3000  # or https://butwalhacks.com in production
```

> A full `.env.example` with every service (Supabase, Cloudinary, Upstash, Resend, PostHog, Groq, Sentry, cron secrets, and webhook proxies) is available at `my-app/.env.example`.

#### 3. Post-Login Action

Create an Action in Auth0 Dashboard → Actions → Flows → Login:

```js
exports.onExecutePostLogin = async (event, api) => {
  // Read base URL from Auth0 Action secrets (set in Dashboard → Actions → Secrets).
  // Defaults to production URL if secret is not configured.
  const baseUrl = event.secrets.BASE_URL || 'https://butwalhacks.com';
  const webhookSecret = event.secrets.AUTH0_WEBHOOK_SECRET;

  const headers = { 'Content-Type': 'application/json' };

  // Include webhook secret if configured (for production signature verification).
  if (webhookSecret) {
    headers['X-Webhook-Secret'] = webhookSecret;
  }

  try {
    const response = await fetch(`${baseUrl}/api/webhooks/auth0`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sub: event.user.user_id,
        email: event.user.email,
        name: event.user.name || event.user.nickname || event.user.given_name || '',
      }),
    });

    if (!response.ok) {
      console.error(
        `[auth0-action] Webhook returned ${response.status}: ${await response.text()}`
      );
    }
  } catch (err) {
    console.error('[auth0-action] Failed to call webhook:', err instanceof Error ? err.message : String(err));
  }
};
```

##### How to configure Secrets

1. Go to **[Actions → Secrets](https://manage.auth0.com/#/actions/secrets)** in Auth0 Dashboard
2. Add the following secrets:

| Secret | Dev Value | Production Value | Required |
|--------|-----------|-----------------|----------|
| `BASE_URL` | `http://localhost:3000` | `https://butwalhacks.com` | No (falls back to prod) |
| `AUTH0_WEBHOOK_SECRET` | *(leave empty in dev)* | `<openssl rand -hex 32>` | No (optional signature) |

3. Click **Save**

> ⚠️ If `BASE_URL` is not set, the Action defaults to the production URL. For local development, **you must set `BASE_URL=http://localhost:3000`** or your dev login will sync to the production database.

Without this Action, new users will not get a Supabase profile and will redirect in a loop after login.

---

##### Webhook signature verification (production only)

The `/api/webhooks/auth0` endpoint currently does **not** verify the incoming webhook secret. To enable verification:

1. Set `AUTH0_WEBHOOK_SECRET` in the Auth0 Action's Secrets (see above)
2. Set `AUTH0_WEBHOOK_SECRET` in your app's environment variables
3. The webhook handler will compare the `X-Webhook-Secret` header against the env var

---

### Auth Flows

#### Sign In
- Client: Links to `/sign-in`, which redirects to `/auth/login`
- Auth0 SDK handles the OAuth2 flow
- On success, Auth0 redirects to `/auth/callback`
- The proxy middleware completes the session, then redirects to `/dashboard`

#### Sign Up
- Client: Links to `/sign-up`, which redirects to `/auth/login?screen_hint=signup`
- Auth0 shows the sign-up form

#### Sign Out
- Client: Links to `/sign-out`, which redirects to `/auth/logout`
- Auth0 clears the session, redirects to the homepage

#### Account Linking (Connect GitHub, LinkedIn, Google)

Users can link multiple Auth0 identities to their primary account. This lets them sign in with any connected provider and auto-populates social profile URLs.

```
User clicks "Connect GitHub" → POST /api/auth/link/initiate { provider: "github" }
                                  ↓
                          Returns Auth0 authorization URL
                                  ↓
                          User redirected to Auth0 login (GitHub OAuth)
                                  ↓
                          Auth0 redirects to GET /api/auth/link/callback?code=...&state=...
                                  ↓
                          Code exchanged for tokens
                                  ↓
                          Auth0 Management API: link identities
                                  ↓
                          Supabase: linked_accounts + socials updated
                                  ↓
                          Redirect to /dashboard/hacker/profile?linked=success:GitHub
```

##### API Routes

| Route | Method | Purpose | Rate Limit |
|-------|--------|---------|------------|
| `/api/auth/link/status` | GET | Get linked accounts for current user | None (read-only) |
| `/api/auth/link/initiate` | POST | Start linking flow, returns Auth0 URL | `sensitive` (3/min) |
| `/api/auth/link/callback` | GET | Handle OAuth callback, link identities | None (redirect target) |
| `/api/auth/link/unlink` | POST | Disconnect a linked account | `sensitive` (3/min) |

##### Supported Providers

| Provider | `provider` value | Auto-populates social URL |
|----------|-----------------|--------------------------|
| GitHub | `github` | `https://github.com/{nickname}` |
| LinkedIn | `linkedin` | `https://linkedin.com/in/{vanity}` (if non-numeric) |
| Google | `google-oauth2` | No (no profile URL) |

##### Data Storage

Linked accounts are stored in two places:

1. **Auth0 Management API** — authoritative source. Identities are linked via `POST /api/v2/users/{id}/identities`.
2. **Supabase `profiles.linked_accounts`** (JSONB column) — cached copy for fast reads when the Management API is unavailable.

When a user links GitHub or LinkedIn, the corresponding social URL is also auto-populated in `profiles.socials` (only if the field is currently empty).

##### Auth0 Configuration Required

**1. Social Connections** — Enable in Auth0 Dashboard > Authentication > Social:
- GitHub (requires GitHub OAuth app credentials)
- LinkedIn (requires LinkedIn developer app credentials)
- Google (uses built-in Google credentials from Auth0)

**2. M2M Application for Management API** — Create in Auth0 Dashboard > Applications > Machine to Machine:
- Select "Auth0 Management API" as the API
- Grant scopes: `read:users`, `update:users`
- Copy the Client ID and Client Secret

**3. Allowed Callback URLs** — Add to your Auth0 Application settings:
- `http://localhost:3000/api/auth/link/callback` (dev)
- `https://app.butwalhacks.com/api/auth/link/callback` (production)
- Also keep the existing `/auth/callback` for the main login flow

**4. Environment Variables** — Add to `.env.local`:
```env
AUTH0_MGMT_CLIENT_ID=<from M2M application>
AUTH0_MGMT_CLIENT_SECRET=<from M2M application>
```

##### Code Flows

**Initiate linking (client-side):**
```ts
// User clicks "Connect GitHub"
const res = await fetch("/api/auth/link/initiate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "github" }),
});
const { url } = await res.json();
window.location.href = url;  // Redirect to Auth0
```

**Check status (client-side):**
```ts
const res = await fetch("/api/auth/link/status");
const { linkedAccounts } = await res.json();
// linkedAccounts = [{ provider, user_id, email, name, linked_at }, ...]
```

**Unlink (client-side):**
```ts
await fetch("/api/auth/link/unlink", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "github", user_id: "12345" }),
});
```

##### Security

- CSRF protected via state cookies (random nonce + primary user ID, stored in httpOnly cookie)
- State cookie has 10-minute TTL
- Rate limited at `sensitive` tier (3 req/min) for initiate and unlink
- Auth0 Management API uses M2M credentials with `read:users` and `update:users` scopes only
- Unlink blocked if only one linked account remains (prevents lockout)

---

### Code Patterns

#### Server Component (getting session)

```ts
import { auth0 } from "@/lib/auth0";

const session = await auth0.getSession();
if (!session?.user) redirect("/auth/login");
const userId = session.user.sub;
```

#### Server Action (authenticated)

```ts
"use server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

export async function myAction() {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.sub;
  // ...
}
```

#### Client Component (check auth state)

```ts
"use client";
import { useUser } from "@auth0/nextjs-auth0/client";

function MyComponent() {
  const { user } = useUser();
  const isSignedIn = !!user;
  // ...
}
```

#### API Route (authenticated)

```ts
import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

---

### Webhook Handlers

| Route | Trigger | Purpose |
|---|---|---|
| `POST /api/webhooks/auth0` | Auth0 Post-Login Action | Sync user to Supabase profiles |
| `POST /api/webhooks/proxy` | External services | Forwards events to Slack/Discord |
| `POST /api/webhooks/opencollective` | Open Collective | Bounty payout events |

---

### Session Details

- **Auth0 session cookie**: HttpOnly, secure, same-site
- **Session data**: `user.sub` is the Auth0 user ID (`auth0|...`) — used as the foreign key to `profiles.auth0_user_id`
- **No Supabase Auth sessions**: Supabase is accessed via the service role key for writes and the anon key for reads

---

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Unknown client" error | Client ID doesn't match any Auth0 Application | Create new Application, get fresh Client ID and Secret |
| "redirect_uri_mismatch" | Callback URL in Auth0 doesn't match | Check: should be `/auth/callback` not `/api/auth/callback` |
| Login succeeds, redirects in a loop | Post-Login Action not firing → no profile created | Check Actions → Flows → Login — is the action applied? |
| Profile page shows "Unauthorized" | No Supabase profile for Auth0 user | Check webhook logs in Auth0 |
| Local login redirects to production | `AUTH0_BASE_URL` is set to production URL | Set to `http://localhost:3000` for local dev |

---

## Security Architecture — Butwal Hacks

> **Audience:** Engineering maintainers and contributors.
> **Purpose:** Document the security model, trust boundaries, and operational practices so every contributor can make safe decisions.
> **Last updated:** July 11, 2026

---

### Table of Contents

1. [Overview & Threat Model](#1-overview--threat-model)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [API Security](#3-api-security)
4. [Database Security](#4-database-security)
5. [Rate Limiting](#5-rate-limiting)
6. [Input Validation](#6-input-validation)
7. [Webhook Security](#7-webhook-security)
8. [CI/CD Security](#8-cicd-security)
9. [Secrets Management](#9-secrets-management)
10. [CORS & Content Security](#10-cors--content-security)
11. [Incident Response](#11-incident-response)
12. [Security Checklist for PRs](#12-security-checklist-for-prs)

---

### 1. Overview & Threat Model

The full threat model is maintained below in the [Threat Model](#threat-model-butwal-hacks) section. This section covers the **implemented security controls** — what exists today, how it works, and how to maintain it.

#### Trust Boundaries

```
Internet ──→ Vercel Edge ──→ Vercel Serverless ──→ Supabase (PostgreSQL)
                │                                              │
                ↓                                              ↓
           Auth0 SDK                                    Auth0 Webhook
           (session)                                    (profile sync)
```

| Boundary | Protection | Mechanism |
|----------|-----------|-----------|
| User → Vercel | Rate limiting, CSP | `lib/rate-limiter.ts`, `next.config.ts` CSP headers |
| Vercel → Supabase | Service role key (server-side only) | `createServiceClient()` in `utils/supabase.ts` |
| Auth0 → Vercel | Webhook secret verification | `X-Webhook-Secret` header check in `api/webhooks/auth0/route.ts` |
| Client → Supabase (anon) | RLS disabled, anon key with limited scope | Supabase configured with RLS disabled, service role for writes |

> **Key decision:** Supabase Auth is disabled. All authentication flows through Auth0. Supabase is used as a database only, accessed via the service role key for writes and the anon key for public reads.

---

### 2. Authentication & Authorization

#### 2.1 Auth Provider

- **Provider:** Auth0 (Regular Web Application)
- **SDK:** `@auth0/nextjs-auth0` v4
- **Config:** `src/lib/auth0.ts` — single `Auth0Client` instance
- **Management API:** `src/lib/auth0-management.ts` — M2M client for identity linking/unlinking

#### 2.2 Auth Flow

```
User → /auth/login → Auth0 Hosted Login → /auth/callback → session cookie set
                                                              ↓
                                                  Auth0 Post-Login Action
                                                              ↓
                                                POST /api/webhooks/auth0
                                                              ↓
                                              Supabase profiles table
```

Auth routes are handled by **middleware** in `src/proxy.ts`, NOT by route handlers. The proxy intercepts `/auth/*` paths before they reach any page/API route.

#### 2.3 Middleware Protection

```typescript
// src/proxy.ts — Auth0 middleware handles all auth routes
if (pathname.startsWith("/auth/")) {
  return auth0.middleware(request);
}
```

The middleware also protects `/portal/*` routes (sponsor/recruiter access):

```typescript
if (pathname.startsWith("/portal/")) {
  return auth0.middleware(request);
}
```

#### 2.4 Server-Side Auth Patterns

**Server Component / Server Action (preferred):**
```typescript
import { auth0 } from "@/lib/auth0";

const session = await auth0.getSession();
if (!session?.user) redirect("/auth/login");
const userId = session.user.sub;  // "auth0|..."
```

**API Route (returns JSON error):**
```typescript
import { auth0 } from "@/lib/auth0";

const session = await auth0.getSession();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Using the service-role Supabase client with an Auth0 session check:**
```typescript
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

const session = await auth0.getSession();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const supabase = createServiceClient();
```

#### 2.5 Role-Based Access Control (RBAC)

Three roles stored in `profiles.role`:

| Role | Slug | Access |
|------|------|--------|
| Hacker | `hacker` | Own profile, projects, teams, event registration |
| Organizer | `organizer` | Event management, marker issuance, check-in |
| Maintainer | `maintainer` | User management, trust override, audit log, site config |

Role checks happen at the layout level:

```typescript
// src/app/(main)/dashboard/organizer/layout.tsx
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("auth0_user_id", userId)
  .single();

if (profile?.role && profile.role !== "organizer") {
  redirect(`/dashboard/${profile.role}`);
}
```

#### 2.6 User ID Model

- **Auth0 ID format:** `auth0|{uuid}` — stored in `profiles.auth0_user_id`
- **Public ID:** `BH-YY-NNN` (e.g., `BH-26-001`) — stored in `profiles.bh_id` and `profiles.slug_id`
- **UUID (internal):** `profiles.id` — primary key, used for FK relationships in Supabase

> ⚠️ **Common pitfall:** Most tables use `profile_id` (UUID FK), NOT `auth0_user_id`. Server-side actions must resolve `auth0_user_id` → UUID before inserting/querying related tables. This is documented across the codebase in 17+ `ponytail:` comments.

#### 2.7 Account Linking (Auth0 Identity Linking)

Users can link multiple Auth0 identities (GitHub, LinkedIn, Google) to their primary account. This is handled server-side via the Auth0 Management API v2.

##### Flow

1. User clicks "Connect GitHub" on the profile page
2. `POST /api/auth/link/initiate` generates a state cookie (random nonce + primary user ID + provider) and returns an Auth0 authorization URL
3. User authenticates with the secondary provider (GitHub OAuth)
4. Auth0 redirects to `GET /api/auth/link/callback?code=...&state=...`
5. The callback verifies the state cookie (CSRF protection), exchanges the auth code for tokens, and calls the Auth0 Management API to link the identities
6. The linked account is stored in `profiles.linked_accounts` (JSONB) and the social URL is auto-populated in `profiles.socials` if the field was empty

##### Security Controls

| Control | Mechanism | File |
|---------|-----------|------|
| CSRF protection | State cookie (httpOnly, 10-min TTL, nonce verification) | `initiate/route.ts`, `callback/route.ts` |
| Rate limiting | `sensitive` tier (3 req/min) for initiate and unlink | `initiate/route.ts`, `unlink/route.ts` |
| Auth0 M2M auth | Client Credentials flow, token cached with 23h refresh | `auth0-management.ts` |
| Scope restriction | M2M app scoped to `read:users` and `update:users` only | Auth0 Dashboard |
| Lockout prevention | Unlink blocked if only 1 linked account remains | `unlink/route.ts` |
| Graceful degradation | Falls back to Supabase cache if Management API unavailable | `status/route.ts` |

##### Management API Token

The M2M token is cached in memory (`lib/auth0-management.ts`) and refreshed 1 hour before expiry. In serverless environments, the cache resets per invocation, so each function call fetches a fresh token. This is acceptable because the Management API is only called on explicit user actions (linking/unlinking), not on every page load.

##### Data Storage

- **Auth0 Management API:** Authoritative source. Linked identities are managed via `POST /api/v2/users/{id}/identities` and `DELETE /api/v2/users/{id}/identities/{provider}/{id}`.
- **Supabase `profiles.linked_accounts` (JSONB):** Cached copy for fast reads when Management API is unavailable. Synced on every link/unlink operation and periodically by the status endpoint.
- **Supabase `profiles.socials` (JSONB):** Auto-populated with GitHub/LinkedIn URLs when linking, only if the field was previously empty.

---

### 3. API Security

#### 3.1 Authentication Enforcement

All mutation endpoints require authentication:

1. **`auth0.getSession()`** — returns session or `null`; check `session?.user` and return 401 if missing (used in most routes)
2. **`createServiceClient()`** — service-role Supabase client for all writes after the session check

#### 3.2 Rate Limiting

Every mutation API route is wrapped with `withRateLimit()`. See §5.

#### 3.3 Payload Size Limits

Every POST/PUT route calls `rejectOversized(request)` before parsing the body:

```typescript
const oversized = rejectOversized(request); if (oversized) return oversized  // Rejects > 1 MB
```

**Current coverage:** 13 API routes. See `lib/validation.ts` for the implementation.

> ⚠️ **Known ceiling:** `rejectOversized()` checks `Content-Length` header, which does not protect against chunked transfer encoding. Vercel edge infrastructure typically buffes and provides content-length in that case, but this is a documented risk.

#### 3.4 Timeout Guards

All external API calls include timeouts:

| Endpoint | Timeout | Rationale |
|----------|---------|-----------|
| User-facing forms (contact, sponsor) | 5s | Slow email shouldn't block user |
| AI inference (chat, pitch, summary) | 20-30s | LLM inference takes longer |
| AI vision (certificate scanner) | 30s | Image processing is slower |
| GitHub API sync | 15s | GitHub can be slow for many repos |
| Background notification email | 10s | Generous window for Resend + HTML |

---

### 4. Database Security

#### 4.1 Supabase Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Supabase Auth** | Disabled | Auth0 handles all authentication |
| **RLS** | Disabled | Service role key bypasses RLS; no anonymous writes |
| **Public anon key** | Used for public reads only | Publishable key, scoped to `public` schema |
| **Service role key** | Server-side only | Never sent to client, stored in env vars |

#### 4.2 Supabase Clients

| Client | File | When to use |
|--------|------|-------------|
| `createServerClient()` | `utils/supabase.ts` | Public reads (anon key) |
| `createServiceClient()` | `utils/supabase.ts` | All writes, admin reads (service role key) |
| `createClient()` (browser) | `utils/supabase.ts` | Public reads from client components |

#### 4.3 No Raw SQL

The codebase uses the Supabase JS SDK exclusively. No raw SQL queries are constructed from user input. Zod schemas validate all input before it reaches Supabase query methods.

#### 4.4 Column-Level Security

The service role key has full access to all tables. The anon key is restricted by Supabase project settings. No table-level or row-level security is configured — RBAC is enforced at the application layer.

---

### 5. Rate Limiting

#### 5.1 Infrastructure

- **Provider:** Upstash Redis (serverless)
- **SDK:** `@upstash/ratelimit`
- **Pattern:** Sliding window, per-IP
- **Wrapper:** `withRateLimit(handler, tier)` in `lib/rate-limiter.ts`

#### 5.2 Tiers

| Tier | Rate | Used by | Rationale |
|------|------|---------|-----------|
| `public_form` | 5 req/min | Contact form, sponsor inquiries | Public forms, low abuse risk |
| `sensitive` | 3 req/min | Issue marker, projects, reviews, GitHub sync, certificate extraction, AI pitch | Powerful operations, cost-sensitive AI calls |
| `user_action` | 5 req/min | Event registration, check-in, team ops, profile completion | Standard authenticated actions |
| `frequent` | 10 req/min | Profile updates, likes, AI chat, Cloudinary signatures, resource completion | Higher-frequency user interactions |
| `bulk` | 30 req/min | Auth0 webhook, webhook proxy | External services send bursts |

#### 5.3 Graceful Degradation

When Upstash Redis is unreachable (or `UPSTASH_REDIS_REST_URL` is not set), rate limiting is silently skipped:

```typescript
if (!redis) {
  return { allowed: true, remaining: 999, reset: 0 };  // No limit in dev
}
```

> ⚠️ In production, a missing env var means no rate limiting — and no alert. Monitor `UPSTASH_REDIS_REST_URL` in Vercel dashboard.

#### 5.4 Coverage

**19 mutation endpoints** are rate-limited. See [`lib/rate-limiter.ts`](../my-app/src/lib/rate-limiter.ts) for the full list.

**Not rate-limited:** GET endpoints (read-only), cron jobs (authenticated via cron secret).

---

### 6. Input Validation

#### 6.1 Zod Schemas

All mutation endpoints use Zod schemas before processing data. The schemas:

1. **Validate types** — reject non-string inputs, malformed UUIDs, invalid emails
2. **Transform values** — strip HTML, trim whitespace, clamp lengths
3. **Sanitize output** — prevent XSS via stripped HTML tags

#### 6.2 Validation Library

Located at `lib/validation.ts`:

| Function | Purpose | Limits |
|----------|---------|--------|
| `sanitizeString()` | Strip HTML tags, control chars | Max 5000 chars |
| `sanitizeName()` | Person/organization names | Max 100 chars |
| `sanitizeTitle()` | Event/project titles | Max 200 chars |
| `sanitizeDescription()` | Long-form text | Max 2000 chars |
| `sanitizeEmail()` | Email validation | Max 254 chars |
| `sanitizeUrl()` | URL validation | HTTPS only, max 2048 chars |
| `sanitizeUuid()` | UUID format validation | Rejects non-UUID strings |
| `validateSearchInput()` | Search query validation | Max 100 chars, alphanumeric only |
| `rejectOversized()` | Body size guard | Default 1 MB |

#### 6.3 GET Query Params

Added July 2026 — Zod schemas now validate query parameters on GET endpoints:

| Endpoint | Schema | Params |
|----------|--------|--------|
| `events` | `PaginationSchema` | `limit` (1-200), `offset` (>=0) |
| `notifications` | `PaginationSchema` | Same |
| `organizer/metrics` | `PaginationSchema` | Same |
| `badges/check` | `PaginationSchema` | Same |
| `certificates` | `PaginationSchema` | Same |
| `admin/annual-report` | Year schema | `year` (2020-2099) |

The `PaginationSchema` in `lib/pagination.ts` uses `z.string().optional().transform()` to convert and clamp pagination values, preventing type coercion attacks.

#### 6.4 Search Input

The blog search endpoint validates input via `validateSearchInput()` before passing to Supabase:

```typescript
const validation = validateSearchInput(rawValue);
if (!validation.valid) {
  // Return error — don't pass to Supabase
}
```

---

### 7. Webhook Security

#### 7.1 Auth0 Webhook (`/api/webhooks/auth0`)

| Property | Implementation |
|----------|---------------|
| **Trigger** | Auth0 Post-Login Action |
| **Secret verification** | `X-Webhook-Secret` header compared to `AUTH0_WEBHOOK_SECRET` env var |
| **Body size check** | Rejects > 1 MB before parsing |
| **Outcome** | Creates/updates Supabase profile |

**Note:** Webhook secret verification is only enforced in production (when `AUTH0_WEBHOOK_SECRET` is set). In dev, the check is skipped.

#### 7.2 Open Collective Webhook (`/api/webhooks/opencollective`)

> ⚠️ **Known ceiling:** No webhook signature verification on the Open Collective endpoint. Signature verification is only available on Open Collective Enterprise. The endpoint relies on the obscurity of the webhook URL.

#### 7.3 Webhook Proxy (`/api/webhooks/proxy`)

Forwards events to Slack/Discord webhook URLs. Protected by authentication (requires `maintainer` or `organizer` role). No retry mechanism — best-effort delivery only.

#### 7.4 Webhook Security Rules

1. **Every webhook must have a body size check** — `rejectOversized()` before `req.json()`
2. **Secrets in environment variables** — not in code or database
3. **Log the source** — every webhook handler logs the event type and source
4. **Fail closed** — if verification fails, return 401, not 200

---

### 8. CI/CD Security

#### 8.1 CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs these security checks on every PR:

| Job | What it checks | Fails on |
|-----|---------------|----------|
| `secrets-audit` | Leaked API keys, credentials, private keys in tracked files | Critical findings |
| `ponytail-audit` | Dead code, unused deps, empty directories | N/A (informational) |
| `ai-review` | Architecture, security vulnerabilities, business logic | Critical findings |
| `auth0-m2m-verify` | Auth0 Management API access token validity | Auth failure |

#### 8.2 Secrets Audit

Located at `.github/actions/secrets-audit/audit.mjs`. Scans all tracked files for:

- Supabase publishable/service role keys
- Anthropic, OpenAI, Stripe API keys
- GitHub personal access tokens
- Private key material (RSA, EC, DSA)
- Resend API keys
- Auth0 secret keys

Patterns distinguish real keys from placeholders (`YOUR_KEY`, `sk_test_...`).

#### 8.3 Ponytail Audit (Dead Code)

Located at `.github/actions/ponytail-audit/audit.mjs`. Runs static analysis for:

- **Unused files** — files in `src/` not imported by any other file
- **Empty directories** — empty folders in the source tree
- **Unused dependencies** — packages in `package.json` never imported
- **Dead exports** — exported functions never imported elsewhere

Uses regex-based import scanning with 0 dependencies beyond Node.js stdlib. Understands Next.js file-based routing (skips `page.tsx`, `layout.tsx`, `route.ts`, etc.).

---

### 9. Secrets Management

#### 9.1 Environment Variables

All secrets are stored in Vercel Environment Variables (production, preview, development). Locally, they live in `.env.local` (gitignored).

| Category | Variables | Sensitivity |
|----------|-----------|-------------|
| **Auth0** | `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_WEBHOOK_SECRET`, `AUTH0_MGMT_CLIENT_ID`, `AUTH0_MGMT_CLIENT_SECRET` | 🔴 Critical |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | 🔴 Critical (service key) |
| **Upstash** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 🟠 High |
| **Cloudinary** | `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | 🟠 High |
| **Resend** | `RESEND_API_KEY` | 🟠 High |
| **Groq** | `GROQ_API_KEY` | 🟠 High |
| **PostHog** | `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `POSTHOG_API_KEY` | 🟡 Medium |
| **Sentry** | `SENTRY_DSN` | 🟡 Medium |

#### 9.2 What NOT to do

- ❌ Hardcode secrets in source code (caught by `secrets-audit`)
- ❌ Commit `.env.local` to git (it's in `.gitignore`)
- ❌ Log secrets (the `logger` redacts sensitive fields)
- ❌ Pass secrets to client components (caught by Next.js compiler)

#### 9.3 Key Rotation

If a secret is exposed:
1. **Immediately** rotate the key at the provider's dashboard
2. **Update** the Vercel environment variable
3. **Check** `secrets-audit` CI logs to confirm the leak is cleaned
4. **Document** the incident in the threat model inventory

---

### 10. CORS & Content Security

#### 10.1 CORS Headers

CORS is set on a per-route basis for public API endpoints:

| Endpoint | `Access-Control-Allow-Origin` | Notes |
|----------|------------------------------|-------|
| `/api/v1/profile/:slugId` | `*` | Public REST API |
| `/api/verify/:bhId/embed` | `*` | Legacy embeddable widget (superseded by `/widget/:slugId`) |
| `/api/badges/assertions/:markerId` | `*` | OB3 assertion |
| `/api/badges/issuer` | `*` | OB3 issuer profile |

Internal API routes do not set CORS headers — they're only called from the same origin.

#### 10.2 Content Security Policy

Defined in `next.config.ts`. Key directives:

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Blocks all unexpected origins |
| `script-src` | `'self'` + GA4 + Auth0 + `'unsafe-inline'` | Allows Next.js hydration, analytics |
| `connect-src` | `'self'` + Vercel + GA | API calls, analytics |
| `frame-ancestors` | `'none'` | Prevents clickjacking |
| `upgrade-insecure-requests` | present | Forces HTTPS |

> ⚠️ **Maintenance:** Every time a new external service is added, the CSP must be updated. The AI agent is likely to forget this step — it's on the PR checklist.

#### 10.3 No iframe Embedding

`frame-ancestors: 'none'` prevents the site from being embedded in iframes on other domains. This is intentional — clickjacking protection takes priority over embedding compatibility.

The `/widget/:slugId` endpoint provides an embeddable version of the profile card, served as a standalone page with its own minimal layout.

---

### 11. Incident Response

#### 11.1 Logging

- **Production:** Console logging; server-side errors captured by Sentry (`@sentry/nextjs`)
- **Development:** Same `console.*` methods
- **Analytics:** PostHog for user-facing events (`lib/analytics/server.ts`)
- **Catch-all:** Vercel platform logs via `@vercel/speed-insights` / Vercel dashboard

#### 11.2 What to Log (and what not to)

**DO log:**
- Authentication failures (401/403 responses)
- Rate limit hits (429 responses)
- Webhook errors
- Failed input validation (400 responses)
- Internal server errors (500 responses — message only, not stack traces)

**DON'T log:**
- User passwords (never stored)
- Auth tokens or API keys
- Full request bodies that may contain PII
- Supabase service role key (never log this)

#### 11.3 Error Response Pattern

Every API route follows this pattern:

```typescript
try {
  // ... handler logic ...
} catch (err) {
  logger.error("[route-name] Error:", err);  // Console; Sentry captures server errors
  posthogLog.error("Route failed", {          // Logs to PostHog
    error: err instanceof Error ? err.message : String(err),
  });
  return NextResponse.json({ error: "Internal error" }, { status: 500 });  // Generic message
}
```

Error responses never leak:
- Stack traces
- Internal implementation details
- Data from other users
- Environment variable names

#### 11.4 Alerting

> ⚠️ **Not yet implemented.** There are no alerting thresholds configured. Production errors are visible in Sentry but no automated alerts fire.

---

### 12. Security Checklist for PRs

Every PR should pass this checklist before merging:

#### Authentication & Authorization

- [ ] New API route checks auth (`auth0.getSession()`)
- [ ] New page redirects unauthenticated users (`redirect("/auth/login")`)
- [ ] Role check enforced at layout level (not just individual page)
- [ ] User ID correctly resolved (`auth0_user_id` → UUID) for FK operations

#### Input Validation

- [ ] POST body validated with Zod schema (not just `request.json()`)
- [ ] Query parameters validated with Zod (or `parsePagination()` for pagination)
- [ ] `rejectOversized()` called before body parsing
- [ ] Supabase queries use `.eq()`, `.in()` etc. — NOT raw string concatenation

#### Rate Limiting

- [ ] New mutation endpoint wrapped with `withRateLimit(handler, "tier")`
- [ ] Chose the correct tier (see §5.2)
- [ ] No rate limiting on GET endpoints (unless they're expensive/costly)

#### External Dependencies

- [ ] External API calls have timeouts (`AbortSignal.timeout()`)
- [ ] CSP directives updated for new external origins
- [ ] Webhook handlers have body size checks and optional signature verification

#### Secrets

- [ ] No secrets hardcoded in source code
- [ ] New secrets added to `.env.example` and Vercel dashboard
- [ ] New secrets added to CI workflow if needed by tests

#### Logging

- [ ] Error handlers log the error before returning
- [ ] Error responses don't leak internal details
- [ ] Sensitive data is not logged

---

### References

| Document | Location | Covers |
|----------|----------|--------|
| Threat Model | See [Threat Model](#threat-model-butwal-hacks) in this document | Full threat inventory, attack vectors |
| Authentication Setup | See [Authentication](#authentication-butwal-hacks) in this document | Auth0 configuration, setup steps |
| CI/CD | `.github/workflows/ci.yml` | Automated security checks |
| Secrets Audit | `.github/actions/secrets-audit/audit.mjs` | Leaked credential detection script |
| Ponytail Audit | `.github/actions/ponytail-audit/audit.mjs` | Dead code detection script |
| Platform Constraints | See [Platform Constraint Checklist](#platform-constraint-checklist-butwal-hacks) in this document | Vercel, Supabase, Upstash limits |

---

## Threat Model - Butwal Hacks

This document catalogs failure modes, trust boundaries, and constraint ceilings that an AI-assisted development process is most likely to overlook. Read this before deploying any change that touches API routes, authentication, external integrations, or security boundaries.

### Theme 1: The Vibe-Coding Paradigm

**Core insight:** AI agents optimize for visible output over invisible rigor. The code will look right before it *is* right.

#### Surface - What the AI gets right

The AI generates functional routes, components, and queries quickly. It handles the "happy path" well - the user fills a form, data is saved, a page renders.

**Current project posture:**
- 51 API route files exist, each with a clear singular purpose.
- Zod schemas validate inputs in most mutation routes.
- Rate limiting is applied to all 16 mutation routes (POST/PATCH/DELETE) via `withRateLimit` wrapper. GET routes (35) are not rate-limited.

#### What the AI misses by default

AI defaults to assuming the world cooperates. The threat is in what doesn't happen:

| Missing pattern | Manifestation in this project |
|----------------|------------------------------|
| Failed dependency fallback | ✅ **FIXED** - structured logger with console fallback; Sentry captures server errors. See T-001. |
| Partial failure state | A webhook call to Resend fails - the contact route returns 500 but no compensating action is taken |
| Auth edge cases | `auth-guard.ts` calls `redirect()` instead of returning a `401` - the client gets an unexpected navigation, not an error response |
| Transactional consistency | The BH-ID generation (webhook handler) has a documented race condition: "read-then-increment has a race condition window. Two simultaneous webhook calls could generate the same BH-ID" |

#### Deep - The erosion of foundational engineering rigor

| Rigor | AI-orchestrated default | Required for production |
|-------|------------------------|------------------------|
| **Logging** | ✅ **FIXED** - structured logger; Sentry captures server errors | Structured, level-aware, routed to a log sink |
| **Alerting** | None generated by AI | Error-rate thresholds, p99 latency, failed auth spikes |
| **Runbooks** | None | How to recover each failure mode |
| **Observability** | Status 200/500 dichotomy | Distributed traces, span IDs, correlation to webhook events |

**Resolved in `lib/logger.ts`:**
The logger provides `logger.error/warn/info` with optional `withErrorId()` correlation. Logs to console in all environments; server-side errors are captured by Sentry. No change needed at call sites.

#### Edge Case - The architectural blind spot

> An application that passes all AI-driven audits and functional tests but possesses a non-obvious flaw
> that only triggers during a specific, rare condition at scale.

**Concrete example in this project:**
The Auth0 webhook handler processes `user.created` events by:
1. Reading the highest existing `slug_id` → computing `nextNum`
2. Inserting a new profile with `BH-YY-NNN`

If two users sign up simultaneously (e.g. during an event registration wave), both webhook calls read the
same `maxRow`, compute the same `nextNum`, and one hits a `UNIQUE` constraint violation on `slug_id`.

**Impact:** User profile creation fails silently (the `500` is returned to Auth0, which retries, but the
retry may also fail if the second call succeeded in the meantime - the BH-ID sequence is now corrupt).

**Mitigation:** Use `pg_try_advisory_xact_lock` or a database sequence for BH-ID generation.

#### Synthesis

*Vibe-coding is a shift from Construction to Curation. The engineer is no longer the writer,
but the Auditor-in-Chief. The primary skill is the ability to envision and prompt for the "unhappy path."*

**Checklist for every AI-generated feature:**
- [ ] What happens when every external dependency (Supabase, Auth0, Resend, Upstash) is unreachable?
- [ ] What happens when two users perform the same action at the same microsecond?
- [ ] Is there a compensating action for every partial failure?
- [ ] Can the error be observed in production? (Is the logger actually active?)
- [ ] Are there runbook steps documented for the failure mode?

---

### Theme 2: Defensive Application Architecture

The gap between "it works" and "it is production-ready" is measured in handled edge cases.

#### Surface - Basic error messages

Every API route returns a JSON error object. Every page has an `error.tsx` boundary.

**Current posture:** Routes follow a `try → catch → logger.error → 500` pattern. This is the minimum viable error handling.

#### Platform ceiling alignment

The project deploys on Vercel (serverless) with Supabase (PostgreSQL). Each platform enforces hard limits
that AI-generated code rarely respects.

| Ceiling | Limit | Where it bites |
|---------|-------|----------------|
| **Vercel body size** | 4.5 MB (free), 5 MB (pro) on serverless functions | File uploads via Cloudinary must pre-sign, not proxy through the API. Current `/api/cloudinary-signature` handles this correctly. |
| **Vercel execution timeout** | 10s (hobby), 60s (pro), 900s (enterprise) | Webhook handlers processing many users (e.g. bulk import) could timeout. Current auth0 webhook is per-event, which is safe. |
| **Supabase connection pool** | 15 connections (free), 30+ (pro) | `supabase-js` talks to PostgREST over HTTP (not direct DB connections), so pooling pressure is lower than the raw numbers suggest. Use `createServiceClient()` for writes and cache clients where possible. |
| **Upstash rate limiter** | 10,000 commands/day (free) | At 5 req/60s per IP with the `contact` route, a DDoS from 1000 IPs would exhaust daily quota in ~3 minutes. Rate limit is per-IP; no global circuit breaker. |
| **Vercel edge function count** | 12 (hobby), 50 (pro) | Current: 0 edge functions. All 27 API routes run as serverless functions. If we migrate any to Edge, we must respect the 1 MB code size limit. |

#### Graceful degradation strategy

A "graceful degradation" strategy answers: *If dependency X is down, what can the app still do?*

| Dependency | If down | Current behavior | Ideal behavior |
|-----------|---------|-----------------|----------------|
| **Supabase** | All DB-dependent pages crash | `error.tsx` shows a generic error page | Read from a stale cache (ISR'd pages, local SWR) |
| **Auth0** | Sign-in/sign-up fail | Auth0 SDK throws, page shows 500 | Show a "Sign-in temporarily unavailable - try again in a few minutes" banner |
| **Resend (email)** | Contact form fails to send | Route returns 500 | Queue the message and retry (or fall back to stored log) |
| **Upstash Redis** | Rate limiter disabled | `limiter` is `null`, rate limiting skipped silently | Log a warning that rate limiting is disabled |

**Current codebase comment in `lib/rate-limiter.ts`:**
`// Skips rate limiting when UPSTASH_REDIS_REST_URL is not configured (local dev).`
This same behavior applies silently in production if the env var is missing. No alert is fired.

#### Edge Case - Infrastructure-level attack

> A payload that bypasses the application layer and crashes the infrastructure at the platform level.

**Zip bomb / massive payload attack vector:**
The Auth0 webhook endpoint accepts POST with Auth0 token verification. The handler checks
`content-length` before calling `req.json()` - requests over 1 MB are rejected with 413. See T-009.

#### Synthesis

*Production-readiness is the art of managing constraints. A "win" is not when the feature works,
but when the failure is predictable, communicated, and recoverable.*

**Platform Constraint Checklist (attach to every deployment):**
- [ ] All external API calls have timeouts (< 5s for user-facing, < 25s for webhooks)
- [ ] Body size is validated before parsing (reject > 1 MB on API routes, > 10 KB on mutation routes)
- [x] Rate limiting applied to 16 mutation routes (POST/PATCH/DELETE). GET routes (35) are not rate-limited.
- [ ] Supabase clients are reused/cached where possible to avoid pool pressure
- [x] Production logging is configured - structured logger + Sentry capture server errors.
- [ ] Graceful degradation path exists for each critical dependency

---

### Theme 3: Ecosystem Trust & Compliance Layer

External trust boundaries (law, browser, supply chain) are invisible to AI agents
but can kill even a perfectly-coded application.

#### Visibility compliance

**Current posture:**
- Privacy policy and cookie consent are part of the legal document layout (`legal-document-layout.tsx`)
- `robots.ts` and `sitemap.ts` exist at app root
- `manifest.ts` provides PWA manifest

#### Browser as security proxy

The project's CSP (`next.config.ts`, lines 14–53) is the primary browser-level defense.

| Directive | Current value | Risk if wrong |
|-----------|--------------|---------------|
| `default-src` | `'self'` | Blocks all unexpected origins - good baseline |
| `script-src` | `'self'` + GA4 + Auth0 + `'unsafe-inline'` | `'unsafe-inline'` weakens XSS protection - required for Next.js hydration |
| `connect-src` | `'self'` + Vercel + GA | Missing Supabase Realtime or Cloudinary upload endpoints could silently fail |
| `frame-ancestors` | `'none'` | Prevents clickjacking - correct |
| `upgrade-insecure-requests` | present | Forces HTTPS - good |

**Threat:** Every time a new external service is integrated (analytics, CDN, AI API), a developer must
update the CSP. AI agents are likely to forget this step. The app will load but the service will silently
fail in the browser.

**Mitigation:** When adding a new external origin, update both `images.remotePatterns` in `next.config.ts`
and the CSP `img-src` / `connect-src` directives together.

#### Supply chain trust

The project uses:
- **AI agents** (Codebuff, Claude) that can pull in community skills via `npx skills add`
- **22 npm dependencies** (see `my-app/package.json`) - each updated independently
- **Supabase migrations** - 66 migration files, each altering the schema

**Threat vectors:**

| Vector | Scenario | Impact |
|--------|----------|--------|
| **Skill injection** | A community skill (`npx skills add`) contains a postinstall script that exfiltrates `.env` | Full credential theft (Auth0 secret key, Supabase service role key) |
| **Dependency confusion** | A malicious npm package with a similar name to an internal one | Code execution during build |
| **Migration poisoning** | A third-party PR introduces a migration that enables `cron` or `extension` without review | Unauthorized DB access |
| **Webhook hijacking** | If the Svix signing secret leaks, an attacker can forge webhook events | Create fake users, modify organizations |

**Current posture:** `npm audit` runs in CI on every PR (the `security-audit` job in `.github/workflows/ci.yml`). Dependabot is not active (the `dependabot.yml` was deleted as it was empty) and there is no SBOM generation.

#### Edge Case - Legal-technical collision

*An accessibility requirement (ADA) conflicts with a specific security header or UI taste choice.*

**Concrete example:**
- **CSP `frame-ancestors: 'none'`** prevents embedding the site in iframes.
- **ADA accessibility requirement:** Some screen-reader tools and accessibility overlays require iframe embedding.
- **Result:** A compliance auditor flags the site for inaccessible embedded content. Fixing it means loosening
  a security header, creating a clickjacking risk.

**Resolution:** Keep `frame-ancestors: 'none'` (clickjacking > overlay compatibility). Accessibility must
be achieved through native HTML semantics, not third-party overlays that require iframes.

#### Synthesis

*The browser and the law are the invisible guardrails of the web. Ignoring them doesn't just risk a bug;
it risks the existence of the business.*

**Compliance trust checklist for every new integration:**
- [ ] Does the new dependency have a known supply chain risk? (Check Snyk Advisor, npm audit score)
- [ ] Are the required CSP directives updated in `next.config.ts`?
- [ ] Does the service handle Nepali user data? (DPA required if processing personal data)
- [ ] Is the service GDPR-compliant? (Necessary even for Nepal-based operations if serving EU users)
- [ ] Can the service be removed without data loss? (Avoid vendor lock-in for core infrastructure)
- [ ] Is a debt marker left documenting the trade-off?

---

**Theme 4: The Taste Gap & Protocol Nuance**

**Core insight:** High-quality software is the intersection of Aesthetic Taste (frontend) and Protocol
Precision (backend). One attracts the user; the other keeps the system stable.

#### Visual polish

**Current posture:**
The project's visual blueprint is extensively documented in `AGENTS.md` (§3 Design System).
The "Taste Gap" is the delta between an AI-generated component and one that follows those guidelines.

| AI slop indicator | Project standard | Threat |
|-------------------|-----------------|--------|
| Generic Lucide icon repeated | Icon-led sections with semantic icons | User perceives low-effort, bounces |
| No whitespace / no section rhythm | `py-20 md:py-32`, alternating splits | Visual fatigue, reduced scannability |
| Static card without hover state | `shadow-sm hover:shadow-md`, rounded-2xl | Perceived as non-interactive, low trust |
| Rectangular stock images | Circular photo crops, overlapping organic shapes | Feels templated, not curated |

#### Protocol precision

The "Protocol Nuance" gap is where AI-generated backends most commonly fail.

| Protocol concept | AI default | Production requirement | Applied in this project? |
|-----------------|-----------|----------------------|--------------------------|
| **HTTP method semantics** | Everything uses POST | GET for reads, POST for mutations, PUT for full updates, PATCH for partial updates | ✅ 27 routes follow appropriate methods |
| **Idempotency keys** | Not generated | Required for payment/registration mutations to prevent double-processing | ❌ Not implemented (no payment mutations yet) |
| **Cache headers** | None | `Cache-Control` on GET, `no-store` on mutations | ❌ Not set on any route |
| **Content-Type negotiation** | JSON only | `Accept` header parsing for versioning or alternative formats | ❌ All routes hardcode JSON |
| **Status code granularity** | 200/400/500 | 201 (created), 202 (accepted), 204 (no content), 409 (conflict), 422 (validation), 429 (rate limited) | ⚠️ Partial - 429 exists via rate limiter, but no 201s on creation routes |
| **ETag / conditional requests** | Not generated | `If-None-Match` for caching, `If-Match` for optimistic concurrency | ❌ Not implemented |

#### The QUERY method frontier

**From the spec:** Using the `QUERY` HTTP method to solve the "Large Filter" problem while maintaining
cacheability and idempotency.

The `QUERY` method (RFC 9652) is an emerging standard for sending a query body via a semantically safe
method - solving the "URL too long for GET filters" problem without resorting to POST.

**Current project relevancy:**
- The `/api/organizer/metrics` route filters by date ranges and dimensions - a candidate for `QUERY` if
  the filter payload exceeds URL length limits.
- The `/api/projects` route accepts query parameters for filtering - currently GET with query params.

**Threat:** AI agents learn from codebases that predate RFC 9652. They will naturally generate POST
for filter endpoints, breaking cacheability. The developer must override this default.

#### Edge Case - The "Taste" audit failure

*A page that passes all functional checks but visually signals "AI-generated" to a discerning user.*

**Symptoms of the "AI Slop" signal:**
- Every section has the same component pattern (icon → heading → body → link)
- Avatar/hero images have no alt text or generic `alt="Photo"` 
- Color palette lacks accent dots and organic shapes described in AGENTS.md §3.2
- No scroll reveals (`useInViewOnce` + `.section-fade`) - the page appears in one static block
- JSON-LD is either missing or uses the same template text for every entity

**Mitigation:** A "Taste Audit" script that checks for these signals and flags them. The checklist
in `AGENTS.md` §10 is the specification for this.

#### Synthesis

*Taste is not subjective in the digital world - it is a signal of professionalism and attention to detail.
Protocol precision is the same for the backend. One without the other is incomplete.*

**Taste & Protocol checklist for every new page/route:**
- [ ] Visual: Does it follow AGENTS.md §3 (Layout, Color, Typography)?
- [ ] Visual: Is a scroll reveal applied via `useInViewOnce`?
- [ ] Visual: Are there accent dots or decorative elements near section headings?
- [ ] Protocol: Is the correct HTTP method used (not all POST)?
- [ ] Protocol: Are cache headers set on GET responses?
- [ ] Protocol: Does the response use the most specific status code (not just 200/500)?
- [ ] Protocol: Is there an idempotency key for mutation endpoints?

---

### Appendix: Project-Specific Threat Inventory

This section catalogs known threats specific to the Butwal Hacks codebase, organized by severity.

#### Critical - Immediate attention recommended

| ID | Threat | Location | Current status |
|----|--------|----------|---------------|
| T-001 | Production logging is disabled | `lib/logger.ts` | **FIXED** - Structured logger with `withErrorId`; Sentry captures server errors. |
| T-002 | BH-ID generation race condition | Auth0 webhook handler | Documented - two concurrent signups produce duplicate IDs |
| T-003 | No rate limiting on most API routes | `lib/rate-limiter.ts` | **FIXED** - All 17 mutation endpoints (POST/PATCH/DELETE) use `withRateLimit`. GET routes (23) remain uncovered. |
| T-004 | No input validation on several GET routes | Various `route.ts` files | Query params go directly to Supabase queries without Zod validation |

#### High - Should be addressed this quarter

| ID | Threat | Location | Current status |
|----|--------|----------|---------------|
| T-005 | No idempotency keys on mutation endpoints | All POST routes | Double-submission on registration could create duplicate DB entries |
| T-006 | No cache headers on GET responses | All GET routes | Browser/proxy caching of event listings, projects, profiles is suboptimal |
| T-007 | No production alerting | Entire project | Failures are invisible until a user reports them |
| T-008 | Supply chain scanning disabled | `.github/workflows/` | Partial - `npm audit` runs in CI; Dependabot and SBOM generation are not configured |
| T-009 | Content-Length not checked on webhook endpoint | Auth0 webhook handler | **FIXED** - `content-length` checked before `req.json()`. NaN-guarded.

#### Medium - Worth tracking

| ID | Threat | Location | Current status |
|----|--------|----------|---------------|
| T-010 | API routes return `500` on unexpected errors | All routes | Leaks no details (good), but no structured error correlation ID |
| T-011 | CSP may be missing `connect-src` for future services | `next.config.ts` | Must be updated manually with each new integration |
| T-012 | No `hreflang` tags (en/ne) | `app/layout.tsx` | Bilingual SEO not yet implemented |
| T-013 | JSON-LD is on home page only | `app/page.tsx` | Blog, events, and member pages lack structured data |
| T-014 | No `Cache-Control: no-store` on mutation responses | All POST routes | Proxies could cache 201/409 responses |

#### Low - Nice to have

| ID | Threat | Location | Current status |
|----|--------|----------|---------------|
| T-015 | No graceful degradation for Supabase down | All pages | No stale cache or fallback UI |
| T-016 | No global circuit breaker for Upstash | `lib/rate-limiter.ts` | Rate limit disabled silently if Redis is unreachable |
| T-017 | No production error tracking | `app/error.tsx` | Error pages don't report to any service |
| T-018 | No protocol-level content negotiation | All routes | All responses hardcode `application/json` |

---

### Maintenance

This threat model should be updated when:
- A new external service is integrated (update CSP, add to supply chain audit)
- A new API route is added (check rate limiting, input validation, status codes)
- A new section or page type is added (check JSON-LD, scroll reveals, taste audit)
- A dependency is added or removed (check supply chain, update SBOM)
- A documented shortcut in the codebase is resolved (remove from threat inventory)
- The platform's limits page changes (Vercel, Supabase, Upstash)

**Owner:** Engineering maintainer (whoever merges the most recent PR that touches
security headers, API routes, or external integrations).

---

*This file is the authoritative threat model for the Butwal Hacks AI-assisted development process.
When an AI agent's generated code conflicts with a constraint documented here, this file wins.*

---

## Platform Constraint Checklist - Butwal Hacks

Every hard ceiling, timeout, payload limit, and connection boundary the project must respect.
Read this before deploying any new API route, server action, or external integration.

### 1. Vercel (Serverless Functions)

This project deploys serverless functions via Vercel's Fluid Compute runtime.

| Ceiling | Hobby | Pro / Enterprise | Applies to |
|---------|-------|------------------|------------|
| **Execution timeout** | 300s (5 min) | 800s (13 min), 1800s beta | All 51 API routes + 25 server actions |
| **Request body size** | 4.5 MB | 4.5 MB | All POST/PUT routes |
| **Response body size** | 4.5 MB | 4.5 MB | All GET routes (badges, search, pagination) |
| **Memory per function** | 2 GB / 1 vCPU | 4 GB / 2 vCPU | All functions |
| **Bundle size (uncompressed)** | 250 MB | 250 MB (5 GB beta) | Whole app |
| **Concurrent executions** | 30,000 | 100,000+ | Under load |
| **File descriptors** | 1,024 (shared) | 1,024 (shared) | DB connections, file handles |

#### Current posture

| Item | Status | Notes |
|------|--------|-------|
| Execution timeout set explicitly | ⚠️ Partial | Timeouts set on 7 external API call routes (Resend, Groq, GitHub). Remaining routes use Vercel default 300s. |
| Body size validated before parsing | ✅ All 16 POST routes | `rejectOversized(req)` helper in `validation.ts` rejects > 1 MB payloads with 413 before body parsing. Webhook already had its own check. |
| Response size management | ⚠️ Partial | Badges endpoints set cache headers; others return unbounded arrays. `event_registrations` could exceed 4.5 MB. |
| Memory-sensitive operations | ⚠️ Partial | AI extraction (`/certificates/extract`) sends image URLs to Groq - OK. But Auth0 webhook reads entire body into memory. |


### 2. Supabase (PostgreSQL + API)

| Ceiling | Free | Pro | Applies to |
|---------|------|-----|------------|
| **Direct DB connections** | 60 | 60–500 (scalable) | Server components + API routes + server actions |
| **Connection pooler clients** | 200 | 200–12,000 | PgBouncer via `SUPABASE_URL` with `?pgbouncer=true` |
| **Database size** | 500 MB | 8 GB (scalable to 16+ TB) | All tables + migrations |
| **Rows per query response (default)** | 1,000 | 1,000 | All `.select()` calls without pagination |
| **Max request body size** | ~10 MB | ~10 MB | API requests to Supabase REST API |
| **Edge Function timeout** | 150s | 400s | (Not used - all serverless) |
| **Edge Function CPU execution** | 2s / request | 2s / request | (Not used) |

#### Current posture

| Item | Status | Notes |
|------|--------|-------|
| Connection pooling configured | ❌ Not configured | Both `createClient()` (anon) and `createServiceClient()` (service role) create direct connections. No PgBouncer integration. |
| Connection reuse | ❌ New client per call | Every API route + server action creates a new Supabase client. ~197 call sites across the codebase. |
| Query pagination | ⚠️ Partial | Most GET routes still return unbounded results. Some newer routes implement cursor/offset pagination. |
| Row limits on `.select()` | ❌ Not set | Default 1,000 row limit applies silently. Queries returning >1,000 rows get truncated with no warning. |
| Service role key exposure | ⚠️ Controlled | `createServiceClient()` used only in webhooks and admin actions - correct pattern. |

#### Connection pool pressure estimate

Under concurrent load (e.g., 30 users hitting different API routes simultaneously):
- Each route creates 1–3 Supabase clients (auth check, profile lookup, main query)
- 30 concurrent users × 2 clients = **60 connections** - exhausts free tier's 60 direct connections
- Mitigation: Enable PgBouncer, or cache clients where possible


### 3. Upstash Redis (Rate Limiting)

| Ceiling | Free | Paid | Applies to |
|---------|------|------|------------|
| **Monthly commands** | 500,000 | Unlimited | Rate limiter checks |
| **Max request/response size** | 10 MB | 10–100 MB | Rate limiter payloads |
| **P99 latency SLA** | None | None | Redis read/write |

#### Current posture

| Item | Status | Notes |
|------|--------|-------|
| Rate limiting applied | ✅ All 16 mutation routes | All POST endpoints (14 auth + 2 public + webhook) use `checkRateLimit()`. Only GET routes exempt. |
| Fallback behavior | ⚠️ Silent fallback | If `UPSTASH_REDIS_REST_URL` is not set, `limiter` is `null` and rate limiting is silently skipped - in production and development. |
| Global circuit breaker | ❌ Not implemented | A DDoS from 1,000 IPs would exhaust 500K monthly commands in ~2 minutes. |

#### Rate limit math (free tier)

```
Rate limit: 5 req / 60s per IP
Cost per check: 1 Upstash command
500,000 commands / month ÷ 2 routes = 250,000 checks per route
250,000 checks ÷ 5 req per window = 50,000 windows per route per month

Worst case: 1,000 IPs × 5 requests each = 5,000 checks per 60s window
5,000 checks × 86,400 windows per day = 432M commands - would exhaust free tier in minutes
```

**Conclusion:** The free Upstash tier is sufficient for low-traffic beta but will not survive any DDoS or traffic spike.


### 4. Auth0 (Authentication)

| Ceiling | Free (Developer) | Pro | Notes |
|---------|-----------------|-----|-------|
| **Monthly active users** | 7,000 (free) | Unlimited | Current: < 1,000 |
| **OAuth providers** | 2 social connections (free) | Unlimited | Google configured |
| **Webhook rate limit** | Not documented | Not documented | Auth0 retries failed webhooks |
| **JWT token size** | 4 KB | 4 KB | Standard claims |
| **API rate limit** | 5 req/s (free) | 10 req/s | For Management API calls |

#### Current posture

| Item | Status | Notes |
|------|--------|-------|
| Webhook secret configured | ✅ Auth0 Action | Post-Login Action sends user data to `/api/webhooks/auth0` |
| Auth0 Action configured | ⚠️ Required | Without it, new users won't get a Supabase profile |
| Webhook body size-limited | ✅ `rejectOversized` | All webhook routes check content-length before parsing |
| OAuth token storage | ⚠️ Via session | Auth0 session provides user identity, GitHub tokens stored in Supabase |


### 5. External API Ceilings

#### Resend (Email)
| Ceiling | Free | Pro |
|---------|------|-----|
| Daily email limit | 100/day | 50,000+/month |
| Max attachment size | None (no attachments) | N/A |
| Timeout | ~30s (default fetch) | ~30s |

**Current:** ✅ Timeout applied - 5s on user-facing email (`contact`, `sponsor`), 10s on background email (`issue-marker`).

#### Groq (AI Extraction)
| Ceiling | Free |
|---------|------|
| Rate limit | 30 req/min (concurrent), 7,200 req/day |
| Max tokens | Varies by model (llama-3.2-11b: 8K output) |
| Max image size | 20 MB per image |

**Current:** ✅ 30s timeout set on all Groq calls (`/certificates/extract`, `ai-team-match`, `generate-profile-summary`).

#### GitHub API
| Ceiling | Authenticated |
|---------|--------------|
| Rate limit | 5,000 req/hr |
| Max repos per page | 100 |

**Current:** ✅ 15s timeout set on `/github/sync`. Requests 50 repos per page.

#### Cloudinary (Signature)
| Ceiling | Free |
|---------|------|
| API requests | No documented limit |
| Upload size | 10 MB (default), 25 MB (if configured) |

**Current:** Cloudinary calls are pre-signed (client-side uploads). The `/api/cloudinary-signature` route generates signatures only - no large payloads pass through. **Correct approach.**


### 6. API Route Audit

Snapshot audit of 27 representative routes against: body size limit, timeout control, rate limiting, idempotency, cache headers, input validation, and status code granularity. The platform now has 51 API routes; this table predates the most recent additions.

Legend: ✅ = Implemented | ⚠️ = Partial / Conditional | ❌ = Not implemented | - = N/A

| Route | Method | Auth | Body Limit | Timeout | Rate Limit | Idempotency | Cache | Input Validation | Status Codes |
|-------|--------|------|-----------|---------|-----------|-------------|-------|-----------------|-------------|
| `/contact` | POST | None | ✅ 1 MB | ✅ 5s | ✅ (5/60s) | - | - | ✅ Zod | 200, 400, 413, 429, 500 |
| `/sponsor` | POST | None | ✅ 1 MB | ✅ 5s | ✅ (5/60s) | - | - | ✅ Zod | 200, 400, 413, 429, 500 |
| `/events/register` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ✅ header | - | ✅ Zod | 200, 400, 401, 413, 429, 500 |
| `/events/checkin` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ✅ Zod | 200, 400, 401, 404, 413, 429, 500 |
| `/events/[eventId]/registrations` | GET | Auth0 | - | ❌ | ❌ | - | ❌ | ❌ | 200, 400, 401, 500 |
| `/events` | GET | Auth0 | - | ❌ | ❌ | - | ❌ | ❌ | 200, 401, 500 |
| `/profile/complete` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ✅ Zod | 200, 400, 401, 413, 429, 500 |
| `/profile/update` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ✅ Zod | 200, 400, 401, 413, 429, 500 |
| `/badges/check` | GET | Auth0 | - | ❌ | ❌ | - | ❌ | ❌ | 200, 401, 500 |
| `/badges/issuer` | GET | None | - | ❌ | ❌ | - | ✅ 86400s | ✅ Static | 200 |
| `/badges/assertions/[markerId]` | GET | None | - | ❌ | ❌ | - | ✅ 3600s | ❌ (param only) | 200, 404 |
| `/projects/like` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ✅ Zod | 200, 400, 401, 413, 429, 500 |
| `/projects` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ✅ header | - | ✅ Zod | 201, 200, 400, 401, 413, 429, 500 |
| `/notifications` | GET | Auth0 | - | ❌ | ❌ | - | ❌ | ❌ | 200, 401, 500 |
| `/reviews` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ✅ Zod | 200, 400, 401, 413, 429, 500 |
| `/organizer/metrics` | GET | Auth0 | - | ❌ | ❌ | - | ❌ | ❌ | 200, 401, 500 |
| `/certificates` | GET | Auth0 | - | ❌ | ❌ | - | ❌ | ❌ | 200, 401, 500 |
| `/certificates/extract` | POST | Auth0 | ✅ 1 MB | ✅ 30s | ✅ (5/60s) | ❌ | - | ❌ (manual check) | 200, 400, 401, 413, 422, 429, 500, 502 |
| `/resources/complete` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ✅ Zod | 200, 400, 401, 413, 429, 500 |
| `/teams` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ✅ Zod | 200, 400, 401, 413, 429, 500 |
| `/widget/[slugId]` | GET | None | - | ❌ | ❌ | - | ❌ | ❌ (param only) | 200, 404 (HTML) |
| `/widget/[slugId]?variant=` | GET | None | - | ❌ | ❌ | - | ❌ | ❌ (param only) | 200, 404 (HTML) |
| `/verify/[markerId]` | GET | None | - | ❌ | ❌ | - | ❌ | ❌ (param only) | 200, 404 |
| `/impact/report/[projectId]` | GET | Auth0 | - | ❌ | ❌ | - | ❌ | ❌ (param only) | 200, 401, 404, 500 |
| `/webhooks/auth0` | POST | None (internal) | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ✅ Zod | 200, 400, 413, 429, 500 |
| `/cloudinary-signature` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ❌ | 200, 401, 413, 429, 500 |
| `/v1/issue-marker` | POST | Auth0 | ✅ 1 MB | ✅ 10s | ✅ (5/60s) | ❌ | - | ❌ (manual check) | 200, 400, 401, 413, 429, 500 |
| `/github/sync` | POST | Auth0 | ✅ 1 MB | ✅ 15s | ✅ (5/60s) | ❌ | - | ❌ | 200, 400, 401, 413, 429, 500, 502 |

#### Summary

| Pattern | Count | Percentage |
|---------|-------|-----------|
| Body size limit checked | **16 / 27** (59%) | All 16 POST routes with body parsing reject > 1 MB payloads via `rejectOversized` |
| Timeout set on external calls | **7 / 27** (26%) | Resend (contact, sponsor, issue-marker), Groq (certificates/extract), GitHub (github/sync) |
| Rate limiting applied | **16 / 27** (59%) | All 16 mutation routes via `withRateLimit` wrapper |
| Idempotency keys | **2 / 17 mutation routes** (12%) | events/register, projects |
| Cache headers on GET | **3 / 10 GET routes** (30%) | badges/issuer, badges/assertions, widget/[slugId] |
| Input validation (Zod/schema) | **15 / 17 mutation routes** (88%) | ✅ Strong |
| Status code 201 (created) | **1 / 27** | projects POST |


### 7. Server Action Audit (19 Actions)

Server actions (`"use server"`) are called from client components. They run as Vercel serverless functions
with the same constraints as API routes, but follow different patterns.

| Action File | Auth | Body Limit | Timeout | Error Handling | External API Calls |
|------------|------|-----------|---------|---------------|-------------------|
| `actions/projects.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/events.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/admin.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/annual-report.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/api-keys.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/profile.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/project-details.ts` | None | ❌ | ❌ | Throws Error | None |
| `actions/feedback.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/sponsor-profile.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/issue-marker.ts` | Auth0 | ❌ | ❌ | Throws Error | Resend |
| `actions/impact.ts` | None | ❌ | ❌ | Throws Error | None |
| `actions/teams.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/role-selection.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/search-profiles.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/skill-trees.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/sponsor-opportunities.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/team-chat.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/team-matching.ts` | Auth0 | ❌ | ❌ | Throws Error | Groq (AI) |
| `actions/generate-profile-summary.ts` | Auth0 | ❌ | ❌ | Throws Error | Groq (AI) |

#### Critical finding - error handling pattern

**All 19 server actions throw Errors instead of returning structured error responses.** 
This is different from API routes (which return `NextResponse.json({ error }, { status })`).
When a server action throws, Next.js returns a generic 500 to the client - the error message is
leaked in development but swallowed in production. No error is logged to any sink (since `logger`
is disabled in production).

#### Key risk - AI-powered server actions

Three server actions call external AI APIs:
- `generate-profile-summary.ts` → Groq (no timeout, no retry)
- `team-matching.ts` → Groq (no timeout, no retry)
- `issue-marker.ts` → Resend (no timeout, no retry)

A slow or failed external API call blocks the serverless function for the full default TCP timeout.


### 8. Database Connection Audit

The project calls Supabase client constructors across ~197 call sites (files importing `createClient`/`createServerClient`/`createServiceClient`):

| Client type | Constructor | Where used | Count |
|------------|------------|-----------|-------|
| **Server anon** | `createServerClient()` in `utils/supabase.ts` | Server components, API routes, server actions | ~60 sites |
| **Server service** | `createServiceClient()` in `utils/supabase.ts` | Webhooks, admin actions, XP mutations | ~6 sites |
| **Browser** | `createClient()` in `utils/supabase.ts` | Client components (useEffect, event handlers) | ~20 sites |

#### Per-request connection cost

A single API request typically creates **2–3 Supabase clients**:
1. `createServiceClient()` in the route handler → 1 client
2. Profile lookup sub-query → uses same client (good, not creating new ones)
3. Some routes call `createClient()` directly for public data → 1 additional client

Under 100 concurrent users hitting different routes:
- ~200 clients created on average
- Free tier limit: **60 direct connections** - connection pool exhausted
- Pro tier base: **60 direct connections** - also exhausted
- Pro tier with pooler: **200 clients** - barely within limits

#### Connection pool audit by route type

| Route group | Clients per request | Estimated concurrent capacity (free) |
|------------|-------------------|--------------------------------------|
| Public GET routes (verify, badges/issuer) | 1 | ~60 concurrent users |
| Authenticated GET routes (notifications, certificates) | 2 | ~30 concurrent users |
| Authenticated POST routes (register, checkin, like) | 2–3 | ~20–30 concurrent users |
| Webhook (auth0) | 1 | ~60 concurrent calls |
| Server actions with auth | 2 | ~30 concurrent calls |


### 9. Critical Gaps Summary

#### 🔴 Critical - Blocks production readiness

| Gap | Routes affected | Impact | Fix |
|-----|----------------|--------|-----|
| **No production logging** | All | ✅ **FIXED** - Structured logger + Sentry capture server errors. |
| **No fetch() timeouts** | All external API calls (Resend, Groq, GitHub, Cloudinary) | ✅ **FIXED** - All 7 external `fetch()` calls now have timeouts (5s Resend, 10s background email, 15s GitHub, 30s Groq). `package.json` enforces Node >=20. |
| **No body size limits** | All 17 mutation routes | ✅ **FIXED** - All 16 POST routes (15 body-parsing + webhook) reject > 1 MB via `rejectOversized(request)` helper in `validation.ts` before body parsing. Returns 413. |
| **Connection pool mismatch** | All | Exhausts 60-connection pool under load | Enable PgBouncer or add connection pooling middleware |
| **No pagination on GET routes** | 10+ GET routes | Silent truncation at 1,000 rows | Add `range()` header or `limit/offset` params |

#### 🟠 High - Should be addressed this quarter

| Gap | Routes affected | Impact | Fix |
|-----|----------------|--------|------|
| **No rate limiting on 25/27 routes** | All except contact + sponsor | ✅ **FIXED** - All 16 mutation routes now check `checkRateLimit()` before body parsing |
| **No idempotency on 15/17 mutation routes** | All except register + projects | Double-submission creates duplicate records | Accept `idempotency-key` header |
| **No cache headers on 7/10 GET routes** | events, projects, certificates, notifications, metrics | Unnecessary repeated DB queries | Add `Cache-Control: public, max-age=60` |
| **Server actions throw Errors** | All 19 actions | Generic 500 with no error detail | Return structured `{ success, error }` objects |
| **Graceful degradation missing** | All | Any dependency failure = 500 page | Add fallback UI per dependency |

#### 🟡 Medium - Worth tracking

| Gap | Impact | Fix |
|-----|--------|-----|
| **Auth0 session verification** | Unauthenticated requests get 401 | Add startup health check for Auth0 |
| **Upstash free tier headroom unknown** | Rate limiting could be silently disabled | Add monitoring on Upstash command count |
| **vercel.json minimal** | Functions use default 300s timeout; only headers + cron configured | Explicitly set timeout per route group |
| **Webhook body loaded before Svix check** | OOM risk from large Svix-signed payloads | Add content-length check before `req.json()` |
| **No structured error correlation IDs** | Cannot trace errors across routes | Add `x-request-id` header to every response |


### 10. Deployment Gate Checklist

Attach this checklist to every deployment.

#### Pre-deployment

- [ ] All `fetch()` calls have explicit `AbortSignal.timeout()` (5s for user-facing, 10s background, 15s GitHub, 30s Groq)
- [ ] All POST routes that parse a request body have a `content-length` check via `rejectOversized(request)` rejecting > 1 MB before `request.json()` - shared pattern in `lib/validation.ts`
- [ ] All mutation routes have rate limiting applied via `withRateLimit` wrapper
- [ ] All mutation routes that create resources have idempotency key support
- [ ] All GET routes that return lists have pagination (`limit` + `offset` or `Range` header)
- [ ] All GET routes have cache headers (`Cache-Control` or `CDN-Cache-Control`)
- [ ] Server actions return structured objects, not thrown Errors

#### Platform ceiling check

- [ ] Total Supabase client calls per request ≤ 2
- [ ] Expected concurrent users × clients-per-request < Supabase connection pool limit
- [ ] Upstash monthly command budget estimated and not exceeded
- [ ] Function bundle size verified (< 250 MB)
- [ ] No API route will exceed 4.5 MB response body (if so, use streaming or pagination)

#### External dependency check

- [ ] Resend daily email budget known and not exceeded
- [ ] Groq daily rate limit known and not exceeded (7,200 req/day on free)
- [ ] GitHub API rate limit known and not exceeded (5,000 req/hr)
- [ ] All new external dependencies have CSP directives updated in `next.config.ts`
- [ ] Every external `fetch()` has: timeout, error handling, retry strategy

---

### Maintenance

This checklist must be updated when:
- A new API route or server action is added
- A new external dependency (API, service, SDK) is integrated
- The platform (Vercel, Supabase, Upstash, Auth0) publishes updated limits
- The project migrates to a higher tier on any platform
- A deployment fails due to a limit violation not documented here

**Owner:** Engineering maintainer (whoever merges the most recent PR that touches
API routes, server actions, Supabase queries, or external integrations).

---

*This file is the authoritative constraint inventory for the Butwal Hacks platform.
When an AI agent generates code that could exceed a documented ceiling, this file wins.*

---

## Deployment — Butwal Hacks

Production deployment guide for the Butwal Hacks platform. Vercel hosts the Next.js application. Subdomain routing separates marketing (`butwalhacks.com`) from the app (`app.butwalhacks.com`) via `proxy.ts`.

---

### 1. Vercel Project Configuration

#### Import Project

1. Go to [vercel.com/new](https://vercel.com/new) and import the `Prarambha369/Butwal-Hacks` repository.
2. The root directory is the repo root (`/`). The app lives in `my-app/`.

#### Project Settings

| Setting | Value | Source |
|---------|-------|--------|
| **Framework Preset** | `Next.js` | Auto-detected |
| **Root Directory** | Repo root (`/`); app in `my-app/` | Root `package.json` `build` script cd's into `my-app` |
| **Build Command** | `npm run build` | `vercel.json` |
| **Install Command** | `npm install` | `vercel.json` |
| **Output Directory** | `.next` | Next.js default |
| **Node.js Version** | 22.x | `.github/workflows/ci.yml` |

#### Domains

Configured via Vercel Dashboard -> Project -> Settings -> Domains:

| Domain | Type | Purpose |
|--------|------|---------|
| `butwalhacks.com` | Primary | Zone 1 — Public marketing site |
| `app.butwalhacks.com` | Subdomain | Zones 2-9 — Dashboards, profiles, APIs |
| `www.butwalhacks.com` | Redirect to `butwalhacks.com` | Canonical redirect |

After adding these domains in Vercel, proceed to DNS configuration (Section 2).

#### Environment Variables

All variables must be set in Vercel Dashboard -> Project -> Settings -> Environment Variables.

**Production values** are used when deploying from the `main` branch. Development/Preview values can differ.

See `my-app/.env.example` for the full list with descriptions. Key variables:

```
# Required for build
AUTH0_SECRET=<openssl rand -hex 32>
AUTH0_DOMAIN=<auth0 tenant domain>
AUTH0_CLIENT_ID=<auth0 regular web app client id>
AUTH0_CLIENT_SECRET=<auth0 regular web app client secret>
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>

# Required for runtime
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>
CLOUDINARY_API_SECRET=<cloudinary api secret>
UPSTASH_REDIS_REST_URL=<upstash redis url>
UPSTASH_REDIS_REST_TOKEN=<upstash redis token>
RESEND_API_KEY=<resend api key>

# Optional but recommended
SENTRY_DSN=<sentry dsn>
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=<posthog token>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
GROQ_API_KEY=<groq api key for AI features>
```

---

### 2. DNS Configuration

#### Using Vercel DNS (recommended)

Delegate DNS to Vercel by setting the domain's nameservers to Vercel's:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Then in Vercel Dashboard -> Project -> Settings -> Domains, add `butwalhacks.com` and follow the prompts to configure DNS records automatically.

#### Using an External DNS Provider

If you use Cloudflare, Namecheap, or another DNS provider, add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `CNAME` | `@` (or `butwalhacks.com`) | `cname.vercel-dns.com` | 300 |
| `CNAME` | `app` | `cname.vercel-dns.com` | 300 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 300 |

For email (MX) records, configure separately (use a service like Google Workspace or Zoho):

| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| `MX` | `@` | `mx.zoho.com` | 10 | 300 |
| `TXT` | `@` | `v=spf1 include:zoho.com ~all` | — | 300 |

#### Subdomain Routing (proxy.ts)

The `src/proxy.ts` middleware enforces subdomain routing:

- `butwalhacks.com` — serves Zone 1 marketing pages (landing, blog, events, community, etc.)
- `app.butwalhacks.com` — serves Zones 2-9 app routes (dashboards, profiles, APIs, portal, teams)
- Shared routes (`/auth/*`, `/_next/*`) work on both domains

If a user lands on the wrong subdomain, `proxy.ts` issues a 308 redirect to the correct one. On `localhost`, subdomain enforcement is skipped.

#### Verifying DNS

```bash
# Check that both domains resolve
dig butwalhacks.com +short
dig app.butwalhacks.com +short
# Both should return Vercel's IP or CNAME

# Check propagation (can take 5-60 minutes)
curl -s -o /dev/null -w "%{http_code}" https://butwalhacks.com
curl -s -o /dev/null -w "%{http_code}" https://app.butwalhacks.com
# Both should return 200
```

---

### 3. CI/CD Pipeline

#### Workflows

| Workflow | Trigger | File |
|----------|---------|------|
| **CI** | Every PR to `main` | `.github/workflows/ci.yml` |
| **Deploy** | Push to `main` | `.github/workflows/deploy.yml` |

#### CI Pipeline (per PR)

Runs in order:
1. **Lint** — `npm run lint` (0 warnings required)
2. **Security Audit** — `npm audit --audit-level=high`
3. **Typecheck** — `npx tsc --noEmit` (0 errors required)
4. **Build** — `npm run build` (skipped if secrets missing, e.g., fork PRs)
5. **Tests** — `npx vitest run` (811 tests)
6. **Secrets Audit** — Scans diff for hardcoded credentials
7. **E2E Tests** — Playwright (requires Auth0 test credentials)
8. **AI Review** — Claude-based code review

#### Deploy Pipeline (push to main)

Sequential jobs:
1. **migrate** — Applies Supabase migrations (`supabase db push`)
2. **seed-embeddings** — Seeds knowledge base embeddings (only if content changed)
3. **vercel-deploy** — Calls Vercel Deploy Hook URL

The deploy hook URL is set as `VERCEL_DEPLOY_HOOK_URL` in GitHub Secrets.

#### Preview Deployments

Every PR automatically gets a preview deployment on Vercel at `{project}-git-{branch}.{user}.vercel.app`. This deployment has its own URL and environment variables (can differ from production).

---

### 4. Auth0 Configuration

#### Application

1. Create a **Regular Web Application** at [manage.auth0.com](https://manage.auth0.com).
2. Set callback URLs:
   ```
   Production:  https://butwalhacks.com/auth/callback
   Dev:         http://localhost:3000/auth/callback
   ```
3. Set logout URLs:
   ```
   Production:  https://butwalhacks.com
   Dev:         http://localhost:3000
   ```
4. Set web origins:
   ```
   Production:  https://butwalhacks.com, https://app.butwalhacks.com
   Dev:         http://localhost:3000, http://app.localhost:3000
   ```

#### M2M Application (for CI)

1. Create a **Machine-to-Machine Application**.
2. Authorize for **Auth0 Management API** with scopes:
   - `read:users`, `update:users`, `delete:users`, `create:users`
   - `read:actions`, `update:actions`, `delete:actions`, `create:actions`
3. Set `AUTH0_M2M_CLIENT_ID` and `AUTH0_M2M_CLIENT_SECRET` in GitHub Secrets.

#### Post-Login Action

1. Go to Auth0 -> Actions -> Flows -> Login.
2. Create and deploy the action from `scripts/deploy-auth0-action.mjs`.
3. This syncs user profiles to Supabase on every login (creates profile rows with `BH-YY-NNN` IDs).

---

### 5. Supabase Setup

#### Project

1. Create a project at [supabase.com](https://supabase.com).
2. Note the **Project URL**, **Anon Key**, and **Service Role Key**.
3. Disable built-in auth providers (Auth0 handles authentication)

#### Migrations

```bash
# From the repo root
cd my-app
node scripts/apply-migrations.mjs
```

This applies all migration files from `supabase/migrations/` (66 migrations covering profiles, events, teams, projects, trust markers, etc.).

#### Realtime

Enable Realtime on these tables via Supabase Dashboard -> Database -> Replication:
- `tasks` — live Kanban board updates
- `audit_logs` — live audit feed (maintainer dashboard)

---

### 6. Third-Party Services

| Service | Setup | Key Variables |
|---------|-------|---------------|
| **Cloudinary** | Create account, note cloud name + API key/secret, create upload preset `butwal_hacks_upload` | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_SECRET` |
| **Upstash Redis** | Create Redis database (free tier), note REST URL + token | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Resend** | Create account, generate API key, set sender domain if using custom email | `RESEND_API_KEY` |
| **PostHog** | Create project, note project token + host URL | `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` |
| **Sentry** | Create project, note DSN. Set `SENTRY_AUTH_TOKEN` for source map uploads in CI | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |
---

### 7. Security Headers

Configured in two places:

#### vercel.json (CDN-level)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    },
    {
      "source": "/widget/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "frame-ancestors *" }
      ]
    }
  ]
}
```

#### next.config.ts (application-level)

CSP enforcement with per-route `frame-ancestors`:
- `/*` — `frame-ancestors 'none'` (blocks all framing)
- `/widget/*` — `frame-ancestors *` (embeddable verification widget)
- CSP violations reported to `/api/csp-violation`

---

### 8. Rollback Procedure

#### Immediate Rollback (Vercel)

1. Go to Vercel Dashboard -> Project -> Deployments.
2. Find the last known-good deployment (green checkmark).
3. Click the overflow menu (three dots) -> **Promote to Production**.
4. This instantly re-deploys the previous version. No build time needed.
5. Monitor the health check endpoint: `GET /api/health`

#### Git Revert (for code fixes)

```bash
# Revert the most recent commit
git revert HEAD
git push origin main

# Or revert a specific bad deployment
git revert <bad-commit-hash>
git push origin main
```

The CI pipeline will re-run and deploy the reverted code.

#### Database Rollback (Supabase)

Supabase migrations are designed to be forward-only. To undo a migration:

```bash
# 1. Identify the migration to roll back
ls supabase/migrations/

# 2. Write a reverse migration
cat > supabase/migrations/100_reverse_099.sql << 'EOF'
-- Reverse of 099_add_mentor_fields.sql
ALTER TABLE profiles DROP COLUMN IF EXISTS mentoring_topics;
ALTER TABLE profiles DROP COLUMN IF EXISTS mentee_capacity;
EOF

# 3. Apply the reverse migration
psql $SUPABASE_DB_URL -f supabase/migrations/100_reverse_099.sql
```

#### Rollback Checklist

1. Revert the deployment via Vercel dashboard (instant).
2. If DB changes were involved, apply a reverse migration.
3. If the deploy hook was triggered, the production URL is already updated — Vercel reverts this.
4. Verify: check `GET /api/health` returns 200, navigate to key pages (login, events, dashboard).
5. Post-mortem: document the root cause, add tests, and open a fix PR.

---

### 9. Monitoring

| Tool | Monitors | URL |
|------|----------|-----|
| **Vercel Analytics** | Traffic, page views, geolocation | Vercel Dashboard -> Analytics |
| **PostHog** | Funnels, user behavior, feature adoption | PostHog Dashboard |
| **Sentry** | Error tracking with source maps | Sentry Dashboard |
| **Cron Health** | `/api/health` runs every 5 minutes (vercel.json crons) | Vercel Dashboard -> Cron Jobs |

#### Health Check

```
GET /api/health

Response: { "ok": true, "timestamp": "..." }
```

Failed health checks indicate a deployment issue. Check Vercel Dashboard -> Deployments for build errors or Sentry for runtime errors.

---

### 10. Production Readiness Checklist

Before deploying to production:

- [ ] DNS records propagated (both `butwalhacks.com` and `app.butwalhacks.com`)
- [ ] SSL certificates issued by Vercel (automatic with custom domains)
- [ ] Environment variables set in Vercel production
- [ ] GitHub Secrets configured for CI/CD
- [ ] Vercel Deploy Hook created and added to GitHub Secrets
- [ ] Supabase migrations applied
- [ ] Auth0 applications configured with production URLs
- [ ] Branch protection enabled on `main` (requires passing CI checks)
- [ ] Security headers verified (curl -I https://butwalhacks.com)
- [ ] CSP violation endpoint monitored
- [ ] Rollback plan documented and accessible to the team

---

## Coding Standards — Butwal Hacks

Extracted from the existing codebase. All new code must follow these conventions.

---

### 1. TypeScript

#### Strict Mode
`tsconfig.json` sets `"strict": true`. No `any` types in production code. If a type is missing, define an interface or use `unknown` with a type guard.

#### File Extensions
- `.ts` — utilities, types, server-only code, API route handlers
- `.tsx` — components, pages (anything with JSX)
- `.mjs` — ESLint config, scripts (ESM module format)

#### No `any`
The `@typescript-eslint/no-explicit-any` rule is disabled globally (`"off"`) in `eslint.config.mjs` with the intent to fix incrementally. New code must NOT introduce new `any` types. Use `unknown` with type narrowing instead:

```typescript
// Bad
function process(data: any) { ... }

// Good
function process(data: unknown) {
  if (typeof data === 'string') { ... }
}
```

#### Unused Variables
`@typescript-eslint/no-unused-vars` is set to `"warn"` with `argsIgnorePattern: "^_"`. Prefix intentionally unused parameters with underscore:

```typescript
function handler(_request: Request, params: { id: string }) { ... }
```

---

### 2. Naming Conventions

#### Files
| Pattern | Example | Used For |
|---------|---------|----------|
| `page.tsx` | `dashboard/hacker/page.tsx` | App Router pages |
| `layout.tsx` | `dashboard/hacker/layout.tsx` | App Router layouts |
| `loading.tsx` | `explore/loading.tsx` | App Router loading states |
| `error.tsx` | `error.tsx` | App Router error boundaries |
| `route.ts` | `api/events/route.ts` | API route handlers |
| `component-name.tsx` | `empty-state.tsx` | React components |
| `kebab-case.ts` | `rate-limiter.ts` | Utility files |
| `PascalCase.tsx` | `button.tsx` (component name) | Component files (inner export is PascalCase) |

#### Exports
- **Components**: Named exports (e.g., `export function Button`, `export { EmptyState, NoResultsState }`)
- **Utilities**: Named exports (e.g., `export const cn`, `export function sanitizeString`)
- **Constants**: Named exports with `UPPER_SNAKE_CASE` for config values, `camelCase` for derived values
- **Types/Interfaces**: PascalCase, exported

#### Variables & Functions
- `camelCase` for variables, functions, and method names
- `PascalCase` for components, types, interfaces, and classes
- `UPPER_SNAKE_CASE` for compile-time constants only (`INITIAL_XP = 0`)
- `kebab-case` for file names

---

### 3. Imports

#### Ordering (convention, not enforced by linter)
1. External dependencies (`react`, `next/*`, `@auth0/*`, `@supabase/*`, `lucide-react`)
2. Internal absolute imports (`@/components/*`, `@/lib/*`, `@/utils/*`)
3. Relative imports (`./components/*`, `../lib/*`)
4. Types (`import type { Profile } from "@/lib/supabase-types"`)

Use `type` imports for type-only imports:

```typescript
import type { Profile, Role } from "@/lib/supabase-types";
```

#### Path Aliases
Always use `@/` alias for imports from `src/`:

```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
```

---

### 4. React Components

#### Server vs Client
- **Server Components** by default in Next.js App Router
- **Client Components** only when needed: `"use client"` at the top for:
  - State/effects (`useState`, `useEffect`)
  - Browser APIs (`localStorage`, `window`)
  - Event handlers (`onClick`, `onSubmit`)
  - `useUser()` from Auth0 SDK
  - Custom hooks (`usePresence`, `useAnalytics`)

#### Component Structure
```typescript
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MyComponentProps {
  title: string;
  description?: string;
}

export function MyComponent({ title, description }: MyComponentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-w-20 min-h-10" />;

  return (
    <div data-slot="my-component" className={cn("bh-card p-6")}>
      <h3 className="text-lg font-bold text-primary">{title}</h3>
      {description && <p className="text-sm text-secondary">{description}</p>}
    </div>
  );
}
```

#### Key Patterns
- `data-slot="component-name"` attribute on root element for CSS targeting
- `cn()` from `@/lib/utils` for className composition (wraps `tailwind-merge`)
- Early return for loading/empty states
- Props interface defined above component
- Forward refs only when needed (e.g., form inputs)

#### Empty States
Use the `EmptyState` component from `@/components/ui/empty-state`:

```typescript
<EmptyState
  icon={<FolderKanban className="w-12 h-12" />}
  title="No projects yet"
  description="Submit your first project to start building your portfolio."
  actions={[{ label: "Create Project", href: "/dashboard/projects/new", variant: "primary" }]}
/>
```

---

### 5. Server Actions and API Routes

#### Route Handlers
API routes live in `src/app/api/` following the pattern:

```typescript
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { withRateLimit } from "@/lib/rate-limiter";

export const GET = withRateLimit(async (request: NextRequest) => {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... handler logic
  return NextResponse.json(events);
}, "frequent");

export const POST = withRateLimit(async (request: NextRequest) => {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  // Validate with Zod
  // ... mutation logic
  return NextResponse.json(result, { status: 201 });
}, "user_action");
```

#### Auth Pattern
Every mutation route (`POST`, `PUT`, `DELETE`) checks for an Auth0 session. Public routes (like `/api/contact`) use Zod validation and rate limiting.

#### Supabase Clients
Three client factories in a single file `src/utils/supabase.ts`:
- `server.ts` — `createClient()` with anon key, server-side, RLS enforced, no session persistence
- `service.ts` — `createServiceClient()` with service role key, bypasses RLS, server-side only. NEVER exposed to client.
- `client.ts` — `createClient()` with anon key, browser singleton, no session persistence

#### Rate Limiting
Use the tiered rate limiter from `@/lib/rate-limiter`:

```typescript
import { withRateLimit, checkRateLimit } from "@/lib/rate-limiter";

// Wrapper pattern (recommended)
export const GET = withRateLimit(handler, "frequent");

// Direct check pattern
const { allowed, remaining, reset } = await checkRateLimit(request, "user_action");
if (!allowed) return rateLimitResponse(reset);
```

Available tiers: `public_form` (5/60s), `sensitive` (3/60s), `user_action` (5/60s), `frequent` (10/60s), `bulk` (30/60s).

---

### 6. Validation

Use `@/lib/validation.ts` for common sanitization:
- `sanitizeString(input, maxLength)` — strips HTML, trims, limits length
- `sanitizeEmail(input)` — validates + sanitizes email, returns `string | null`
- `sanitizeUrl(input)` — validates + normalizes URL, returns `string | null`
- `sanitizeUuid(s)` — validates UUID format, returns `string | null`
- `validateSocialUrl(platform, url)` — validates platform-specific social links
- `getSocialLinkError(platform, url)` — returns human-readable error message

All user-facing mutation routes should validate input with these utilities before writing to the database.

---

### 7. Error Handling

#### API Error Responses
Standardized format:

```typescript
// 400 — Validation error
NextResponse.json({ error: "Invalid email format" }, { status: 400 })

// 401 — Unauthorized
NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// 404 — Not found (hard 404 via notFound())
notFound()

// 429 — Rate limited
rateLimitResponse(reset)

// 500 — Server error
NextResponse.json({ error: "Internal server error" }, { status: 500 })
```

#### Client-Side Error Boundary
`app/error.tsx` catches runtime errors and displays a branded error page with:
- Auto-generated error ID (`BH-ERR-{timestamp}-{random}`)
- Report to `/api/report-error` endpoint (fire-and-forget)
- Retry button that calls `reset()`
- Dev mode: shows error details in a collapsible panel

#### Logging
Use the structured logger from `@/lib/logger`:

```typescript
import { logger } from "@/lib/logger";

// Simple logging
logger.error("[api/events]", err);
logger.warn("[api/events]", { missingField: "title" });
logger.info("User registered", { userId, eventId });

// With error ID for full-stack traceability
const log = logger.withErrorId("BH-ERR-a1b2c3-d4e5");
log.error("[api/events]", someError); // error_id auto-attached
```

Logs to console in all environments. Server-side errors are captured by Sentry (`@sentry/nextjs`).

---

### 8. Design System

#### Never Use Inline Styles for Colors
All colors must use either:
- Tailwind utility classes with `--bh-*` variables: `bg-surface`, `text-primary`, `border-border`
- Exact hex arbitrary values: `bg-[#FE0000]`, `text-[#FE0000]`
- CSS custom properties: `var(--bh-primary-red)`

#### Components
Always import UI primitives from `@/components/ui/`:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
```

#### Utility Classes
Use `bh-*` classes defined in `globals.css` `@layer utilities`:
- `bh-card` — solid white card, 1px border, 12px radius
- `bh-btn-primary` — red pill button with glow on hover
- `bh-btn-secondary` — outline pill button
- `bh-btn-ghost` — transparent button
- `bh-input` — form input with focus ring
- `bh-section` — section spacing
- `bh-container` — max-width container
- `bh-trust-marker-verified` — verified credential badge
- `bh-trust-marker-self-reported` — self-reported credential badge
- `bh-trust-marker-revoked` — revoked credential badge

---

### 9. Testing

#### Framework
- **Unit/Integration**: Vitest (config in `vitest.config.ts`)
- **E2E**: Playwright (config in `playwright.config.ts`)

#### Test Files
- Co-located with source: `component-name.test.tsx` or `lib-name.test.ts`
- Test directory: `__tests__/` folders alongside source files

#### Patterns
- Unit tests for utilities, validation, and business logic
- Integration tests for API routes
- E2E for critical user flows (auth, registration, profile)

---

### 10. Dependencies

#### Adding Dependencies
Before adding a new npm dependency, check:
1. Can the standard library or platform feature achieve this? (e.g., `crypto` module, built-in Web APIs)
2. Is there already an established pattern in the codebase that serves this purpose?
3. Is the dependency tree small and well-maintained?

#### Existing Key Dependencies
- `@auth0/nextjs-auth0` — authentication
- `@supabase/supabase-js` — database
- `tailwind-merge` — className merging (via `cn()`)
- `@upstash/redis` + `@upstash/ratelimit` — rate limiting
- `lucide-react` — icons
- `sonner` — toasts
- `@hello-pangea/dnd` — drag and drop
- `@sentry/nextjs` — error monitoring

---

### 11. Git and Commits

#### Branch Naming
`type/description-in-kebab-case` — e.g., `fix/auth-redirect-loop`, `feat/team-matching-ui`, `chore/ponytail-audit`

#### Commit Messages
```
type(scope): description — 72 char max

type: feat, fix, refactor, chore, test, docs, ci, style, perf
scope: the affected module or page (optional)
```

Examples:
```
feat(hacker-dash): add XP progress bar to dashboard header
fix(team-matching): prevent duplicate teammate suggestions
chore: update .gitignore with strix_runs/ and test-results/
```

---

### 12. AI Generation Rules

When generating code for Butwal Hacks:

1. **Do NOT** rewrite existing files unless explicitly requested
2. **Do NOT** introduce new `any` types — use `unknown` or concrete interfaces
3. **Do NOT** use inline `style={}` for colors — use Tailwind classes or `var(--bh-*)`
4. **Do NOT** install new npm packages without justification — check if existing patterns work
5. **Prefer** Server Components over Client Components (add `"use client"` only when necessary)
6. **Always** import UI primitives from `@/components/ui/` or use `bh-*` utility classes
7. **Always** validate user input in mutation routes
8. **Always** check Auth0 session for authenticated routes
9. **Always** use the existing logger for any logging
10. **Always** follow the established file naming and export conventions

---

### 13. File Organization

```
src/
  app/          — App Router pages, layouts, and API routes
  components/   — React components
    sections/   — Page-level sections (Navbar, Hero, Footer)
    ui/         — Primitives (Button, Card, Badge, Input)
    home/       — Landing page sections
    dashboard/  — Dashboard components
    hacker-id/  — Public profile components
  hooks/        — Custom React hooks
  lib/          — Business logic, validation, utilities
    actions/    — Server Actions
    ai/         — AI integrations (Groq, embeddings)
  types/        — TypeScript type definitions
  utils/        — Supabase client factories
```

---

## Testing Strategy — Butwal Hacks

What to test, how to test it, and what each test level covers.

---

### 1. Test Levels

| Level | Tool | Speed | Scope | Run In CI |
|-------|------|-------|-------|-----------|
| **Unit** | Vitest | Fast (<1s per file) | Single function, component, or utility | Yes (every PR) |
| **Integration** | Vitest | Medium (<5s per file) | API routes, Server Actions, database operations | Yes (every PR) |
| **E2E** | Playwright | Slow (<30s per test) | Critical user flows across multiple pages | Yes (every PR, separate job) |

#### When to Use Each

- **Unit test:** Pure functions, validation logic, utility functions, formatting helpers
- **Integration test:** API handlers, database operations, authentication flows, Server Actions
- **E2E test:** Auth flow (login/logout), event registration, project submission, profile editing

---

### 2. Test File Organization

Tests are co-located with source files in `__tests__/` directories:

```
src/
  lib/
    validation.ts
    __tests__/
      validation.test.ts          # Unit tests for validation
  lib/actions/
    events.ts
    __tests__/
      events.test.ts              # Integration tests for action
  components/
    tasks/
      kanban-board.tsx
      __tests__/
        kanban-board.test.tsx      # Component tests
  app/api/
    webhooks/
      __tests__/
        proxy.test.ts              # API route integration tests
  __tests__/
    smoke.test.ts                  # Smoke tests (build, imports)
```

E2E tests live in a separate `e2e/` directory:

```
e2e/
  smoke.spec.ts                   # Basic smoke test
  task-flow.spec.ts               # Kanban task CRUD flow
  rbac-routing.spec.ts            # Role-based access control
  kanban-realtime.spec.ts         # Real-time task updates
  avatar-upload.spec.ts           # Cloudinary upload flow
  crop-interaction.spec.ts        # Image crop interaction
  helpers.ts                      # Shared E2E helpers
```

---

### 3. Vitest Configuration

Defined in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

Key points:
- Environment is `node` (not `jsdom`) — the project uses `node` for all test environments
- `@/` path alias is configured for imports
- Placeholder Supabase env vars are provided so Supabase client imports don't crash
- E2E tests are excluded from Vitest (Playwright handles them)

---

### 4. Unit Testing Patterns

#### Testing Pure Functions

```typescript
// src/lib/__tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeString, sanitizeEmail, sanitizeUrl } from "../validation";

describe("sanitizeString", () => {
  it("strips HTML tags", () => {
    expect(sanitizeString("<script>alert('xss')</script>Hello")).toBe("Hello");
  });

  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("limits length", () => {
    expect(sanitizeString("a".repeat(100), 10)).toBe("a".repeat(10));
  });
});

describe("sanitizeEmail", () => {
  it("validates and returns email", () => {
    expect(sanitizeEmail("Test@Example.com")).toBe("test@example.com");
  });

  it("returns null for invalid email", () => {
    expect(sanitizeEmail("not-an-email")).toBeNull();
  });
});
```

#### Testing Components (non-visual)

```typescript
// src/components/ui/__tests__/skeleton.test.tsx
import { describe, it, expect } from "vitest";
import { Skeleton } from "../skeleton";

// Smoke test: component renders without crashing
describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<Skeleton className="w-20 h-4" />);
    expect(container.firstChild).toBeTruthy();
  });
});
```

---

### 5. Integration Testing Patterns

#### Testing API Routes

API route tests test the handler functions directly, avoiding HTTP server startup:

```typescript
// src/app/api/__tests__/register-event-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../events/register/route";

// Mock Auth0 session
vi.mock("@auth0/nextjs-auth0", () => ({
  getSession: vi.fn(),
}));

// Mock Supabase
vi.mock("@/utils/supabase", () => ({
  createServiceClient: () => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: { id: "1" }, error: null }),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: "hacker" }, error: null }),
  }),
}));

describe("POST /api/events/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    const { getSession } = await import("@auth0/nextjs-auth0");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/events/register", {
      method: "POST",
      body: JSON.stringify({ eventId: "1" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("registers authenticated user for an event", async () => {
    const { getSession } = await import("@auth0/nextjs-auth0");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const request = new Request("http://localhost:3000/api/events/register", {
      method: "POST",
      body: JSON.stringify({ eventId: "1" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

#### Common Mocks

```typescript
// Mock Auth0 session for tests
vi.mock("@auth0/nextjs-auth0", () => ({
  getSession: vi.fn(),
}));

// Mock Supabase service client for tests
vi.mock("@/utils/supabase", () => ({
  createServiceClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  notFound: vi.fn(),
}));
```

---

### 6. E2E Testing Patterns

#### Playwright Configuration

Defined in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

#### E2E Test Example

```typescript
// e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads with all sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  // Check hero section
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Check navigation links
  await expect(page.getByRole("link", { name: /events/i })).toBeVisible();
});

test("404 page for unknown routes", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
});
```

#### Running E2E Tests

```bash
# Run all E2E tests (starts dev server automatically)
npx playwright test

# Run a specific test file
npx playwright test e2e/smoke.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run headed mode (watch the browser)
npx playwright test --headed
```

---

### 7. What to Test

#### Must Test

| Area | Test Level | Examples |
|------|-----------|----------|
| Validation functions | Unit | `sanitizeString`, `sanitizeEmail`, `sanitizeUrl`, `validateSocialUrl` |
| Utility functions | Unit | `cloudinaryUrl`, `getAvatarUrl`, `cn()` (via tailwind-merge) |
| Business logic | Unit/Integration | XP calculations, level thresholds, task board utilities |
| API mutation routes | Integration | CRUD operations, auth checks, validation, error responses |
| API public routes | Integration | Rate limiting, CORS, error responses |
| Server Actions | Integration | Profile updates, event registration, marker issuance |
| Authentication | E2E | Login, logout, callback, session persistence |
| Critical flows | E2E | Event registration, project submission, profile viewing |

#### Should Test

| Area | Test Level | Examples |
|------|-----------|----------|
| React components | Unit (smoke) | Rendering, conditional states, empty states |
| Custom hooks | Unit | `usePresence`, `useAnalytics`, `useFocusTrap` |
| Database queries | Integration | Profile resolution, search, pagination |
| Error boundaries | Integration | Error page rendering, error reporting |

#### Don't Test (explicitly)

- **Third-party library behavior** — assume Auth0, Supabase, Cloudinary SDKs work correctly
- **CSS/styling details** — visual regression is not part of the current strategy
- **Next.js framework internals** — assume App Router, `next/image`, and `next/font` work correctly
- **Constants and static config** — test the logic that uses them, not the values themselves

---

### 8. Mocking Strategy

| Service | Mock Approach | Example |
|---------|--------------|---------|
| Auth0 | `vi.mock("@auth0/nextjs-auth0")` — mock `getSession` | Return `{ user: { sub: "auth0\|id" } }` or `null` |
| Supabase | `vi.mock("@/utils/supabase")` — chain `from().select().eq().single()` | Return `{ data: {...}, error: null }` or `{ data: null, error: {...} }` |
| Cloudinary | Not typically mocked — use `cloudinaryUrl()` which is a pure function | Test the URL transform logic directly |
| Upstash Redis | Rate limiter falls back to allow-all when Redis is unreachable | Tests run without Redis by default |
| Resend (email) | Not typically mocked — test that the email content function works | Test `ghost-marker-notification.ts` output |
| `next/navigation` | `vi.mock("next/navigation")` | Mock `useRouter`, `usePathname`, `notFound` |
| `next/headers` | `vi.mock("next/headers")` | Mock `cookies()`, `headers()` |

---

### 9. Running Tests

```bash
# Run all unit + integration tests
npm run test                        # vitest run

# Run tests in watch mode (development)
npx vitest

# Run a specific test file
npx vitest run src/lib/__tests__/validation.test.ts

# Run with coverage
npx vitest run --coverage

# Run E2E tests
npx playwright test

# Run all checks (pre-merge)
npm run test && npx playwright test && npx tsc --noEmit && npm run lint
```

---

### 10. CI Integration

Tests run automatically on every PR via `.github/workflows/ci.yml`:

```yaml
# Two separate jobs:
test:
  - name: Tests
    run: npx vitest run

e2e:
  - name: E2E Tests
    run: npx playwright test
    # Requires AUTH0_TEST_EMAIL and AUTH0_TEST_PASSWORD
```

The E2E job depends on the `build` job completing first, and requires Auth0 test credentials in GitHub Secrets.

---

### 11. Current Test Inventory

As of the latest build:

| Type | Count | Files |
|------|-------|-------|
| Unit + Integration tests | 811 | 41 test files |
| E2E tests | 6 spec files | `e2e/` directory |

Current coverage is comprehensive for utilities, API routes, and Server Actions. Gaps exist in E2E coverage (auth-dependent tests require credentials) and component-level visual testing.

---

## Error Handling Strategy — Butwal Hacks

How errors are caught, reported, logged, and displayed across the platform.

---

### 1. Error Boundary Hierarchy

```
app/error.tsx          ← Global error boundary (catches uncaught render errors)
app/not-found.tsx      ← Global 404 (triggered by notFound() from next/navigation)
app/loading.tsx        ← Global loading state (shown during async page loading)
```

#### Per-route boundaries (planned)
Individual layouts and pages can define their own `error.tsx` and `loading.tsx` for granular error recovery.

---

### 2. Error ID Format

All errors are assigned a unique, human-readable ID for traceability:

```
BH-ERR-{timestamp}-{random}

Example: BH-ERR-1a2b3c-4f8k
```

- Generated by `generateErrorId()` in `src/app/error.tsx`
- Timestamp: `Date.now().toString(36).slice(-6)` — 6 chars, URL-safe
- Random: `Math.random().toString(36).slice(2, 6)` — 4 chars
- Threaded from client → server via `logger.withErrorId(errorId)`

---

### 3. Client-Side Error Boundary

**File:** `src/app/error.tsx`

#### What it does
1. Catches uncaught render errors from any page component
2. Generates a unique `BH-ERR-*` ID
3. Parses the User-Agent string into structured browser/OS/device info
4. Fires a POST to `/api/report-error` with full debugging context (fire-and-forget)
5. Displays a branded error page with retry button and navigational links

#### Error report payload
```json
{
  "error_id": "BH-ERR-1a2b3c-4f8k",
  "message": "Cannot read properties of undefined (reading 'map')",
  "digest": "1234567890",
  "url": "https://butwalhacks.com/dashboard",
  "timestamp": "2026-07-24T10:30:00.000Z",
  "user_id": "auth0|abc123",
  "user_agent": "Mozilla/5.0...",
  "browser": "Chrome",
  "os": "macOS",
  "device": "Desktop",
  "screen": "1440x900",
  "language": "en-US"
}
```

#### Rendering
- Retry button: calls `reset()` which re-renders the page segment
- Return home: link to `/`
- Dev mode: shows error details in a collapsible panel (message + digest)
- Uses i18n for all user-facing text

---

### 4. 404 Page

**File:** `src/app/not-found.tsx`

#### Triggers
- `notFound()` call from `next/navigation` in any page or layout
- Visiting a route that has no matching page

#### Rendering
- Large `404` heading
- i18n-powered title and description
- Two action buttons: "Back to Home" and "Explore Community"
- Links use `<Button>` component with secondary variant

---

### 5. API Error Responses

#### Standardized Format
```typescript
// 400 — Bad Request (validation failure)
NextResponse.json({ error: "Invalid email format" }, { status: 400 })

// 401 — Unauthorized (no Auth0 session)
NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// 403 — Forbidden (insufficient role/permissions)
NextResponse.json({ error: "Only maintainers can perform this action" }, { status: 403 })

// 404 — Not Found (hard 404 via notFound())
notFound()

// 429 — Rate Limited
rateLimitResponse(reset)  // Returns Retry-After header

// 500 — Internal Server Error (never expose details)
NextResponse.json({ error: "Internal server error" }, { status: 500 })
```

#### Pattern for API Route Handlers
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { withRateLimit } from "@/lib/rate-limiter";

export const POST = withRateLimit(async (request: NextRequest) => {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Validate with @/lib/validation.ts
    // Perform mutation with createServiceClient()
    // Audit log the action
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    logger.error("[api/events/register]", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}, "user_action");
```

---

### 6. Logging

**File:** `src/lib/logger.ts`

#### Behavior
| Environment | Output | Destination |
|-------------|--------|-------------|
| All | Console | `console.log/warn/error` |
| All (server errors) | Sentry | `@sentry/nextjs` error capture |

#### Usage
```typescript
import { logger } from "@/lib/logger";

// Simple logging
logger.error("[api/events]", err);
logger.warn("[api/events]", { missingField: "title" });
logger.info("User registered", { userId, eventId });

// With error ID for full-stack traceability
const log = logger.withErrorId("BH-ERR-a1b2c3-d4e5");
log.error("[api/route]", someError);  // error_id auto-attached to entry
```

#### Key Details
- Simple pass-through to `console.*` — never blocks the request
- `withErrorId()` threads a `BH-ERR-*` ID through server log entries
- `ponytail:` — logging is intentionally minimal (no external log sink); Sentry handles production error capture.

---

### 7. Client Error Reporting

**File:** `src/app/api/report-error/route.ts`

#### Flow
1. `error.tsx` catches render error, generates BH-ERR-* ID, calls POST `/api/report-error`
2. `/api/report-error` logs via `logger.withErrorId` (Sentry captures server errors)
3. If configured, sends a formatted email to a Slack email-to-channel address via Resend
4. Always returns `{ ok: true/false }` — never throws

#### Rate Limiting
- Uses the `public_form` tier (5 requests per 60 seconds per IP)
- Blocked message patterns are silently dropped (build-time errors, missing deps)

#### Configuration
```
SLACK_EMAIL_CHANNEL=your-slack-email-channel@incoming.slack.com
RESEND_API_KEY=your-resend-api-key
```

If either env var is missing, the endpoint returns `{ ok: false }` gracefully.

---

### 8. Rate Limiting Errors

**File:** `src/lib/rate-limiter.ts`

#### Tiers

| Tier | Limit | Response |
|------|-------|----------|
| `public_form` | 5/60s | 429 with Retry-After header |
| `sensitive` | 3/60s | 429 with Retry-After header |
| `user_action` | 5/60s | 429 with Retry-After header |
| `frequent` | 10/60s | 429 with Retry-After header |
| `bulk` | 30/60s | 429 with Retry-After header |

#### Fail-Open Behavior
If Redis is unreachable, the rate limiter returns `{ allowed: true, remaining: 999 }` — never blocks legitimate traffic due to infrastructure failure.

#### Response Format
```typescript
NextResponse.json(
  { error: "Too many requests. Please try again later." },
  {
    status: 429,
    headers: {
      "Retry-After": String(seconds),
      "X-RateLimit-Reset": String(ms),
    },
  }
);
```

---

### 9. Input Validation

**File:** `src/lib/validation.ts`

#### Utilities
```typescript
sanitizeString(input, maxLength = 5000)     // Strip HTML, trim, limit length
sanitizeEmail(input)                          // Validate + lowercase, returns null if invalid
sanitizeUrl(input)                            // Validate + normalize, returns null if invalid
sanitizeUuid(s)                               // Validate UUID format, returns null if invalid
validateSearchInput(input)                    // Length + allowed chars check
validateSocialUrl(platform, url)              // Platform-specific social link validation
getSocialLinkError(platform, url)             // Human-readable error message
```

#### When to Use
Every mutation route (`POST`, `PUT`, `PATCH`, `DELETE`) must validate user input with these utilities before writing to the database. Public routes (like `/api/contact`) must validate + rate limit.

---

### 10. Unhandled Rejection / Global Errors

The platform relies on:
- **Next.js** automatic error handling for uncaught exceptions in API routes (returns 500)
- **Sentry** (`@sentry/nextjs`) for production error monitoring with source map support
- **CSP Violation Reports** via `/api/csp-violation` for security-related errors
- **Client Error Reporting** (Section 7) for browser-side runtime errors

---

### 11. Full-Stack Traceability Example

```
1. User hits an error on /dashboard/hacker/work
2. error.tsx catches it, generates BH-ERR-1a2b3c-4f8k
3. error.tsx POSTs to /api/report-error with error_id + context
4. /api/report-error logs via logger.withErrorId (console + Sentry):
     { level: "error", message: "...", error_id: "BH-ERR-1a2b3c-4f8k", timestamp: "..." }
5. Report-error sends email to Slack #maintainer-web-log with full debug context
6. Maintainer can search Sentry for "BH-ERR-1a2b3c-4f8k" to find all related errors
7. If an API route involved, the server-side handler should call
   logger.withErrorId("BH-ERR-1a2b3c-4f8k") to thread the same ID through server logs
```

---

### 12. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | No | Email alerts for client errors |
| `SLACK_EMAIL_CHANNEL` | No | Slack email-to-channel address |
| `SENTRY_DSN` | No | Error monitoring (set via Sentry wizard) |
| `SENTRY_AUTH_TOKEN` | No | Source map uploads in CI |

---

## Performance Budget — Butwal Hacks

Measurable targets for web performance, accessibility, and user experience. Enforced by CI where possible, monitored via Vercel Analytics and Lighthouse.

---

### 1. Core Web Vitals

| Metric | Target | Source |
|--------|--------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Lighthouse / Web Vitals |
| **INP** (Interaction to Next Paint) | < 200ms | Lighthouse / Web Vitals |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse / Web Vitals |
| **FCP** (First Contentful Paint) | < 1.8s | Lighthouse / Web Vitals |
| **TTFB** (Time to First Byte) | < 800ms | Lighthouse / Vercel Analytics |

---

### 2. Lighthouse Scores

| Category | Target | Enforcement |
|----------|--------|-------------|
| **Performance** | >= 90 | Manual — Lighthouse CI |
| **Accessibility** | >= 95 | Manual — Lighthouse CI |
| **Best Practices** | >= 90 | Manual — Lighthouse CI |
| **SEO** | >= 95 | Manual — Lighthouse CI |

---

### 3. Bundle Size

| Asset | Target |
|-------|--------|
| Initial JS (all routes) | < 250 KB gzip |
| Initial CSS | < 30 KB gzip |
| Fonts (self-hosted) | < 50 KB total (DM Sans + JetBrains Mono, woff2) |
| Per-page JS increment | < 50 KB gzip |

#### Current State
- Fonts self-hosted via `next/font/google` with `display: swap` and `preload: true`
- `lucide-react` tree-shakes unused icons
- Sentry tree-shakes debug logging in production (`treeshake.removeDebugLogging: true`)
- `noUnusedLocals` and `noUnusedParameters` prevent dead code accumulation

---

### 4. Images

| Rule | Target | Implementation |
|------|--------|---------------|
| Format | WebP or AVIF via Cloudinary | `q_auto,f_auto,w_{width}` transform |
| Optimization | Cloudinary auto | `cloudinaryUrl()` utility in `@/lib/utils.ts` |
| Responsive | `sizes` attribute on all `<Image>` | `next/image` component |
| Lazy loading | Below-fold images | `loading="lazy"` (default for `next/image`) |
| Priority | Above-fold LCP images | `priority` prop on hero images |
| Placeholder | DiceBear for missing avatars | `getAvatarUrl()` and `getDiceBearPlaceholder()` in `@/lib/utils.ts` |

#### Remote Image Sources (whitelisted in `next.config.ts`)
- `api.dicebear.com` — avatar placeholders
- `images.unsplash.com` — blog covers
- `res.cloudinary.com` — CDN images
- `api.qrserver.com` — QR codes

---

### 5. Security

| Header | Value | Location |
|--------|-------|----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | `next.config.ts` |
| `X-Content-Type-Options` | `nosniff` | `next.config.ts` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `next.config.ts` |
| `Content-Security-Policy` | Per-route: `frame-ancestors 'none'` or `frame-ancestors *` for `/widget/*` | `next.config.ts` |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=()` | `next.config.ts` |
| `X-Frame-Options` | Not used — CSP `frame-ancestors` is the modern standard | Replaced by CSP |

---

### 6. Accessibility

| Requirement | Target | Implementation |
|-------------|--------|---------------|
| Skip-to-content | Visible on keyboard focus | Anchor `#app-content` in `layout.tsx` |
| Focus indicators | `ring-2 ring-primary-red ring-offset-2` | Global `focus-visible` styles in `globals.css` |
| ARIA labels | All interactive elements | `aria-label`, `aria-hidden` attributes |
| Color contrast | >= 4.5:1 for text, >= 3:1 for large text | All colors checked in `DESIGN.md` |
| Heading order | Logical hierarchy | h1 -> h2 -> h3, no jumps |
| Touch targets | >= 44x44 px | `bh-icon-btn`, `bh-btn-*` classes enforce min sizes |

---

### 7. SEO

| Requirement | Target | Implementation |
|-------------|--------|---------------|
| Metadata | All pages | `generateMetadata()` or `export const metadata` |
| Open Graph | All pages | `openGraph` title, description, image |
| Canonical URLs | All pages | `alternates.canonical` in metadata |
| Structured data | JSON-LD on landing page | `SafeJsonLd` component in `layout.tsx` |
| Sitemap | Dynamic | `src/app/sitemap.ts` |
| Robots | Dynamic | `src/app/robots.ts` |
| hreflang | English + Nepali | `layout.tsx` alternate links |

---

### 8. Reliability

| Metric | Target | Implementation |
|--------|--------|---------------|
| Offline support | PWA service worker | `public/sw.js` (basic cache-first for assets) |
| Error recovery | Error boundary with retry | `app/error.tsx` |
| Loading states | Skeleton/spinner for all async content | `app/loading.tsx`, `Skeleton` component |
| 404 handling | Hard 404 via `notFound()` | `app/not-found.tsx` + route-level `notFound()` |
| API fallibility | Fail-open for non-critical backends | Rate limiter fails open if Redis unreachable |

---

### 9. Monitoring

| Tool | What It Monitors |
|------|------------------|
| Vercel Analytics | Traffic, page views, geolocation |
| PostHog | Funnels, user behavior, feature adoption |
| Sentry | Error tracking with source map support |
| CSP Violations | `/api/csp-violation` endpoint |
| Client Error Reporting | `/api/report-error` endpoint from `app/error.tsx` |

---

### 10. Measurement

#### CI
- Lighthouse scores are NOT currently enforced in CI (manual check)
- Build output warns on large bundles via Next.js CLI
- Secret scan and dependency audit run on every PR

#### Local
1. `npx lighthouse http://localhost:3000 --view` — run against any page
2. Chrome DevTools > Lighthouse panel — on production URL
3. Vercel Analytics > Web Vitals — real-user monitoring in production

#### If Budget Is Exceeded
1. Check `next.config.ts` `images.remotePatterns` — only whitelist needed sources
2. Verify fonts are self-hosted via `next/font` (not external CDN)
3. Check bundle analyzer: `ANALYZE=true npm run build`
4. Profile LCP element — is it a Cloudinary image? Add `priority` and optimize `sizes`
5. Check render-blocking resources — inline critical CSS

---

## Cloudinary Structured Metadata Configuration

This document describes the structured metadata fields configured in Cloudinary for backend moderation, filtering, and audit-trail purposes.

---

### Overview

Every image uploaded via the `<CloudinaryUpload>` component includes structured metadata that is stored **in Cloudinary itself** — not just in Supabase. This means you can search, filter, and moderate images directly from the Cloudinary Dashboard without needing to cross-reference against the database.

---

### Metadata Fields

Create these **5 fields** in your Cloudinary Dashboard:

#### 1. `entity_type`

| Property | Value |
|----------|-------|
| **Label** | Entity Type |
| **Type** | Single-selection list |
| **Values** | `avatar`, `event_banner`, `project_cover`, `blog_cover`, `gallery_photo` |

**Purpose:** Instantly filter Cloudinary to see all project covers, all avatars, etc. Useful for batch moderation (e.g., reviewing all uploaded avatars for policy compliance).

#### 2. `bh_id`

| Property | Value |
|----------|-------|
| **Label** | Hacker BH-ID |
| **Type** | Text |

**Purpose:** Links an avatar or project cover directly to the ORCID-style profile (e.g. `BH-26-042`). If a user is suspended, you can easily find and blur all their uploaded images.

#### 3. `event_slug`

| Property | Value |
|----------|-------|
| **Label** | Event Slug |
| **Type** | Text |

**Purpose:** Links event banners and gallery photos to a specific event (e.g. `hackday-butwal-2026`). Enables per-event image moderation.

#### 4. `project_id`

| Property | Value |
|----------|-------|
| **Label** | Project UUID |
| **Type** | Text |

**Purpose:** Links a project cover image directly to its Supabase UUID.

#### 5. `uploader_auth0_id`

| Property | Value |
|----------|-------|
| **Label** | Uploader Auth0 ID |
| **Type** | Text |

**Purpose:** Security and audit trail. If someone uploads inappropriate content, you instantly know which Auth0 account did it — without querying Supabase.

---

### Entity Type Reference

The `entity_type` field uses a controlled vocabulary defined in `components/cloudinary-upload.tsx`:

```typescript
export type CloudinaryEntityType =
  | "avatar"         // Profile pictures
  | "event_banner"   // Event header images
  | "project_cover"  // Project showcase images
  | "blog_cover"     // Blog post headers
  | "gallery_photo"; // Event photo gallery
```

---

### Upload Context → Metadata Mapping

Each upload point in the app passes a specific set of metadata fields:

| Upload Context | `entity_type` | `bh_id` | `event_slug` | `project_id` | `uploader_auth0_id` |
|---|---|---|---|---|---|
| Profile avatar | `avatar` | ✅ | — | — | ✅ |
| Project cover (new) | `project_cover` | ✅ | — | — | ✅ |
| Project cover (edit) | `project_cover` | ✅ | — | ✅ | ✅ |
| Event banner (new) | `event_banner` | — | — | — | ✅ |
| Certificate scan | `gallery_photo` | — | — | — | ✅ |

**Legend:** ✅ = passed; — = not applicable at upload time

> **Note:** Some fields are unavailable at creation time. For example, `project_id` doesn't exist when uploading a cover during project submission (the project is created after the upload). Similarly, `event_slug` isn't known when creating a new event. These fields are only available on **edit** flows.

---

### Code Pipeline

The metadata flows through 3 stages:

```
1. Client Component          2. API Route                   3. Cloudinary Upload
─────────────────            ──────────                    ─────────────────
CloudinaryUpload             /api/cloudinary-signature      POST to cloudinary.com
  ├─ entityType="avatar"       ├─ Parses metadata from body    ├─ formData.append("file", ...)
  ├─ bhId={bhId}               ├─ Signs + timestamp             └─ formData.append("metadata", ...)
  ├─ uploaderAuth0Id={sub}     └─ Returns { signature,        Cloudinary stores
  └─ ...                          metadata, timestamp }         structured metadata
```

#### Stage 1: Component

`components/cloudinary-upload.tsx` accepts metadata props and passes them to the signature API:

```tsx
<CloudinaryUpload
  entityType="project_cover"
  bhId={bhId}
  projectId={project.id}
  uploaderAuth0Id={user?.sub}
  onUpload={(url) => setCoverImage(url)}
/>
```

#### Stage 2: Signature API

`api/cloudinary-signature/route.ts` signs the metadata along with upload params:

```typescript
const metadata = JSON.stringify({ entity_type, bh_id, event_slug, project_id, uploader_auth0_id });
paramsToSign.metadata = metadataStr;
const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
return NextResponse.json({ signature, metadata: metadataStr, ... });
```

#### Stage 3: Upload FormData

The metadata string is appended to the Cloudinary upload FormData:

```typescript
if (metadataStr) formData.append("metadata", metadataStr);
```

---

### Cloudinary Dashboard Setup

#### Step 1: Create Metadata Fields

1. Log into the [Cloudinary Dashboard](https://console.cloudinary.com)
2. Navigate to **Settings** → **Upload**
3. Scroll to **Structured Metadata**
4. Create each of the 5 fields listed above

#### Step 2: Verify

After setup, upload an image via the app and check the Cloudinary Dashboard:

1. Go to **Media Library**
2. Find the uploaded image
3. Open its details — you should see the metadata fields populated under **Metadata**

---

### Adding a New Upload Context

When adding a new `CloudinaryUpload` instance:

1. Choose the appropriate `entity_type` (add a new value to `CloudinaryEntityType` if needed)
2. Update `api/cloudinary-signature/route.ts` if the new field needs signing (it's already generic — accepts any field passed in the body)
3. Add the new entity_type value to the Cloudinary Dashboard's single-selection list
4. Pass available metadata props to `<CloudinaryUpload>`

---

### Environment Variables

The Cloudinary metadata pipeline requires:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name for upload URL |
| `CLOUDINARY_API_KEY` | API key for signature generation |
| `CLOUDINARY_API_SECRET` | API secret for signature generation |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Upload preset (optional) |

---

## Design System

The Butwal Hacks interface uses flat, solid surfaces with selective red accents. Cards have crisp 1px borders. Background blur is used for functional separation (modal overlays, status toasts, image captions) not decoration.

### Colors

#### Brand Reds

| Token | Value | Usage |
|-------|-------|-------|
| Primary Red | `#FE0000` | CTAs, trust markers, brand identity |
| Deep Red | `#B10000` | Button hover states, dark red surfaces |
| Dark Red | `#7b0000` | Deep backgrounds, destructive buttons |

#### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| Background Base | `#F7F7F8` | Page background |
| Surface | `#FFFFFF` | Cards, modals, inputs |
| Surface Hover | `#F0F0F2` | Hover states |
| Border | `#E5E5E5` | All borders, dividers |
| Text Muted | `#888888` | Secondary text, placeholders |
| Text Secondary | `#666666` | Body text |
| Text Body | `#333333` | Paragraph text |
| Text Primary | `#1F1F1F` | Headings, titles |

#### Dark Mode

| Token | Value |
|-------|-------|
| Background Base | `#1a1a1a` |
| Surface | `#2a2a2a` |
| Border | `#4a4a4a` |
| Text Primary | `#f0f0f0` |

### Rules

#### 1. No Inline Styles for Colors
Use Tailwind arbitrary values or CSS variable references. Never use `style={{ backgroundColor: '#FE0000' }}`.

Correct: `bg-[#FE0000]` or `bg-primary-red`
Wrong: `style={{ background: '#FE0000' }}`

#### 2. Concentricity
Inner radius equals outer radius minus padding. For example, if a card has `rounded-[20px]` and `p-4` (16px), inner content should have `rounded-[4px]`.

#### 3. Trust Hierarchy

| Level | Style |
|-------|-------|
| Verified | Red border (`border-[#FE0000]`) with red glow (`shadow-[0_0_12px_rgba(254,0,0,0.12)]`) |
| Self-Reported | Standard border, no glow |
| Revoked | Greyed out with strikethrough |

#### 4. Typography

- **DM Sans** (Inter fallback): headings, body text, labels, UI copy
- **JetBrains Mono**: BH-IDs, dates, task names, code blocks, monospaced data

#### 5. Buttons

| Type | Style |
|------|-------|
| Primary | Solid red (`#FE0000`), white text, pill shape (`rounded-full`), glow on hover |
| Secondary | White surface, 1px border, pill shape, no glow |
| Ghost | Text-only, no background, pill shape |

#### 6. Surfaces

- Cards are solid white (`#FFFFFF`) with 1px borders (`#E5E5E5`)
- No backdrop blur on cards, buttons, or page sections
- Blur is acceptable for: modal overlays, status toasts, image captions over photos
- No gradient backgrounds on page sections (gradients on hero photos are fine)

#### 7. Glow Usage

The red glow (`--bh-glow-red`) appears only on hover for primary CTAs and permanently on verified trust markers. Self-reported items never glow.

---

## User Stories — Butwal Hacks

Every feature mapped to a role, a goal, and a navigation flow. All flows end at a route in the 9-Zone architecture.

---

### Role: Hacker (Student Builder)

A student or young technologist who participates in events, earns credentials, and builds projects.

#### Core Identity

**Goal:** Claim and customize my Hacker ID profile.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/` or marketing page | Click "Sign Up" |
| 2 | `/auth/login?screen_hint=signup` | Authenticate via Auth0 (Google, GitHub, or email) |
| 3 | `/claim/[token]` | Claim ghost profile if invited, or auto-create profile |
| 4 | `/dashboard/hacker/profile` | Edit name, bio, avatar, social links, skills |
| 5 | `/p/[slug_id]` | View public-facing profile |

**Acceptance:** Profile is publicly viewable at `/p/[slug_id]`. Avatar shows on profile and nav bar. Social links validate against platform (GitHub, LinkedIn, Twitter, website).

---

#### Event Registration

**Goal:** Register for a hackathon or workshop.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/events` | Browse upcoming events |
| 2 | `/events/[slug]` | View event details (date, location, description) |
| 3 | Click "Register" | POST `/api/events/register` |
| 4 | `/dashboard/hacker` | See registered event in upcoming section |

**Acceptance:** Registration creates a row in `event_registrations`. "Register" button changes to "Registered". Organizer can see attendee in event dashboard.

---

#### Team Formation

**Goal:** Form a team with other hackers for a team event.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/events/[slug]` | View event, click "Find Team" |
| 2 | `/teams/create` | Create team with name + description |
| 3 | `/teams/[team_id]` | Share team invite link with other hackers |
| 4 | Recipient clicks invite | Joins team, appears in member list |

**Acceptance:** Team is stored in `teams` table. Members stored in `team_members`. One member marked as captain. Teams are scoped to an event.

---

#### Project Submission

**Goal:** Submit a project for judging and portfolio.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/hacker/projects` | Click "Submit Project" |
| 2 | `/dashboard/projects/new` | Fill project details (title, description, tech stack, category) |
| 3 | Upload cover image | Cloudinary upload via signed signature |
| 4 | Link GitHub repo | POST `/api/github/sync` verifies and imports repo metadata |
| 5 | Submit | POST `/api/projects` |
| 6 | `/dashboard/hacker/projects` | See project listed with status |

**Acceptance:** Project stored in `projects` table. Cover image stored via Cloudinary. GitHub metadata (stars, forks, topics) synced if linked.

---

#### Team Matching

**Goal:** Find teammates with complementary skills.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/hacker/team-matching` | View suggested teammates |
| 2 | See matching score and skills | Click on a suggested hacker |
| 3 | `/p/[bh_id]` | View their public profile and skills |
| 4 | Back to team-matching | Send invite or message |

**Acceptance:** Suggestions based on skill complementarity (Groq AI for Phase 2, explicit skills for Phase 1).

---

#### Work Distribution (Kanban)

**Goal:** Manage tasks within a team workspace.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/hacker/work` | View Kanban board |
| 2 | Drag task | Task status updates in real-time via Supabase Realtime |
| 3 | Click task | Opens detail drawer (description, assignee, priority, due date) |
| 4 | Edit inline | PATCH `/api/tasks/[id]` |
| 5 | Create task | POST `/api/tasks` with workspace context |

**Acceptance:** Tasks persist in `tasks` table. Board has 4 columns: To Do, In Progress, Review, Done. Real-time updates via Realtime subscriptions.

---

#### Credential Verification

**Goal:** Verify a trust marker I earned is cryptographically signed.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/p/[slug_id]` | View trust markers on my profile |
| 2 | Click verified badge | Navigate to `/verify/[markerId]` |
| 3 | See signature details | Ed25519 verification, issuer, date, event |

**Acceptance:** Verified badges show red glow. Self-reported badges show standard border. Revoked badges show strikethrough. Verification page shows signature trail.

---

### Role: Organizer (Volunteer)

A volunteer who runs events, issues trust markers, and manages programs.

#### Event Creation

**Goal:** Create a hackathon or workshop.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/organizer` | Click "Create Event" |
| 2 | `/dashboard/organizer/events/new` | Fill event form (title, dates, description, banner) |
| 3 | Upload banner | Cloudinary upload with metadata tags |
| 4 | Set visibility | Published or draft |
| 5 | Submit | Event appears on `/events` |

**Acceptance:** Event stored in `events` table. Banner on Cloudinary tagged with event ID. Draft events only visible to organizer.

---

#### Check-In Attendees

**Goal:** Verify a hacker attended my event.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/organizer/events/[event_id]` | View event detail |
| 2 | Open check-in | `/dashboard/organizer/events/[event_id]/scan` or `/qr` |
| 3 | Scan hacker's QR code | POST `/api/events/checkin` marks attendance |
| 4 | `/dashboard/organizer/events/[event_id]/attendees` | View checked-in attendees |

**Acceptance:** Attendees table stores check-in status. Exportable to CSV via `/api/events/[eventId]/export-certificates`.

---

#### Issue Trust Markers

**Goal:** Issue a verified credential to a hacker.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/organizer/issue-marker` | Fill marker form |
| 2 | Select hacker (by BH-ID or email) | Search profiles |
| 3 | Select event context | Dropdown of events I organize |
| 4 | Choose marker type | Skill badge, participation, winner, etc. |
| 5 | Submit | POST `/api/v1/issue-marker` creates signed trust marker |

**Acceptance:** Marker stored in `trust_markers` table with Ed25519 signature. Hacker sees badge on their public profile. Ghost profiles: email sent via Resend to claim.

---

#### Export Certificates

**Goal:** Generate certificates for all attendees.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/organizer/events/[event_id]` | View event |
| 2 | Click "Export Certificates" | GET `/api/events/[eventId]/export-certificates` |
| 3 | PDF generation | Server-side PDF via `@/lib/pdf/certificate-export.ts` |
| 4 | Download | One PDF per attendee or batch |

**Acceptance:** Certificates include hacker name, event name, date, and verification QR code.

---

### Role: Maintainer (Core Team)

A core team member with god-mode access to audit, moderation, and system administration.

#### Audit Log

**Goal:** Review all system actions for security.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/maintainer` | View system overview |
| 2 | `/dashboard/maintainer/audit-log` | View full audit log |
| 3 | Filter by action type, date, actor | Audit log is server-rendered from the `audit_logs` table (no public API route) |
| 4 | Click entry | See JSON metadata of the action |

**Acceptance:** All state-changing actions logged to `audit_logs` table. Filterable by action type, actor, target, and date range.

---

#### Trust Marker Override

**Goal:** Revoke a fraudulent or incorrect trust marker.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/maintainer/trust-override` | Search for marker or profile |
| 2 | Find marker ID or hacker profile | `/p/[slug_id]` shows all markers |
| 3 | Click "Revoke" | Requires confirmation modal |
| 4 | Enter reason | POST to API, marker marked as revoked |

**Acceptance:** Revoked markers show `line-through` on public profiles. Audit log records revocation with reason. Crypto signature is invalidated.

---

#### School Dedication

**Goal:** Dedicate a public profile to a specific school.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/maintainer/dedicate-school` | Search for hacker profile |
| 2 | Enter school name | Links profile to a school chapter |
| 3 | Submit | Profile shows school affiliation badge |

**Acceptance:** School appears on public profile. School chapter page lists all dedicated hackers.

---

#### User Management

**Goal:** View and manage all platform users.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/maintainer/users` | View paginated user table |
| 2 | Filter by role, status, school | Client-side filtering |
| 3 | Click user | Edit role, suspend, delete |
| 4 | Confirm action | Audit log entry created |

**Acceptance:** All users visible. Role changes logged. Suspended users cannot log in.

---

### Role: Sponsor / Recruiter (Partner)

An organization that searches for talent, posts bounties, and manages sponsorships.

#### Talent Search

**Goal:** Find hackers with specific skills for hiring.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/portal/recruiters` | Search interface |
| 2 | Filter by skills, location, event participation | GET `/api/search?skills=react,typescript&events=HackDay` |
| 3 | View hacker profiles | `/p/[slug_id]` with trust markers |
| 4 | Contact via platform | POST `/api/contact` (rate-limited) |

**Acceptance:** Search returns ranked profiles. Results show verified trust markers prominently.

---

#### Bounty Management

**Goal:** Post a paid bounty for a specific project or skill.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/portal/bounties/new` | Fill bounty form (title, description, reward amount) |
| 2 | Set requirements | Required skills, deliverable format |
| 3 | Submit | POST `/api/bounties` |
| 4 | `/portal/bounties` | View active bounties with submissions |

**Acceptance:** Bounties stored in `sponsor_opportunities` table. Hackers can submit via Open Collective integration.

---

### Role: Guest (Unregistered Visitor)

A visitor exploring the platform before signing up.

#### Browse Events

**Goal:** See what events are available.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/` | Landing page hero shows upcoming events |
| 2 | `/events` | Full event list with filters |
| 3 | `/events/[slug]` | Event detail page |
| 4 | Click "Register" | Redirected to `/auth/login` |

**Acceptance:** All public routes accessible without authentication. Auth-required actions redirect to login.

---

#### Explore Community

**Goal:** Discover hackers and their projects.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/explore` | Search/browse hacker directory |
| 2 | Filter by skills, school | Client-side filtering |
| 3 | Click hacker | `/p/[slug_id]` public profile |
| 4 | `/projects` | Browse public project showcase |

**Acceptance:** Public profiles show at minimum: name, avatar, bio, BH-ID. Projects show cover image, tech stack, and demo link.

---

#### View Trust Marker Verification

**Goal:** Verify a credential someone shared with me.

| Step | Route | Action |
|------|-------|--------|
| 1 | Receive link | `/verify/[markerId]` |
| 2 | Page shows marker details | Type, title, issuer, issue date, crypto signature |
| 3 | Verification badge | Shows "Verified" with red glow or "Revoked" with strikethrough |
| 4 | Copy embed code | `<iframe>` widget for external sites |

**Acceptance:** Verification page is publicly accessible (no auth required). Widget embed works on any external site via `/widget/[slugId]`.
