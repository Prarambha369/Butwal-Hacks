# Butwal Hacks — Agent and Contributor Guide

> The operating manual for anyone or anything changing this repository: setup, verification gates, conventions, and where things live. Owned by the core maintainers. Visual rules are in [DESIGN.md](DESIGN.md); engineering detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Contents

- [What this is](#what-this-is)
- [Who it's for](#who-its-for)
- [Quick actions](#quick-actions)
- [Reference](#reference)
  - [Repository layout](#repository-layout)
  - [Key files](#key-files)
  - [Access control](#access-control)
  - [TypeScript](#typescript)
  - [API routes](#api-routes)
  - [Database](#database)
  - [Testing](#testing)
  - [Commits](#commits)
  - [Before you open a PR](#before-you-open-a-pr)
- [Troubleshooting](#troubleshooting)
- [See also](#see-also)

## What this is

The single source of truth for changing this codebase without breaking it. It exists because the failure modes here are specific: a mutation route without rate limiting, a service-role query without an authorization check, or a hardcoded hex value instead of a design token. Each of those has broken something before.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| New contributors | Getting a working local environment |
| Autonomous coding agents | Knowing which gates must pass before stopping |
| Reviewers | The checklist a change is judged against |

## Quick actions

**Set up a working environment:**

```bash
git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks
npm install
cp .env.example my-app/.env.local   # then fill in your keys
git config core.hooksPath .husky/    # enables pre-commit lint + secrets audit
npm run dev                          # → http://localhost:3000
```

Root `package.json` is an npm workspace that delegates every script into `my-app/`. You can run `npm run <script>` from the root or from `my-app/` interchangeably.

**Run the verification gates — all four, every time:**

```bash
npx tsc --noEmit     # types
npm run lint         # ESLint, zero warnings
npm run test         # Vitest
npm run build        # production build
```

Do not open a PR until all four pass. If a gate cannot run locally, say so explicitly rather than reporting success.

## Reference

### Repository layout

```text
Butwal-Hacks/
  my-app/                  # Next.js 16 application
    src/
      app/                 # App Router pages and API routes
      components/          # React components
      lib/                 # Business logic, server actions, types
      hooks/               # Custom hooks
      utils/supabase/      # Client factories
      proxy.ts             # Auth + subdomain routing (Next.js 16 proxy, not middleware.ts)
    e2e/                   # Playwright E2E tests
  supabase/migrations/     # SQL migrations, sequentially numbered
  scripts/                 # Operational scripts
  docs/                    # Engineering documentation
  .github/workflows/       # CI, deploy, keep-alive
  vercel.json              # Deployment config and cron schedules
```

### Key files

| File | Responsibility |
|------|----------------|
| `src/proxy.ts` | Auth0 session enforcement, role gates, subdomain routing |
| `src/lib/auth0.ts` | Auth0 v4 client |
| `src/lib/auth0-management.ts` | Auth0 Management API for identity linking |
| `src/lib/dashboard-access.ts` | Single source of truth for dashboard predicates |
| `src/lib/rate-limiter.ts` | `withRateLimit()` and the tier table |
| `src/lib/supabase-types.ts` | The `Role` union — five roles |
| `src/lib/supabase-error.ts` | Maps PostgREST codes to distinct messages |
| `src/lib/logger.ts` | Forwards `error` level to Sentry with an `errorId` |
| `src/lib/i18n.ts` | English and Nepali strings |
| `src/app/globals.css` | All 58 `--bh-*` design tokens and the `bh-*` utilities |

### Access control

Five roles, defined in `src/lib/supabase-types.ts`:

```ts
export type Role = "hacker" | "organizer" | "maintainer" | "sponsor" | "lead";
```

| Role | Access |
|------|--------|
| `hacker` | Default. Own profile, events, teams, projects, trust markers |
| `organizer` | Own events from creation through seven days after they end (`ORGANIZER_GRACE_DAYS`). An organizer with no events may create the first one |
| `maintainer` | Maintainer role **and** a verified `@butwalhacks.com` Auth0 email. Fails closed if either is missing |
| `sponsor` | Event-scoped access, granted after organizer verification |
| `lead` | Valid role; falls through to the hacker dashboard |

`/portal/*` is sponsor plus verified maintainer. Organizers are excluded.

**Two rules that are not optional:**

1. Route guards call the predicates in `src/lib/dashboard-access.ts`. Do not re-derive role logic inline in a layout or page.
2. `createServiceClient()` bypasses RLS, so every call using it must be preceded by an authorization check. Service role plus no auth check equals a public write endpoint.

### TypeScript

- Strict mode is on. No `any` in new code; use `unknown` with a type guard.
- If an `any` is genuinely unavoidable, leave a `// ponytail:` comment explaining why.
- Prefer server components. Add `"use client"` only when you need hooks, state, or browser APIs.
- Prefix unused parameters with `_`.

### API routes

- `POST`, `PUT`, `PATCH`, and `DELETE` handlers are wrapped in `withRateLimit()`.
- Every request body is parsed through a Zod schema before it reaches the database.
- Auth is checked via `auth0.getSession()`; return 401 when absent.
- Errors return `{ error: "message" }` and never leak a stack trace.
- Resource creation returns `{ status: 201 }`.

```ts
import { withRateLimit } from "@/lib/rate-limiter";

export const POST = withRateLimit(handler);                  // user_action: 5/60s
export const POST = withRateLimit(handler, "sensitive");     // 3/60s
```

Rate limit tiers: `public_form` 5/60s, `sensitive` 3/60s, `user_action` 5/60s, `frequent` 10/60s, `bulk` 30/60s. The limiter fails open when Redis is unreachable.

### Database

- Migrations are SQL files in `supabase/migrations/`, sequentially numbered. They are the canonical schema.
- Table-wide checks use `NOT VALID` plus a separate `VALIDATE CONSTRAINT`.
- Read `auth.jwt() ->> 'sub'` in new migrations. Migration `001` used `auth.uid()` inconsistently; do not copy that pattern.
- Two client factories exist: anon for public reads, service role for writes.

### Testing

| Level | Tool | Location |
|-------|------|----------|
| Unit and integration | Vitest | `src/**/__tests__/*.test.ts` |
| End-to-end | Playwright | `my-app/e2e/` |

- Mock Supabase with `vi.mock("@/utils/supabase")`. Tests never touch a real database.
- Auth-dependent E2E tests use `skipInCI()`.
- Current baseline: 1495 tests across 102 files.

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add bento grid to homepage
fix: auth0 callback loop on logout
docs: update environment setup guide
chore: upgrade next.js to 16.3
refactor: extract rate limiter into lib/
```

### Before you open a PR

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build` all pass
- [ ] New mutation routes use `withRateLimit()`
- [ ] New inputs validated with Zod before any database access
- [ ] Every `createServiceClient()` call has an authorization check above it
- [ ] New env vars added to `.env.example` and to the secrets table in [MAINTAINERS.md](MAINTAINERS.md)
- [ ] New migrations are numbered sequentially and additive
- [ ] New UI uses design tokens, not literals — see [DESIGN.md](DESIGN.md)
- [ ] No secrets in the diff

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Redirect loop after login | Auth0 Post-Login Action disabled, so the profile is never created | Enable the Action; it syncs the user to Supabase |
| 500 on any protected route | Middleware auth failing — check `src/proxy.ts` and `AUTH0_SECRET` | See [MAINTAINERS.md](MAINTAINERS.md) on-call runbook |
| `NEXT_PUBLIC_SUPABASE_*` wrong only in production | Manual Vercel env drifted from the Supabase-managed value | Delete the manual entries and use the Supabase integration |
| Deploy fails at the migration step | `SUPABASE_DB_URL` is a transaction-pooler URL (port 6543) and cannot run DDL | Use a direct or session-pooler connection string |
| Rate limiting appears disabled | Redis unreachable and the limiter fails open | Check `UPSTASH_REDIS_REST_URL` and quota |
| Colors wrong in dark mode only | A literal hex bypassed the token | See [DESIGN.md](DESIGN.md) |

## See also

- [CONTRIBUTING.md](CONTRIBUTING.md) — the human-facing contributor guide
- [DESIGN.md](DESIGN.md) — visual system reference
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — architecture, ADRs, and engineering detail
- [MAINTAINERS.md](MAINTAINERS.md) — deploy, CI, secrets, rollback
- [SECURITY.md](SECURITY.md) — vulnerability reporting
- [PRODUCT.md](PRODUCT.md) — product identity and direction
