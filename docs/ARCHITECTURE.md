# Butwal Hacks — Architecture & Engineering Reference

> **Lean engineering reference.** For product details see `PRODUCT.md`. For design system see `DESIGN.md`. For the build roadmap see `AGENTS.md`.

---

## Architecture Overview

```
Browser ──► Vercel (Next.js 16) ──┬── Auth0 (Authentication)
                                   ├── Supabase (PostgreSQL Database)
                                   ├── Cloudinary (Image CDN)
                                   ├── Upstash Redis (Rate Limiting)
                                   ├── Resend (Transactional Email)
                                   └── Open Collective (Payments)
```

- **Subdomain routing:** `butwalhacks.com` (public) vs `app.butwalhacks.com` (dashboards/API) via `src/proxy.ts`
- **Auth:** Auth0 v4 SDK. Supabase Auth disabled — database only via Service Role Key.
- **RBAC:** 3 roles (Hacker, Organizer, Maintainer) enforced in middleware + API routes.

---

## Architectural Decisions

### ADR-001: Auth0 over Supabase Auth
Auth0 provides OAuth, MFA, Organizations (multi-chapter), and Post-Login Actions for webhook sync to Supabase. Supabase is database-only.

### ADR-002: Service Role Key (No RLS)
All backend queries use `SUPABASE_SERVICE_ROLE_KEY` bypassing RLS. Authorization lives in application code (Auth0 session checks), not database policies.

### ADR-003: Cloudinary for Media CDN
Signed uploads, auto-optimization, metadata tagging. Upload flow: client gets signature from `/api/cloudinary-signature`, uploads directly to Cloudinary.

### ADR-004: Ed25519 Trust Marker Signing
Cryptographic signing via Node.js `crypto` module. Public key embedded in verification pages. Key rotation requires re-signing active markers.

### ADR-005: Turbopack (Next.js 16 Default)
Turbopack is the default bundler in Next.js 16. Build logs confirm `▲ Next.js 16.3.2 (Turbopack)`.

### ADR-006: Resend for Email
Free tier (100/day). Ghost marker notifications, contact form, error reports.

### ADR-007: Upstash Redis for Rate Limiting
Serverless Redis via REST API. 5 tiers: `public_form`, `sensitive`, `user_action`, `frequent`, `bulk`.

### ADR-008: Flat Design (Kloner.app Foundation)
Solid white surfaces, 1px borders, selective red glow on CTAs and verified trust markers only. Full spec in `DESIGN.md`.

### ADR-009: Subdomain Routing via proxy.ts
Auth0 v4 requires specific middleware setup. Single `proxy.ts` handles auth + subdomain routing.

### ADR-010: Open Collective (No Stripe)
Transparent community funding. No payment processing on the platform.

### ADR-011: Monorepo (Single App)
Root `package.json` runs `cd my-app && npm run build`. Vercel preview serves both marketing and app routes.

### ADR-012: PostHog for Analytics
Vercel Analytics for traffic, PostHog for behavioral funnel tracking.

---

## Authentication

### Flow
```
User → Auth0 Login → Auth0 Callback → proxy.ts Middleware
                                           ↓
                                    Auth0 Post-Login Action
                                           ↓
                                    Webhook → /api/webhooks/auth0
                                           ↓
                                    Supabase: Upsert Profile
                                           ↓
                                    User redirected to Dashboard
```

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/auth0.ts` | Auth0Client instance |
| `src/proxy.ts` | Middleware: auth + subdomain routing |
| `src/app/api/webhooks/auth0/route.ts` | Profile sync webhook |

### Auth0 Post-Login Action
Syncs user to Supabase `profiles` table on every login. Without this Action, new users loop after login. See `my-app/.env.example` for required secrets.

---

## Security

### Trust Boundaries
```
Internet → Vercel Edge → Vercel Serverless → Supabase
                ↓                              ↓
           Auth0 SDK                      Auth0 Webhook
           (session)                      (profile sync)
```

### Key Controls
| Control | Implementation |
|---------|---------------|
| Rate limiting | `withRateLimit()` wrapper on all 30 mutation routes |
| Input validation | Zod schemas before every Supabase query |
| Body size limits | `rejectOversized()` rejects >1 MB on mutation routes |
| CSRF protection | Auth0 session cookies (httpOnly, secure) |
| CSP | Per-route `frame-ancestors` in `next.config.ts` |
| Secrets | Server-only env vars, never exposed to browser |
| Webhook auth | `X-Webhook-Secret` header verification |

### PR Security Checklist
- [ ] No secrets in code or logs
- [ ] Mutation routes use `withRateLimit()`
- [ ] Input validated with Zod before DB queries
- [ ] Service role key never reaches client code
- [ ] CSP updated if adding external domains

---

## Deployment

### Vercel Configuration
| Setting | Value |
|---------|-------|
| Root Directory | Repo root (`/`); app in `my-app/` |
| Build Command | `npm run build` (runs `cd my-app && npm run build`) |
| Node.js | 22.x |
| Domains | `butwalhacks.com` (primary), `app.butwalhacks.com` (subdomain) |

### Required Environment Variables
```
# Build
AUTH0_SECRET, AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Runtime
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_SECRET
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY, GROQ_API_KEY
```

See `my-app/.env.example` for the full list.

### CI/CD Pipeline
9 required checks on every PR: Lint, Typecheck, Tests, Build, E2E, Auth0 M2M Verify, Security Audit, Secrets Audit, Ponytail Audit.

---

## Coding Standards

### TypeScript
- Strict mode (`"strict": true`). No `any` in new code — use `unknown` with type guards.
- Unused params prefixed with `_`: `function handler(_req: Request) {}`

### File Naming
| Pattern | Example | Used For |
|---------|---------|----------|
| `page.tsx` | `dashboard/hacker/page.tsx` | App Router pages |
| `route.ts` | `api/events/route.ts` | API route handlers |
| `kebab-case.ts` | `rate-limiter.ts` | Utility files |
| `__tests__/` | `lib/__tests__/validation.test.ts` | Co-located tests |

### API Routes
- POST/PATCH/DELETE wrapped with `withRateLimit()`
- Input validated with Zod before DB access
- Auth checked via `auth0.getSession()` → 401 if missing
- Errors return `{ error: "message" }` (never leak stack traces)

### Database
- Two client factories: `createServerClient()` (anon) and `createServiceClient()` (service role)
- All writes use service role. Public reads use anon key.
- Migrations in `supabase/migrations/` (67 files, sequential numbering)

---

## Testing

### Levels
| Level | Tool | Scope | CI |
|-------|------|-------|-----|
| Unit | Vitest | Single functions, components | Every PR |
| Integration | Vitest | API routes, server actions | Every PR |
| E2E | Playwright | Critical user flows | Every PR |

### File Organization
```
src/lib/__tests__/           # Unit + integration tests
src/app/api/__tests__/       # API route tests
e2e/                         # Playwright E2E tests
```

### Conventions
- Mock Supabase with `vi.mock("@/utils/supabase")` — never hit real DB in tests
- E2E tests use `skipInCI()` for auth-dependent tests (Auth0 not configured in CI)
- 811 tests across 41 test files

---

## Error Handling

### API Routes
```ts
try {
  // ... handler logic
} catch (error) {
  console.error("[route-name]:", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
```

### Client Components
- Use `sonner` toast for user-facing errors
- Never expose raw error messages to users
- Log to Sentry in production

### Server Actions
Return structured `{ success: boolean; error?: string }` — never throw.

---

## Related Documentation

| Document | Content |
|----------|---------|
| `PRODUCT.md` | Product identity, 9-zone routes, RBAC, implementation status |
| `DESIGN.md` | Full design system (colors, typography, components, tokens) |
| `AGENTS.md` | Build roadmap, execution phases, agent protocol |
| `SECURITY.md` | Vulnerability reporting policy |
| `CONTRIBUTING.md` | Contributor setup guide |
| `MAINTAINERS.md` | Deploy, CI, secrets, rollback procedures |
| `my-app/.env.example` | Full environment variable reference |
