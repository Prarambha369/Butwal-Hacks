# Security Architecture — Butwal Hacks

> **Audience:** Engineering maintainers and contributors.
> **Purpose:** Document the security model, trust boundaries, and operational practices so every contributor can make safe decisions.
> **Last updated:** July 11, 2026

---

## Table of Contents

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

## 1. Overview & Threat Model

The full threat model is maintained at [`docs/threat-model.md`](./threat-model.md). This document covers the **implemented security controls** — what exists today, how it works, and how to maintain it.

### Trust Boundaries

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
| Vercel → Supabase | Service role key (server-side only) | `createServiceClient()` in `utils/supabase/service.ts` |
| Auth0 → Vercel | Webhook secret verification | `X-Webhook-Secret` header check in `api/webhooks/auth0/route.ts` |
| Client → Supabase (anon) | RLS disabled, anon key with limited scope | Supabase configured with RLS disabled, service role for writes |

> **Key decision:** Supabase Auth is disabled. All authentication flows through Auth0. Supabase is used as a database only, accessed via the service role key for writes and the anon key for public reads.

---

## 2. Authentication & Authorization

### 2.1 Auth Provider

- **Provider:** Auth0 (Regular Web Application)
- **SDK:** `@auth0/nextjs-auth0` v4
- **Config:** `src/lib/auth0.ts` — single `Auth0Client` instance

### 2.2 Auth Flow

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

### 2.3 Middleware Protection

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

### 2.4 Server-Side Auth Patterns

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

**Using the authenticated Supabase client:**
```typescript
import { createAuthenticatedClient } from "@/utils/supabase/server";

const authClient = await createAuthenticatedClient();
if (!authClient) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const { supabase, userId } = authClient;
```

### 2.5 Role-Based Access Control (RBAC)

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

### 2.6 User ID Model

- **Auth0 ID format:** `auth0|{uuid}` — stored in `profiles.auth0_user_id`
- **Public ID:** `BH-YY-NNN` (e.g., `BH-26-001`) — stored in `profiles.bh_id` and `profiles.slug_id`
- **UUID (internal):** `profiles.id` — primary key, used for FK relationships in Supabase

> ⚠️ **Common pitfall:** Most tables use `profile_id` (UUID FK), NOT `auth0_user_id`. Server-side actions must resolve `auth0_user_id` → UUID before inserting/querying related tables. This is documented across the codebase in 17+ `ponytail:` comments.

---

## 3. API Security

### 3.1 Authentication Enforcement

All mutation endpoints require authentication. Two patterns:

1. **`createAuthenticatedClient()`** — returns `{ supabase, userId }` or `null` (used in most routes)
2. **`auth0.getSession()`** — returns session or `null` (used in admin/webhook routes)

### 3.2 Rate Limiting

Every mutation API route is wrapped with `withRateLimit()`. See §5.

### 3.3 Payload Size Limits

Every POST/PUT route calls `rejectOversized(request)` before parsing the body:

```typescript
const oversized = rejectOversized(request); if (oversized) return oversized  // Rejects > 1 MB
```

**Current coverage:** 13 API routes. See `lib/validation.ts` for the implementation.

> ⚠️ **Known ceiling:** `rejectOversized()` checks `Content-Length` header, which does not protect against chunked transfer encoding. Vercel edge infrastructure typically buffes and provides content-length in that case, but this is a documented risk.

### 3.4 Timeout Guards

All external API calls include timeouts:

| Endpoint | Timeout | Rationale |
|----------|---------|-----------|
| User-facing forms (contact, sponsor) | 5s | Slow email shouldn't block user |
| AI inference (chat, pitch, summary) | 20-30s | LLM inference takes longer |
| AI vision (certificate scanner) | 30s | Image processing is slower |
| GitHub API sync | 15s | GitHub can be slow for many repos |
| Background notification email | 10s | Generous window for Resend + HTML |

---

## 4. Database Security

### 4.1 Supabase Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Supabase Auth** | Disabled | Auth0 handles all authentication |
| **RLS** | Disabled | Service role key bypasses RLS; no anonymous writes |
| **Public anon key** | Used for public reads only | Publishable key, scoped to `public` schema |
| **Service role key** | Server-side only | Never sent to client, stored in env vars |

### 4.2 Supabase Clients

| Client | File | When to use |
|--------|------|-------------|
| `createClient()` | `utils/supabase/server.ts` | Public reads (anon key) |
| `createServiceClient()` | `utils/supabase/service.ts` | All writes, admin reads (service role key) |
| `createAuthenticatedClient()` | `utils/supabase/server.ts` | Writes scoped to authenticated user |
| `createClient()` (browser) | `utils/supabase/client.ts` | Public reads from client components |

### 4.3 No Raw SQL

The codebase uses the Supabase JS SDK exclusively. No raw SQL queries are constructed from user input. Zod schemas validate all input before it reaches Supabase query methods.

### 4.4 Column-Level Security

The service role key has full access to all tables. The anon key is restricted by Supabase project settings. No table-level or row-level security is configured — RBAC is enforced at the application layer.

---

## 5. Rate Limiting

### 5.1 Infrastructure

- **Provider:** Upstash Redis (serverless)
- **SDK:** `@upstash/ratelimit`
- **Pattern:** Sliding window, per-IP
- **Wrapper:** `withRateLimit(handler, tier)` in `lib/rate-limiter.ts`

### 5.2 Tiers

| Tier | Rate | Used by | Rationale |
|------|------|---------|-----------|
| `public_form` | 5 req/min | Contact form, sponsor inquiries | Public forms, low abuse risk |
| `sensitive` | 3 req/min | Issue marker, projects, reviews, GitHub sync, certificate extraction, AI pitch | Powerful operations, cost-sensitive AI calls |
| `user_action` | 5 req/min | Event registration, check-in, team ops, profile completion | Standard authenticated actions |
| `frequent` | 10 req/min | Profile updates, likes, AI chat, Cloudinary signatures, resource completion | Higher-frequency user interactions |
| `bulk` | 30 req/min | Auth0 webhook, webhook proxy | External services send bursts |

### 5.3 Graceful Degradation

When Upstash Redis is unreachable (or `UPSTASH_REDIS_REST_URL` is not set), rate limiting is silently skipped:

```typescript
if (!redis) {
  return { allowed: true, remaining: 999, reset: 0 };  // No limit in dev
}
```

> ⚠️ In production, a missing env var means no rate limiting — and no alert. Monitor `UPSTASH_REDIS_REST_URL` in Vercel dashboard.

### 5.4 Coverage

**19 mutation endpoints** are rate-limited. See [`lib/rate-limiter.ts`](../my-app/src/lib/rate-limiter.ts) for the full list.

**Not rate-limited:** GET endpoints (read-only), cron jobs (authenticated via cron secret).

---

## 6. Input Validation

### 6.1 Zod Schemas

All mutation endpoints use Zod schemas before processing data. The schemas:

1. **Validate types** — reject non-string inputs, malformed UUIDs, invalid emails
2. **Transform values** — strip HTML, trim whitespace, clamp lengths
3. **Sanitize output** — prevent XSS via stripped HTML tags

### 6.2 Validation Library

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

### 6.3 GET Query Params

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

### 6.4 Search Input

The blog search endpoint validates input via `validateSearchInput()` before passing to Supabase:

```typescript
const validation = validateSearchInput(rawValue);
if (!validation.valid) {
  // Return error — don't pass to Supabase
}
```

---

## 7. Webhook Security

### 7.1 Auth0 Webhook (`/api/webhooks/auth0`)

| Property | Implementation |
|----------|---------------|
| **Trigger** | Auth0 Post-Login Action |
| **Secret verification** | `X-Webhook-Secret` header compared to `AUTH0_WEBHOOK_SECRET` env var |
| **Body size check** | Rejects > 1 MB before parsing |
| **Outcome** | Creates/updates Supabase profile |

**Note:** Webhook secret verification is only enforced in production (when `AUTH0_WEBHOOK_SECRET` is set). In dev, the check is skipped.

### 7.2 Open Collective Webhook (`/api/webhooks/opencollective`)

> ⚠️ **Known ceiling:** No webhook signature verification on the Open Collective endpoint. Signature verification is only available on Open Collective Enterprise. The endpoint relies on the obscurity of the webhook URL.

### 7.3 Webhook Proxy (`/api/webhooks/proxy`)

Forwards events to Slack/Discord webhook URLs. Protected by authentication (requires `maintainer` or `organizer` role). No retry mechanism — best-effort delivery only.

### 7.4 Webhook Security Rules

1. **Every webhook must have a body size check** — `rejectOversized()` before `req.json()`
2. **Secrets in environment variables** — not in code or database
3. **Log the source** — every webhook handler logs the event type and source
4. **Fail closed** — if verification fails, return 401, not 200

---

## 8. CI/CD Security

### 8.1 CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs these security checks on every PR:

| Job | What it checks | Fails on |
|-----|---------------|----------|
| `secrets-audit` | Leaked API keys, credentials, private keys in tracked files | Critical findings |
| `ponytail-audit` | Dead code, unused deps, empty directories | N/A (informational) |
| `ai-review` | Architecture, security vulnerabilities, business logic | Critical findings |
| `auth0-m2m-verify` | Auth0 Management API access token validity | Auth failure |

### 8.2 Secrets Audit

Located at `.github/actions/secrets-audit/audit.mjs`. Scans all tracked files for:

- Supabase publishable/service role keys
- Anthropic, OpenAI, Stripe API keys
- GitHub personal access tokens
- Private key material (RSA, EC, DSA)
- Resend API keys
- Auth0 secret keys

Patterns distinguish real keys from placeholders (`YOUR_KEY`, `sk_test_...`).

### 8.3 Ponytail Audit (Dead Code)

Located at `.github/actions/ponytail-audit/audit.mjs`. Runs static analysis for:

- **Unused files** — files in `src/` not imported by any other file
- **Empty directories** — empty folders in the source tree
- **Unused dependencies** — packages in `package.json` never imported
- **Dead exports** — exported functions never imported elsewhere

Uses regex-based import scanning with 0 dependencies beyond Node.js stdlib. Understands Next.js file-based routing (skips `page.tsx`, `layout.tsx`, `route.ts`, etc.).

---

## 9. Secrets Management

### 9.1 Environment Variables

All secrets are stored in Vercel Environment Variables (production, preview, development). Locally, they live in `.env.local` (gitignored).

| Category | Variables | Sensitivity |
|----------|-----------|-------------|
| **Auth0** | `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_WEBHOOK_SECRET` | 🔴 Critical |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | 🔴 Critical (service key) |
| **Upstash** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 🟠 High |
| **Cloudinary** | `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | 🟠 High |
| **Resend** | `RESEND_API_KEY` | 🟠 High |
| **Groq** | `GROQ_API_KEY` | 🟠 High |
| **PostHog** | `NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_API_KEY` | 🟡 Medium |
| **Axiom** | `AXIOM_TOKEN`, `AXIOM_DATASET` | 🟡 Medium |

### 9.2 What NOT to do

- ❌ Hardcode secrets in source code (caught by `secrets-audit`)
- ❌ Commit `.env.local` to git (it's in `.gitignore`)
- ❌ Log secrets (the `logger` redacts sensitive fields)
- ❌ Pass secrets to client components (caught by Next.js compiler)

### 9.3 Key Rotation

If a secret is exposed:
1. **Immediately** rotate the key at the provider's dashboard
2. **Update** the Vercel environment variable
3. **Check** `secrets-audit` CI logs to confirm the leak is cleaned
4. **Document** the incident in the threat model inventory

---

## 10. CORS & Content Security

### 10.1 CORS Headers

CORS is set on a per-route basis for public API endpoints:

| Endpoint | `Access-Control-Allow-Origin` | Notes |
|----------|------------------------------|-------|
| `/api/v1/profile/:slugId` | `*` | Public REST API |
| `/api/verify/:bhId/embed` | `*` | Legacy embeddable widget (superseded by `/widget/:slugId`) |
| `/api/badges/assertions/:markerId` | `*` | OB3 assertion |
| `/api/badges/issuer` | `*` | OB3 issuer profile |

Internal API routes do not set CORS headers — they're only called from the same origin.

### 10.2 Content Security Policy

Defined in `next.config.ts`. Key directives:

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Blocks all unexpected origins |
| `script-src` | `'self'` + GA4 + Auth0 + `'unsafe-inline'` | Allows Next.js hydration, analytics |
| `connect-src` | `'self'` + Vercel + GA | API calls, analytics |
| `frame-ancestors` | `'none'` | Prevents clickjacking |
| `upgrade-insecure-requests` | present | Forces HTTPS |

> ⚠️ **Maintenance:** Every time a new external service is added, the CSP must be updated. The AI agent is likely to forget this step — it's on the PR checklist.

### 10.3 No iframe Embedding

`frame-ancestors: 'none'` prevents the site from being embedded in iframes on other domains. This is intentional — clickjacking protection takes priority over embedding compatibility.

The `/widget/:slugId` endpoint provides an embeddable version of the profile card, served as a standalone page with its own minimal layout.

---

## 11. Incident Response

### 11.1 Logging

- **Production:** Structured JSON logs sent to Axiom via HTTP ingest (`lib/logger.ts`)
- **Development:** Falls back to `console.*` methods
- **Analytics:** PostHog for user-facing events (`lib/analytics/server.ts`)
- **Catch-all:** `next.config.ts` uses `withAxiom` to capture Vercel platform logs

### 11.2 What to Log (and what not to)

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

### 11.3 Error Response Pattern

Every API route follows this pattern:

```typescript
try {
  // ... handler logic ...
} catch (err) {
  logger.error("[route-name] Error:", err);  // Logs to Axiom
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

### 11.4 Alerting

> ⚠️ **Not yet implemented.** There are no alerting thresholds configured. Production errors are visible in Axiom dashboards but no automated alerts fire. See [threat-model.md](./threat-model.md#t-007) for the upgrade path.

---

## 12. Security Checklist for PRs

Every PR should pass this checklist before merging:

### Authentication & Authorization

- [ ] New API route checks auth (`getSession()` or `createAuthenticatedClient()`)
- [ ] New page redirects unauthenticated users (`redirect("/auth/login")`)
- [ ] Role check enforced at layout level (not just individual page)
- [ ] User ID correctly resolved (`auth0_user_id` → UUID) for FK operations

### Input Validation

- [ ] POST body validated with Zod schema (not just `request.json()`)
- [ ] Query parameters validated with Zod (or `parsePagination()` for pagination)
- [ ] `rejectOversized()` called before body parsing
- [ ] Supabase queries use `.eq()`, `.in()` etc. — NOT raw string concatenation

### Rate Limiting

- [ ] New mutation endpoint wrapped with `withRateLimit(handler, "tier")`
- [ ] Chose the correct tier (see §5.2)
- [ ] No rate limiting on GET endpoints (unless they're expensive/costly)

### External Dependencies

- [ ] External API calls have timeouts (`AbortSignal.timeout()`)
- [ ] CSP directives updated for new external origins
- [ ] Webhook handlers have body size checks and optional signature verification

### Secrets

- [ ] No secrets hardcoded in source code
- [ ] New secrets added to `.env.example` and Vercel dashboard
- [ ] New secrets added to CI workflow if needed by tests

### Logging

- [ ] Error handlers log the error before returning
- [ ] Error responses don't leak internal details
- [ ] Sensitive data is not logged

---

## References

| Document | Location | Covers |
|----------|----------|--------|
| Threat Model | `docs/threat-model.md` | Full threat inventory, attack vectors |
| Authentication Setup | `docs/authentication.md` | Auth0 configuration, setup steps |
| CI/CD | `.github/workflows/ci.yml` | Automated security checks |
| Secrets Audit | `.github/actions/secrets-audit/audit.mjs` | Leaked credential detection script |
| Ponytail Audit | `.github/actions/ponytail-audit/audit.mjs` | Dead code detection script |
| Platform Constraints | `docs/platform-constraint-checklist.md` | Vercel, Supabase, Upstash limits |
| Ponytail Debt | `PONYTAIL-DEBT.md` | Documented shortcuts and deferred work |
