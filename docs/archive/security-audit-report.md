# Security Audit Report - Butwal Hacks

**Date:** 2026-07-13
**Scope:** `my-app/` (Next.js 16 + Auth0 + Supabase)
**Methodology:** Source code review (read-only), 43 API routes audited, proxy middleware, CSP headers, dependency graph, webhook handlers, rate limiter implementation.

## Executive Summary

Butwal Hacks is in moderately good shape for an AI-generated application. Core authentication, authorization, and input validation patterns are correct. However, there are 1 critical, 3 high, and 4 medium findings that must be addressed before production. The most dangerous issue is an unsigned webhook that can mutate the database.

| Severity | Count | Priority |
|----------|-------|----------|
| Critical | 1 | Immediate |
| High | 3 | This week |
| Medium | 4 | This month |
| Low | 4 | Before launch |

---

## Critical (Will be exploited immediately)

### Open Collective webhook has conditional signature verification

**File:** `src/app/api/webhooks/opencollective/route.ts`
**Current implementation:** HMAC-SHA256 signature verification is implemented using the `x-webhook-signature` header when `OC_WEBHOOK_SECRET` is configured. `withRateLimit` is applied (bulk tier, 30 req/min). `withPayloadLimit` rejects oversized payloads before parsing.

**Remaining risk:** Verification is optional. When `OC_WEBHOOK_SECRET` is not set, the endpoint processes requests without signature verification. In production, the secret must be configured and requests without a valid signature must be rejected with 401.

---

## High (Major vulnerabilities)

### CSP in report-only mode with `unsafe-inline` and `unsafe-eval` bypasses

**File:** `next.config.ts` (lines 28-30)

```ts
script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} ...;
style-src 'self' 'unsafe-inline';
```

The `Content-Security-Policy-Report-Only` header name (line 53) means the browser **reports violations but does not block them**. Combined with `'unsafe-inline'` on both `script-src` and `style-src`, the CSP provides **zero practical protection** against XSS:

- `'unsafe-inline'` on `script-src` permits any inline `<script>` tag → an attacker who can inject HTML can execute arbitrary JavaScript.
- `'unsafe-inline'` on `style-src` permits any inline `<style>` block → data exfiltration via CSS injection.
- In dev mode, `'unsafe-eval'` is also allowed → `eval()`, `setTimeout(String)`, and similar vectors work.

**Impact:** If any XSS vulnerability exists in user-rendered content (see below), the CSP will not stop it. The CSP Report-Only endpoint (`/api/csp-violation`) is correctly configured but is only monitoring, not enforcing.

**Fix:** 
1. Switch `Content-Security-Policy-Report-Only` to `Content-Security-Policy` (enforcement).
2. Remove `'unsafe-inline'` from `script-src` - use a nonce or hash for inline scripts.
3. Remove `'unsafe-inline'` from `style-src` - use a nonce for critical inline styles.
4. Remove `'unsafe-eval'` entirely (even in dev - use source maps instead).

### `dangerouslySetInnerHTML` on user-facing pages without sanitization

**Files:** 
- `src/app/(main)/chapters/page.tsx` (line 137)
- `src/app/(main)/community/page.tsx` (line 24)
- `src/app/(main)/explore/page.tsx` (line 27)
- `src/app/(main)/events/daydream-butwal-september-2024/page.tsx` (line 40, JSON-LD)
- `src/app/layout.tsx` (lines 75, 82, JSON-LD)

**Impact:** The first three files use `dangerouslySetInnerHTML` to render content that may include user-supplied data. If any of this content contains unsanitized HTML (e.g., a chapter description, a community post body, an explore card), an attacker can inject script tags.

The JSON-LD usages in layout.tsx and events pages are low-risk (static content), but the chapters, community, and explore files need verification that the content source is sanitized or trusted.

**Fix:** Audit each usage. If the content includes any user-supplied data, apply `sanitizeString()` from `@/lib/validation` or use a proper HTML sanitizer like `DOMPurify` on the client side.

### `withRateLimit` not applied to all API routes

**Files lacking rate limiting:**
- `src/app/api/cron/cleanup-expired/route.ts` - should use CRON_SECRET
- `src/app/api/csp-violation/route.ts` - no rate limit on POST
- `src/app/api/heartbeat/route.ts` - acceptable (health check)
- `src/app/api/tasks/route.ts` (GET handler) - No rate limit on list operations
- `src/app/api/tasks/[id]/route.ts` (DELETE handler) - No rate limit on delete
- `src/app/api/verify/[bhId]/route.ts` - No rate limit on public verification endpoint
- `src/app/api/report-error/route.ts` - Client error reporting, no rate limit

**Impact:** The `/api/verify/[bhId]` endpoint is a public GET that has no rate limiting. An attacker can enumerate BH-IDs by iterating through IDs and checking response codes. While this is low-sensitivity data (name, role, XP), it enables user enumeration.

**Fix:** Add `withRateLimit` to all public-facing GET endpoints (at minimum `verify/[bhId]`). Add it to mutation endpoints that lack it (DELETE tasks).

---

## Medium (Defense in depth failures)

### Auth0 webhook secret check is optional

**File:** `src/app/api/webhooks/auth0/route.ts` (lines 24-32)

```ts
if (AUTH0_WEBHOOK_SECRET) {
  const headerSecret = req.headers.get("x-webhook-secret");
  if (!headerSecret || headerSecret !== AUTH0_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
  }
}
```

In staging/dev environments where `AUTH0_WEBHOOK_SECRET` is unset, **anyone can POST to this endpoint** and create or modify user profiles. The endpoint uses `withRateLimit("bulk")` which provides some protection (30/min), but an attacker can still create 30 fake profiles before being rate-limited.

**Fix:** Always require the webhook secret in production. In dev, consider adding a log warning when the secret is unset.

### Cloudinary signed uploads allow arbitrary folders despite auth

**File:** `src/app/api/cloudinary-signature/route.ts` (line 76)

```ts
const folder = `butwal-hacks/${userId}`;
```

The upload signature ties the folder to the authenticated user's Auth0 ID, but the **client-side upload is not enforced to use this signature**. A malicious client could:
1. Request a signature for `avatar` entity_type
2. Upload to a different Cloudinary folder using unsigned upload preset
3. Overwrite other users' files

The `upload_preset` being `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` is public by definition, so anyone can upload to that preset. The signature verification prevents folder manipulation, **provided** the client sends the signature. This needs to be enforced server-side on the final upload.

**Fix:** Add server-side verification that the uploaded file ends up in the expected folder. Consider using Cloudinary's `incoming_transformation` on the upload preset to restrict sizes and formats.

### Supabase Service Role Key bypasses RLS

**Observation across all API routes:** Every database mutation uses `createServiceClient()`, which uses the **Service Role Key** - this bypasses all Row-Level Security (RLS) policies.

**Impact:** This is an intentional design choice (the project uses Auth0 for auth, not Supabase Auth), but it means:
- Every API route is **one auth bypass away** from full database access.
- RLS policies exist in the migrations but provide zero protection because the service role key bypasses them.
- If any API route forgets an auth check (session verification), the service client will happily execute the request without restriction.

**Mitigation in place:** Every audited mutation endpoint verifies the Auth0 session before executing. However, this pattern is fragile - a single missing `if (!session?.user)` check on any route exposes the full database.

**Fix:** This is architecturally intentional but should be documented as a risk. Consider creating a *scoped* service client for read-only operations and a separate one for mutations as defense-in-depth.

### Search input validation regex blocks Devanagari

**File:** `src/lib/validation.ts` (line 23)

```ts
if (!/^[a-zA-Z0-9\s\-'_]*$/.test(input))
```

This regex blocks non-Latin characters, which is a **localization issue** - the platform serves Nepali users. A user searching in Devanagari script (e.g., "ह्याकाथन") will be blocked.

**Fix:** Use a blocklist approach instead of an allowlist, or expand the regex to include Unicode script characters.

---

## Low (Best practices)

### GET endpoints without rate limiting on public routes

The following GET endpoints have no rate limiting:
- `/api/verify/[bhId]` - Public verification endpoint, enumerable
- `/api/tasks` (GET) - Authenticated but no rate limit
- `/api/projects` (GET) - Check if this is rate-limited

**Fix:** Apply `withRateLimit` to public GET endpoints with a high-but-reasonable limit (e.g., 60/min).

### `CRON_SECRET` not enforced on cron endpoints

**File:** `src/app/api/cron/cleanup-expired/route.ts` and `daily-stats/route.ts`

Cron endpoints should verify a `CRON_SECRET` header. Without it, anyone who discovers the endpoint URL can trigger cleanup operations or stats generation.

### Next.js `poweredByHeader` disabled but Vercel headers still leak

`X-Powered-By: Next.js` is disabled ✅, but Vercel adds `server: Vercel` and `x-vercel-*` headers that reveal the hosting provider. Low risk.

### No input size limits on non-Zod checked routes

Some routes parse JSON without checking content-length first (e.g., OpenCollective webhook does have a size check but others like the GitHub sync route don't validate body size before parsing). `withPayloadLimit` is applied to some routes (`contact`, `issue-marker`, `checkin`) but not all.

---

## Findings by Phase

### Phase 1: Secret and Key Hunt
| Check | Status | Finding |
|-------|--------|---------|
| Hardcoded secrets in source | Pass | No keys found in `src/` |
| `.env` tracked in git | Pass | Not tracked |
| `NEXT_PUBLIC_` secret keys | Pass | No secrets exposed via public prefix |
| Server-only env vars | Pass | `SUPABASE_SERVICE_ROLE_KEY`, `AUTH0_SECRET`, etc. are server-only |
| Ed25519 signing keys | Pass | `SIGNING_PRIVATE_KEY`/`SIGNING_PUBLIC_KEY` via env only |

### Phase 2: Authentication and Authorization

| Check | Status | Finding |
|-------|--------|---------|
| proxy.ts subdomain auth | Pass | Routes work, `/portal/` and `/dashboard/` protected |
| API routes verify session | Pass | All audited routes call `auth0.getSession()` |
| Role check on sensitive endpoints | Pass | `issue-marker`, `webhooks/proxy`, `annual-report` check roles |
| IDOR prevention | Pass | Tasks API verifies workspace membership before access |
| `role` from client body | Pass | No route trusts a client-provided `role` |
| Service role key usage | Note | All mutations use service client (bypassed RLS), but auth is verified |

### Phase 3: Input Validation

| Check | Status | Finding |
|-------|--------|---------|
| Zod schemas on POST/PATCH | Pass | ~15 routes use Zod schemas |
| XSS sanitization | Partial | `sanitizeString()` strips HTML tags but `dangerouslySetInnerHTML` used in 3 pages |
| SQL injection | Pass | No raw SQL or `.rpc()` with unsanitized inputs |
| Search input validation | Issue | Regex blocks Nepali/Devanagari characters |

### Phase 4: Webhook Forgery

| Check | Status | Finding |
|-------|--------|---------|
| Auth0 webhook signature | Pass | `x-webhook-secret` verified when configured |
| Open Collective webhook | Fail | No signature verification, no auth, mutates DB |
| Webhook proxy auth | Pass | Requires maintainer/organizer role |

### Phase 5: Infrastructure and Rate Limiting

| Check | Status | Finding |
|-------|--------|---------|
| Rate limiting on POST routes | Pass | `withRateLimit` applied to most mutation routes |
| Rate limiting on GET routes | Fail | Public verify endpoint, tasks list have no rate limits |
| CSP enforcement | Fail | Report-only mode with `unsafe-inline` bypasses |
| HSTS | Pass | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | Pass | `DENY` |
| X-Content-Type-Options | Pass | `nosniff` |
| Permissions-Policy | Pass | Camera/mic/geo disabled |
| Referrer-Policy | Pass | `origin-when-cross-origin` |
| CORS | Note | Not explicitly configured, relies on same-origin by default |

---

## Recommended Fix Priority

1. **C-01** - Add `OC_WEBHOOK_SECRET` HMAC verification to Open Collective webhook (30 min)
2. **H-01** - Switch CSP to enforcement, remove `unsafe-inline`, add nonces (2 hours)
3. **H-02** - Audit `dangerouslySetInnerHTML` usages, sanitize or remove (1 hour)
4. **H-03** - Add rate limiting to public GET endpoints and uncovered mutations (30 min)
5. **M-01** - Make Auth0 webhook secret required in production (15 min)
6. **M-02** - Enforce Cloudinary folder constraints server-side (1 hour)
7. **M-03** - Consider scoped clients or verify RLS strategy (2 hours, architectural)
8. **M-04** - Fix search regex to support Devanagari (15 min)
9. **L-01..04** - Address before production launch

---

*Audit performed by Security Audit Agent. This is a read-only assessment - no code was modified.*
