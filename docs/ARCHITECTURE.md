# Butwal Hacks — Architecture and Engineering Reference

> The engineering reference: architecture decisions, security model, coding standards, and testing strategy. Owned by the core maintainers.

## Contents

- [What this is](#what-this-is)
- [Who it's for](#who-its-for)
- [Quick actions](#quick-actions)
- [Reference](#reference)
  - [Architecture overview](#architecture-overview)
  - [Architectural decisions](#architectural-decisions)
  - [Authentication](#authentication)
  - [Security](#security)
  - [Deployment](#deployment)
  - [Coding standards](#coding-standards)
  - [Testing](#testing)
  - [Error handling](#error-handling)
  - [By the numbers](#by-the-numbers)
- [Troubleshooting](#troubleshooting)
- [See also](#see-also)

## What this is

The lean reference for how the system is built and why. It records the decisions that are expensive to reverse, the standards a change must meet, and the failure modes worth knowing about in advance.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| Engineers changing the system | Standards, patterns, and the reasoning behind them |
| Reviewers | Checking a change against the recorded decisions |
| Anyone debugging | Locating the trust boundary a symptom lives behind |

## Quick actions

**Before writing a route:** confirm it fits a zone in [PRODUCT.md](../PRODUCT.md), wrap mutations in `withRateLimit()`, and validate input with Zod.

**Before writing a service-role query:** there must be an authorization check above it. See [Access control](../AGENTS.md#access-control).

**Before opening a PR:** run all four gates. See [AGENTS.md](../AGENTS.md#quick-actions).

## Reference

### Architecture overview

```text
Browser ──► Vercel (Next.js 16) ──┬── Auth0          (identity)
                                   ├── Supabase      (PostgreSQL)
                                   ├── Cloudinary    (image CDN)
                                   ├── Upstash Redis (rate limiting)
                                   ├── Resend        (transactional email)
                                   ├── Groq          (AI features)
                                   └── Open Collective (funding)
```

- **Subdomain routing:** `butwalhacks.com` for public, `app.butwalhacks.com` for the application, resolved in `my-app/src/proxy.ts`.
- **Auth:** Auth0 v4. Supabase Auth is disabled; the database is reached with the Service Role Key only.
- **RBAC:** five roles enforced through the predicates in `my-app/src/lib/dashboard-access.ts`, called from the proxy and from API routes.

### Architectural decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| ADR-001 | Auth0 over Supabase Auth | OAuth, MFA, organizations for multi-chapter, and Post-Login Actions for webhook sync. Supabase is database-only |
| ADR-002 | Service Role Key, no RLS | Authorization lives in application code rather than database policies. The cost is that every service-role call must sit behind an explicit auth check |
| ADR-003 | Cloudinary for media | Signed uploads, automatic optimization, metadata tagging. The client gets a signature from `/api/cloudinary-signature` and uploads directly |
| ADR-004 | Ed25519 trust marker signing | Cryptographic signing via the Node `crypto` module, public key embedded in verification pages. Rotation requires re-signing active markers |
| ADR-005 | Turbopack | The default bundler in Next.js 16, used for both dev and production builds |
| ADR-006 | Resend for email | Adequate free tier. Ghost marker notifications, contact form, error reports |
| ADR-007 | Upstash Redis for rate limiting | Serverless Redis over REST, with five tiers. Fails open when unreachable |
| ADR-008 | Flat design foundation | Solid surfaces, 1px borders, red glow spent only on CTAs and verified markers. See [DESIGN.md](../DESIGN.md) |
| ADR-009 | `proxy.ts` over `middleware.ts` | Auth0 v4 requires a specific middleware setup. A single proxy handles auth and subdomain routing together |
| ADR-010 | Open Collective over Stripe | Transparent community funding, with no payment processing on the platform |
| ADR-011 | Single-app monorepo | The root `package.json` delegates into `my-app/`. One Vercel project serves both marketing and app routes |
| ADR-012 | PostHog for analytics | Vercel Analytics for traffic, PostHog for behavioral funnel tracking |

### Authentication

#### Flow

```text
User → Auth0 login → Auth0 callback → proxy.ts
                                         │
                                  Auth0 Post-Login Action
                                         │
                                  Webhook → /api/webhooks/auth0
                                         │
                                  Supabase: upsert profile
                                         │
                                  Redirect to dashboard
```

#### Key files

| File | Purpose |
|------|---------|
| `src/lib/auth0.ts` | The Auth0 client instance |
| `src/lib/auth0-management.ts` | Management API, used for identity linking |
| `src/proxy.ts` | Auth enforcement and subdomain routing |
| `src/app/api/webhooks/auth0/route.ts` | Profile sync webhook |

#### The Post-Login Action

The Action syncs the user to the Supabase `profiles` table on every login. Without it enabled, new users loop after login because no profile row is ever created. Required secrets are listed in `my-app/.env.example`.

### Security

#### Trust boundaries

```text
Internet → Vercel edge → Vercel serverless → Supabase
                │                             │
           Auth0 SDK                    Auth0 webhook
           (session)                    (profile sync)
```

#### Key controls

| Control | Implementation |
|---------|----------------|
| Rate limiting | `withRateLimit()` on every mutating route |
| Input validation | A Zod schema before every database query |
| Body size limits | `rejectOversized()` rejects payloads over 1 MB |
| CSRF | Auth0 session cookies, httpOnly and secure |
| CSP | Per-route `frame-ancestors` in `next.config.ts` |
| Secrets | Server-only environment variables, never sent to the browser |
| Webhook auth | `X-Webhook-Secret` header verification, plus signature checks on Open Collective |

#### The rule that breaks things

`createServiceClient()` bypasses RLS. A service-role query with no authorization check above it is a public write endpoint. This is the single most important security invariant in the codebase.

### Deployment

| Setting | Value |
|---------|-------|
| Build command | `npm run build`, which runs `cd my-app && npm run build` |
| Framework | Next.js |
| Node.js | 22.x |
| Domains | `butwalhacks.com`, `app.butwalhacks.com` |
| Cron | `/api/health` daily at 06:00, Google Calendar sync at 07:17 |

The full environment variable list is in `my-app/.env.example`, and where each one is set is in [MAINTAINERS.md](../MAINTAINERS.md#secrets-inventory).

CI runs nine jobs on pull requests: lint, typecheck, tests, build, security audit, secrets audit, Auth0 M2M verification, AI review, and the dead-code audit.

### Coding standards

#### TypeScript

- Strict mode is on. No `any` in new code; use `unknown` with a type guard.
- If an `any` is genuinely unavoidable, leave a `// ponytail:` comment explaining why.
- Prefix unused parameters with `_`.

#### File naming

| Pattern | Example | Used for |
|---------|---------|----------|
| `page.tsx` | `dashboard/hacker/page.tsx` | App Router pages |
| `route.ts` | `api/events/route.ts` | API route handlers |
| `kebab-case.ts` | `rate-limiter.ts` | Utility files |
| `__tests__/` | `lib/__tests__/validation.test.ts` | Co-located tests |

#### API routes

- `POST`, `PUT`, `PATCH`, and `DELETE` are wrapped in `withRateLimit()`.
- Input is validated with Zod before any database access.
- Auth is checked with `auth0.getSession()`, returning 401 when absent.
- Errors return `{ error: "message" }` and never leak a stack trace.
- Resource creation returns `{ status: 201 }`.

#### Database

- Two factories: an anon client for public reads, a service client for writes.
- Migrations are SQL files in `supabase/migrations/`, numbered sequentially.
- Table-wide checks use `NOT VALID` plus a separate `VALIDATE CONSTRAINT`.
- New migrations read `auth.jwt() ->> 'sub'`. Migration 001 used `auth.uid()` inconsistently; do not copy it.

### Testing

| Level | Tool | Scope | CI |
|-------|------|-------|-----|
| Unit | Vitest | Single functions and components | Every PR |
| Integration | Vitest | API routes and server actions | Every PR |
| E2E | Playwright | Critical user flows | Every PR |

Tests live beside the code they cover:

```text
src/lib/__tests__/       # unit and integration tests
src/app/api/__tests__/   # API route tests
e2e/                     # Playwright E2E tests
```

Conventions:

- Mock Supabase with `vi.mock("@/utils/supabase")`. Tests never touch a real database.
- Auth-dependent E2E tests call `skipInCI()`, because Auth0 is not configured in CI.
- The baseline is 1495 tests across 102 files.

### Error handling

#### API routes

```ts
try {
  // handler logic
} catch (error) {
  console.error("[route-name]:", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
```

#### Client components

- Surface user-facing errors with a `sonner` toast.
- Never show a raw error message to a user.
- Report to Sentry in production.

#### Server actions

Return a structured `{ success: boolean; error?: string }`. Do not throw.

#### Distinguishing failures

`src/lib/supabase-error.ts` maps PostgREST codes to distinct messages so a failure is identifiable from the message alone. `"This feature is being set up"` means a stale PostgREST schema cache, `"You do not have permission to do that"` means RLS, and a Supabase-unconfigured message means the integration is not wired. `src/lib/logger.ts` forwards `error` level logs to Sentry with an `errorId` so a toast can be traced back to a report.

### By the numbers

| Measure | Count |
|---------|-------|
| API route files | 58 |
| API handlers | 65 |
| Pages and layouts | 109 |
| React components | 159 |
| Files in `src/lib` | 150 |
| Database migrations | 91 |
| Design tokens | 58 |
| Roles | 5 |
| Tests | 1495 across 102 files |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| A route is publicly writable | A `createServiceClient()` call with no auth check above it | Add the check; see [Access control](../AGENTS.md#access-control) |
| New users loop after login | The Auth0 Post-Login Action is disabled | Enable it so the profile is created |
| Tests fail only in CI | An E2E test touches Auth0 | Wrap it in `skipInCI()` |
| A mutation route is unthrottled | `withRateLimit()` was not applied | Wrap the handler; see [AGENTS.md](../AGENTS.md#api-routes) |
| Every Supabase failure looks identical | An error was collapsed to one string | Use `src/lib/supabase-error.ts` for distinct messages |
| Deploy fails at the migration step | `SUPABASE_DB_URL` cannot run DDL | Use a direct or session-pooler connection string |

## See also

| Document | Covers |
|----------|--------|
| [PRODUCT.md](../PRODUCT.md) | Mission, users, route zones, roadmap |
| [DESIGN.md](../DESIGN.md) | Colors, typography, utility classes |
| [AGENTS.md](../AGENTS.md) | Setup, gates, conventions, access control |
| [SECURITY.md](../SECURITY.md) | Vulnerability reporting |
| [MAINTAINERS.md](../MAINTAINERS.md) | Secrets, deploy, CI, rollback |
| `my-app/.env.example` | Every environment variable |
