# Architectural Decisions — Butwal Hacks

Every significant technical choice, recorded with context, rationale, and consequences.

---

## ADR-001: Auth0 over Supabase Auth

**Date:** 2024 (project inception)
**Status:** Accepted

### Context
Supabase ships its own Auth module (GoTrue). Using it would mean one fewer service to manage. However, Butwal Hacks needs multi-provider OAuth (Google, GitHub, email/password), webhook-synced profiles, and ghost profile flows.

### Decision
Use Auth0 for all authentication. Supabase is used for the database only, accessed via the Service Role Key.

### Rationale
- Auth0's Post-Login Actions allow real-time profile sync to Supabase on every login
- Ghost profile flow (issue marker to email -> create unclaimed profile -> claim via Auth0 login) maps directly to Auth0's invitation flow
- Auth0's Organizations feature (planned for Phase 2 multi-chapter support) integrates cleanly
- Supabase Auth's webhook support was immature at the time of decision

### Consequences
- One additional service to manage
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the client (server-only)
- All backend queries use the service role, bypassing Supabase RLS entirely
- Auth routes mount at `/auth/*` via `proxy.ts`, NOT `/api/auth/*`

### Related
- `docs/authentication.md` — full auth flow documentation
- `src/proxy.ts` — Auth0 middleware configuration
- `src/app/api/webhooks/auth0/route.ts` — Auth0 user sync webhook

---

## ADR-002: Service Role Key Architecture (Bypass RLS)

**Date:** 2024 (project inception)
**Status:** Accepted

### Context
Supabase offers Row-Level Security (RLS) as its primary authorization mechanism. Typical Supabase projects use the anon key with RLS policies for public access, and the service role key for admin operations.

### Decision
Use the Supabase Service Role Key for ALL backend database operations (API routes, Server Actions, webhooks). Do NOT use RLS.

### Rationale
- Simplified permission model: backend code handles authorization via Auth0 session checks, not database-level policies
- RLS policies are harder to review and test than application-level authorization
- Service role bypasses RLS entirely, giving direct table access
- Public data access uses the anon key client (via `@/utils/supabase/server.ts`) but with explicitly scoped queries

### Consequences
- `SUPABASE_SERVICE_ROLE_KEY` is the single most sensitive credential — must only appear in `process.env`, never in client code
- Two Supabase client factories: `createClient()` (anon key, RLS enforced) and `createServiceClient()` (service role, RLS bypassed)
- Authorization logic lives in application code, not in SQL policies
- No risk of RLS policy misconfiguration causing data leaks

### Related
- `src/utils/supabase/service.ts` — service role client
- `src/utils/supabase/server.ts` — anon key client for constrained queries
- `SECURITY.md` — vulnerability reporting

---

## ADR-003: Cloudinary for Media CDN

**Date:** 2024 (project inception)
**Status:** Accepted

### Context
The platform needs image upload, transformation, and CDN delivery. Requirements: free tier, signed uploads, automatic optimization, metadata tagging, and gallery support.

### Decision
Use Cloudinary as the sole media CDN for all images (profile avatars, event banners, project covers, photo galleries).

### Rationale
- Generous free tier (25GB storage, 25GB bandwidth/month for a non-profit)
- Signed uploads via server-generated signatures prevent unauthorized uploads
- Automatic optimization (`q_auto,f_auto,w_{width}`) reduces bundle size without manual intervention
- Metadata tagging (event ID, uploader ID) enables filtering and gallery queries
- Image cropping and transformation APIs support the crop dialog component
- DiceBear used as fallback for avatars (avataaars style, deterministic by seed)

### Consequences
- Upload flow: client requests signature from `/api/cloudinary-signature`, then uploads directly to Cloudinary
- All image URLs include optimization parameters via `cloudinaryUrl()` utility
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is public (safe in client)
- `CLOUDINARY_API_SECRET` is server-only

### Related
- `src/components/cloudinary-upload.tsx` — upload component
- `src/lib/utils.ts` — `cloudinaryUrl()` utility
- `src/app/api/cloudinary-signature/route.ts` — signature endpoint
- `docs/cloudinary-metadata.md` — metadata schema

---

## ADR-004: Ed25519 Trust Marker Signing

**Date:** 2025 (Phase 1)
**Status:** Accepted

### Context
Trust markers (verified credentials) need cryptographic signing so third parties can verify them independently. The signing must be public-key based, cheap to generate/verify, and the key material must be easy to rotate.

### Decision
Sign trust markers with Ed25519 key pairs using Node.js `crypto` module.

### Rationale
- Ed25519 signatures are small (64 bytes) and fast to verify
- Node.js `crypto` module provides native Ed25519 support (no additional dependencies)
- PEM-encoded keys are easy to store as environment variables
- Public key can be embedded in verification pages without exposing the private key
- Meets Open Badges 3.0 compatibility requirements (planned for Phase 3)

### Consequences
- `TRUST_MARKER_PRIVATE_KEY` and `TRUST_MARKER_PUBLIC_KEY` must be in environment variables
- Private key must be PEM-encoded as a single line (newlines escaped as `\n`)
- `/verify/[markerId]` page displays signature verification status
- Revocation marks the marker as revoked in the database (signature remains valid but marker status overrides)
- Key rotation requires re-signing all active markers

### Related
- `src/lib/crypto/sign.ts` — signing implementation
- `src/app/verify/[markerId]/page.tsx` — verification page
- `src/app/api/v1/issue-marker/route.ts` — marker issuance
- `.env.example` — key generation instructions

---

## ADR-005: No Turbopack

**Date:** 2025 (project migration to Next.js 16)
**Status:** Accepted

### Context
Next.js 16 ships Turbopack as the default bundler for development. It offers faster hot module replacement and faster initial compilation.

### Decision
Do NOT use Turbopack. Use the standard Next.js webpack-based build.

### Rationale
- Compatibility issues with `proxy.ts` (Auth0 middleware) when using Turbopack
- Some dependencies (notably `@sentry/nextjs`) have better webpack integration
- Production builds always use webpack regardless of Turbopack setting
- The difference in development speed is negligible for this project size

### Consequences
- Set `--no-turbopack` in dev script or omit the flag
- Standard build is well-tested and stable
- Can revisit when Turbopack reaches full compatibility

---

## ADR-006: Resend for Email

**Date:** 2024 (project inception)
**Status:** Accepted

### Context
Transactional email is needed for ghost profile notifications, contact form, and future notification emails. Requirements: free tier for non-profit, API-based (no SMTP), simple SDK.

### Decision
Use Resend for all transactional email.

### Rationale
- Generous free tier (100 emails/day for a non-profit)
- Simple REST API with TypeScript SDK
- React Email compatibility for template rendering
- No SMTP configuration needed
- Fast delivery with good deliverability reputation

### Consequences
- `RESEND_API_KEY` required in environment
- Email templates in `src/lib/emails/`
- Contact form at `/api/contact` sends via Resend (rate-limited at 5/60s)

### Related
- `src/lib/emails/ghost-marker-notification.ts` — ghost profile email template
- `src/app/api/contact/route.ts` — contact form handler

---

## ADR-007: Upstash Redis for Rate Limiting

**Date:** 2025 (Phase 1)
**Status:** Accepted

### Context
API routes need rate limiting to prevent abuse. Requirements: serverless-compatible (HTTP-based, no persistent connection), free tier for low traffic, sliding window algorithm.

### Decision
Use Upstash Redis with `@upstash/ratelimit` for all rate limiting.

### Rationale
- Serverless-native (HTTP REST API, no TCP connection)
- `@upstash/ratelimit` provides sliding window rate limiting out of the box
- Generous free tier (10,000 requests/day)
- Falls back to allow-all if Redis is unreachable (fail-open, never block legitimate traffic)
- Works seamlessly with Vercel serverless functions

### Consequences
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` required in environment
- Five rate limit tiers: `public_form` (5/60s), `sensitive` (3/60s), `user_action` (5/60s), `frequent` (10/60s), `bulk` (30/60s)
- Wrapper pattern: `withRateLimit(handler, "tier")` for simple routes
- Direct check pattern: `checkRateLimit(request, "tier")` for complex routes

### Related
- `src/lib/rate-limiter.ts` — rate limiting implementation
- All `src/app/api/*/route.ts` files — usage

---

## ADR-008: Flat Design System (Kloner.app Foundation)

**Date:** 2025 (design pivot)
**Status:** Accepted

### Context
The original design used dark glassmorphism (backdrop-blur, translucent surfaces). This created visual noise, accessibility issues, and dated aesthetics.

### Decision
Pivot to a flat, layered Kloner.app-inspired design system with a single red accent. No backdrop-blur, no glass effects, no parallax.

### Rationale
- Flat surfaces load faster (no GPU-composited blur layers)
- Better accessibility: solid backgrounds provide higher contrast
- The single red accent (`#FE0000`) means something — used only on CTAs and verified trust markers
- Depth comes from tonal layering (lighter content, darker sidebars), not shadows or blur
- Distinguishes Butwal Hacks from the 2023 AI-startup aesthetic (glass, gradients, glow-everything)

### Consequences
- All `backdrop-filter: blur()` removed from components
- `globals.css` redesigned around `--bh-*` CSS custom properties
- Dark mode uses solid dark surfaces (`#1a1a1a` / `#2a2a2a`), not translucent glass
- `bh-*` utility classes defined in `@layer utilities` for consistent component styling
- Red glow (`--bh-glow-red`) appears only on primary CTA hover and verified trust markers

### Related
- `DESIGN.md` — complete design system reference
- `PRODUCT.md` §2 — design direction
- `src/app/globals.css` — token implementation
- `src/components/ui/` — primitive components

---

## ADR-009: Subdomain Routing via proxy.ts

**Date:** 2025 (Phase 1)
**Status:** Accepted

### Context
Auth0 v4 SDK requires mounting at `/auth/*` via middleware. The project also needs separate hosts for marketing (`butwalhacks.com`) versus dashboard/app (`app.butwalhacks.com`).

### Decision
Use a single `src/proxy.ts` file (Next.js middleware convention) for both Auth0 route mounting and subdomain-aware routing. No `middleware.ts` file.

### Rationale
- Auth0 v4 requires explicit middleware for route mounting
- Single middleware file simplifies the routing logic
- Subdomain detection (butwalhacks.com vs app.butwalhacks.com) + route rewriting handled in one place
- During local development (`localhost`), all routes are accessible from one origin

### Consequences
- `proxy.ts` handles: Auth0 callback/login/logout routes, subdomain detection, route rewriting
- No separate `middleware.ts` file
- Vercel production config must set `butwalhacks.com` and `app.butwalhacks.com` as domains
- Local development requires no subdomain configuration

---

## ADR-010: Open Collective for Funding (No Stripe)

**Date:** 2024 (project inception)
**Status:** Accepted

### Context
The platform needs to handle payments for bounties, sponsorships, and community funding. Stripe was considered but requires complex PCI compliance and tax handling.

### Decision
Use Open Collective for all financial transactions. Do NOT integrate Stripe.

### Rationale
- Open Collective handles tax compliance, invoicing, and fiscal sponsorship automatically
- Transparent budgeting: all income/expense is publicly visible
- No PCI compliance burden on the project
- Open Collective Gift Cards enable sponsor payouts and bounties
- Aligns with the non-profit / open-source nature of the project

### Consequences
- Sponsors must have or create an Open Collective account
- Bounty payouts go through Open Collective's fiscal host
- `/transparency` page displays budget data via Open Collective API
- No credit card storage or payment processing code
- `/api/webhooks/opencollective/route.ts` handles OC webhook events

### Related
- `src/app/(main)/transparency/page.tsx` — budget transparency page
- `src/app/api/webhooks/opencollective/route.ts` — OC webhook handler
- `src/app/api/admin/oc-sync/route.ts` — admin sync endpoint

---

## ADR-011: PostHog + Vercel Analytics for Observability

**Date:** 2025 (Phase 1)
**Status:** Accepted

### Context
The project needs analytics (traffic, page views) and product analytics (funnels, user behavior, feature adoption). Sentry handles error monitoring separately.

### Decision
Use both Vercel Analytics (traffic) and PostHog (product analytics). Sentry for errors.

### Rationale
- Vercel Analytics: zero-config, privacy-friendly, covers basic traffic metrics
- PostHog: self-hostable, supports funnels, feature flags, and session recording
- Together they provide full observability without overlapping
- Both have generous free tiers for non-profits

### Consequences
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` must be in client-side env
- PostHog provider wraps the app in `layout.tsx`
- Vercel Analytics is a simple `<Analytics />` component
- CSP must include PostHog CDN and API domains in `connect-src` and `script-src`

### Related
- `src/components/posthog-provider.tsx` — PostHog provider component
- `src/app/layout.tsx` — Analytics + PostHog providers
- `next.config.ts` — CSP for PostHog domains

---

## ADR-012: Supabase Realtime for Task Board Updates

**Date:** 2025 (Phase 1)
**Status:** Accepted

### Context
The Notion-style work distribution (Kanban board) needs real-time updates when team members drag tasks between columns.

### Decision
Use Supabase Realtime subscriptions for live task board updates.

### Rationale
- No additional service needed (Supabase already in the stack)
- Realtime uses PostgreSQL replication slots to stream database changes
- `@supabase/supabase-js` has built-in Realtime client support
- `usePresence()` hook uses a separate presence channel for online status
- Works with serverless functions (WebSocket connection from the browser)

### Consequences
- Realtime must be enabled on the `tasks` table in Supabase dashboard
- `usePresence()` hook uses a `presence` channel for online indicators
- Client subscribes to `tasks` changes in the workspace context
- Rate limit: Realtime connections counted in Supabase project limits

### Related
- `supabase/migrations/092_enable_realtime_tasks.sql` — database setup
- `src/hooks/use-presence.ts` — presence tracking hook
- `src/hooks/use-task-subscription.ts` — task update subscription
- `src/components/tasks/kanban-board.tsx` — Kanban UI

---

## ADR-013: No Supabase RLS — Application-Level Authorization

**Date:** 2024 (project inception)
**Status:** Accepted (see also ADR-002)

### Context
Supabase RLS is the standard way to restrict row-level access. However, managing RLS policies across 60+ migrations becomes complex and hard to audit.

### Decision
Do not use Supabase RLS for access control. All authorization is enforced at the application layer via Auth0 session checks.

### Rationale
- RLS policies are SQL — harder to review in PRs than TypeScript conditionals
- Application-layer authorization is testable with standard test frameworks
- Service role key bypasses RLS anyway, making policies redundant for backend queries
- Reduces migration complexity (no RLS policy migrations to maintain)

### Consequences
- Every mutation route must check `getSession()` and verify permissions
- Role-based access (hacker/organizer/maintainer/sponsor) enforced in route handlers
- Public routes use the anon key client with explicitly scoped SELECT queries
- Audit logging captures all state-changing actions

### Related
- `src/utils/supabase/server.ts` — anon key client (public data reads)
- `src/utils/supabase/service.ts` — service role client (all mutations)
- All `src/app/api/*/route.ts` files — session checks

---

## ADR-014: Monorepo with Single Application

**Date:** 2024 (project inception)
**Status:** Accepted

### Context
The project needs to serve both a public marketing site and an authenticated application under subdomains.

### Decision
Single Next.js application in a flat monorepo. The root `Butwal-Hacks/` directory contains configuration, documentation, and CI, while `my-app/` contains the Next.js application.

### Rationale
- Single deploy target (Vercel) — simpler than managing multiple apps
- Shared components, utilities, and types between marketing and app routes
- Subdomain routing handled at the middleware layer (`proxy.ts`), not at the deployment level
- Monorepo tools (npm workspaces) unnecessary for a single application

### Consequences
- `vercel.json` sets `rootDirectory: "my-app"` to point Vercel at the correct directory
- CI/CD workflows use `working-directory: my-app` for all npm commands
- Vercel preview deployments serve both marketing and app routes from the same URL
- Shared config files (`.gitignore`, `LICENSE`, `README.md`) live at the root

### Related
- `vercel.json` — deployment configuration
- `.github/workflows/ci.yml` — CI with working-directory
- `README.md` — project structure documentation
