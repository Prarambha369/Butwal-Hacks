# Platform Constraint Checklist - Butwal Hacks

Every hard ceiling, timeout, payload limit, and connection boundary the project must respect.
Read this before deploying any new API route, server action, or external integration.

## 1. Vercel (Serverless Functions)

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

### Current posture

| Item | Status | Notes |
|------|--------|-------|
| Execution timeout set explicitly | ⚠️ Partial | Timeouts set on 7 external API call routes (Resend, Groq, GitHub). Remaining routes use Vercel default 300s. |
| Body size validated before parsing | ✅ All 16 POST routes | `rejectOversized(req)` helper in `validation.ts` rejects > 1 MB payloads with 413 before body parsing. Webhook already had its own check. |
| Response size management | ⚠️ Partial | Badges endpoints set cache headers; others return unbounded arrays. `event_registrations` could exceed 4.5 MB. |
| Memory-sensitive operations | ⚠️ Partial | AI extraction (`/certificates/extract`) sends image URLs to Groq - OK. But Auth0 webhook reads entire body into memory. |


## 2. Supabase (PostgreSQL + API)

| Ceiling | Free | Pro | Applies to |
|---------|------|-----|------------|
| **Direct DB connections** | 60 | 60–500 (scalable) | Server components + API routes + server actions |
| **Connection pooler clients** | 200 | 200–12,000 | PgBouncer via `SUPABASE_URL` with `?pgbouncer=true` |
| **Database size** | 500 MB | 8 GB (scalable to 16+ TB) | All tables + migrations |
| **Rows per query response (default)** | 1,000 | 1,000 | All `.select()` calls without pagination |
| **Max request body size** | ~10 MB | ~10 MB | API requests to Supabase REST API |
| **Edge Function timeout** | 150s | 400s | (Not used - all serverless) |
| **Edge Function CPU execution** | 2s / request | 2s / request | (Not used) |

### Current posture

| Item | Status | Notes |
|------|--------|-------|
| Connection pooling configured | ❌ Not configured | Both `createClient()` (anon) and `createServiceClient()` (service role) create direct connections. No PgBouncer integration. |
| Connection reuse | ❌ New client per call | Every API route + server action creates a new Supabase client. ~80+ call sites. |
| Query pagination | ⚠️ Partial | Most GET routes still return unbounded results. Some newer routes implement cursor/offset pagination. |
| Row limits on `.select()` | ❌ Not set | Default 1,000 row limit applies silently. Queries returning >1,000 rows get truncated with no warning. |
| Service role key exposure | ⚠️ Controlled | `createServiceClient()` used only in webhooks and admin actions - correct pattern. |

### Connection pool pressure estimate

Under concurrent load (e.g., 30 users hitting different API routes simultaneously):
- Each route creates 1–3 Supabase clients (auth check, profile lookup, main query)
- 30 concurrent users × 2 clients = **60 connections** - exhausts free tier's 60 direct connections
- Mitigation: Enable PgBouncer, or cache clients where possible


## 3. Upstash Redis (Rate Limiting)

| Ceiling | Free | Paid | Applies to |
|---------|------|------|------------|
| **Monthly commands** | 500,000 | Unlimited | Rate limiter checks |
| **Max request/response size** | 10 MB | 10–100 MB | Rate limiter payloads |
| **P99 latency SLA** | None | None | Redis read/write |

### Current posture

| Item | Status | Notes |
|------|--------|-------|
| Rate limiting applied | ✅ All 16 mutation routes | All POST endpoints (14 auth + 2 public + webhook) use `checkRateLimit()`. Only GET routes exempt. |
| Fallback behavior | ⚠️ Silent fallback | If `UPSTASH_REDIS_REST_URL` is not set, `limiter` is `null` and rate limiting is silently skipped - in production and development. |
| Global circuit breaker | ❌ Not implemented | A DDoS from 1,000 IPs would exhaust 500K monthly commands in ~2 minutes. |

### Rate limit math (free tier)

```
Rate limit: 5 req / 60s per IP
Cost per check: 1 Upstash command
500,000 commands / month ÷ 2 routes = 250,000 checks per route
250,000 checks ÷ 5 req per window = 50,000 windows per route per month

Worst case: 1,000 IPs × 5 requests each = 5,000 checks per 60s window
5,000 checks × 86,400 windows per day = 432M commands - would exhaust free tier in minutes
```

**Conclusion:** The free Upstash tier is sufficient for low-traffic beta but will not survive any DDoS or traffic spike.


## 4. Auth0 (Authentication)

| Ceiling | Free (Developer) | Pro | Notes |
|---------|-----------------|-----|-------|
| **Monthly active users** | 7,000 (free) | Unlimited | Current: < 1,000 |
| **OAuth providers** | 2 social connections (free) | Unlimited | Google configured |
| **Webhook rate limit** | Not documented | Not documented | Auth0 retries failed webhooks |
| **JWT token size** | 4 KB | 4 KB | Standard claims |
| **API rate limit** | 5 req/s (free) | 10 req/s | For Management API calls |

### Current posture

| Item | Status | Notes |
|------|--------|-------|
| Webhook secret configured | ✅ Auth0 Action | Post-Login Action sends user data to `/api/webhooks/auth0` |
| Auth0 Action configured | ⚠️ Required | Without it, new users won't get a Supabase profile |
| Webhook body size-limited | ✅ `rejectOversized` | All webhook routes check content-length before parsing |
| OAuth token storage | ⚠️ Via session | Auth0 session provides user identity, GitHub tokens stored in Supabase |


## 5. External API Ceilings

### Resend (Email)
| Ceiling | Free | Pro |
|---------|------|-----|
| Daily email limit | 100/day | 50,000+/month |
| Max attachment size | None (no attachments) | N/A |
| Timeout | ~30s (default fetch) | ~30s |

**Current:** ✅ Timeout applied - 5s on user-facing email (`contact`, `sponsor`), 10s on background email (`issue-marker`).

### Groq (AI Extraction)
| Ceiling | Free |
|---------|------|
| Rate limit | 30 req/min (concurrent), 7,200 req/day |
| Max tokens | Varies by model (llama-3.2-11b: 8K output) |
| Max image size | 20 MB per image |

**Current:** ✅ 30s timeout set on all Groq calls (`/certificates/extract`, `ai-team-match`, `generate-profile-summary`).

### GitHub API
| Ceiling | Authenticated |
|---------|--------------|
| Rate limit | 5,000 req/hr |
| Max repos per page | 100 |

**Current:** ✅ 15s timeout set on `/github/sync`. Requests 50 repos per page.

### Cloudinary (Signature)
| Ceiling | Free |
|---------|------|
| API requests | No documented limit |
| Upload size | 10 MB (default), 25 MB (if configured) |

**Current:** Cloudinary calls are pre-signed (client-side uploads). The `/sign-cloudinary` route generates signatures only - no large payloads pass through. **Correct approach.**


## 6. API Route Audit (27 Routes)

Each route is audited against: body size limit, timeout control, rate limiting, idempotency, cache headers, input validation, and status code granularity.

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
| `/sign-cloudinary` | POST | Auth0 | ✅ 1 MB | ❌ | ✅ (5/60s) | ❌ | - | ❌ | 200, 401, 413, 429, 500 |
| `/issue-marker` | POST | Auth0 | ✅ 1 MB | ✅ 10s | ✅ (5/60s) | ❌ | - | ❌ (manual check) | 200, 400, 401, 413, 429, 500 |
| `/github/sync` | POST | Auth0 | ✅ 1 MB | ✅ 15s | ✅ (5/60s) | ❌ | - | ❌ | 200, 400, 401, 413, 429, 500, 502 |

### Summary

| Pattern | Count | Percentage |
|---------|-------|-----------|
| Body size limit checked | **16 / 27** (59%) | All 16 POST routes with body parsing reject > 1 MB payloads via `rejectOversized` |
| Timeout set on external calls | **7 / 27** (26%) | Resend (contact, sponsor, issue-marker), Groq (certificates/extract), GitHub (github/sync) |
| Rate limiting applied | **16 / 27** (59%) | All 16 mutation routes via `withRateLimit` wrapper |
| Idempotency keys | **2 / 17 mutation routes** (12%) | events/register, projects |
| Cache headers on GET | **3 / 10 GET routes** (30%) | badges/issuer, badges/assertions, widget/[slugId] |
| Input validation (Zod/schema) | **15 / 17 mutation routes** (88%) | ✅ Strong |
| Status code 201 (created) | **1 / 27** | projects POST |


## 7. Server Action Audit (21 Actions)

Server actions (`"use server"`) are called from client components. They run as Vercel serverless functions
with the same constraints as API routes, but follow different patterns.

| Action File | Auth | Body Limit | Timeout | Error Handling | External API Calls |
|------------|------|-----------|---------|---------------|-------------------|
| `actions/projects.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/events.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/activity.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/rewards.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/admin.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/annual-report.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/api-keys.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/profile.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/project-details.ts` | None | ❌ | ❌ | Throws Error | None |
| `actions/feedback.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/sponsor-profile.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/issue-marker.ts` | Auth0 | ❌ | ❌ | Throws Error | Resend |
| `actions/moderation.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/impact.ts` | None | ❌ | ❌ | Throws Error | None |
| `actions/teams.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/xp.ts` | Service Role | ❌ | ❌ | Returns void | None |
| `actions/role-selection.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/search-profiles.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/skill-trees.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/sponsor-opportunities.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/task-actions.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/team-chat.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/team-matching.ts` | Auth0 | ❌ | ❌ | Throws Error | Groq (AI) |
| `actions/workspace-actions.ts` | Auth0 | ❌ | ❌ | Throws Error | None |
| `actions/generate-profile-summary.ts` | Auth0 | ❌ | ❌ | Throws Error | Groq (AI) |
| `actions/micro-credentials.ts` | Auth0 | ❌ | ❌ | Throws Error | None |

### Critical finding - error handling pattern

**All 21 server actions throw Errors instead of returning structured error responses.** 
This is different from API routes (which return `NextResponse.json({ error }, { status })`).
When a server action throws, Next.js returns a generic 500 to the client - the error message is
leaked in development but swallowed in production. No error is logged to any sink (since `logger`
is disabled in production).

### Key risk - AI-powered server actions

Three server actions call external AI APIs:
- `generate-profile-summary.ts` → Groq (no timeout, no retry)
- `team-matching.ts` → Groq (no timeout, no retry)
- `issue-marker.ts` → Resend (no timeout, no retry)

A slow or failed external API call blocks the serverless function for the full default TCP timeout.


## 8. Database Connection Audit

The project calls Supabase client constructors across ~80+ distinct call sites:

| Client type | Constructor | Where used | Count |
|------------|------------|-----------|-------|
| **Server anon** | `createClient()` in `utils/supabase/server.ts` | Server components, API routes, server actions | ~60 sites |
| **Server service** | `createServiceClient()` in `utils/supabase/service.ts` | Webhooks, admin actions, XP mutations | ~6 sites |
| **Browser** | `createClient()` in `utils/supabase/client.ts` | Client components (useEffect, event handlers) | ~20 sites |

### Per-request connection cost

A single API request typically creates **2–3 Supabase clients**:
1. `createAuthenticatedClient()` in the route handler → 1 client
2. Profile lookup sub-query → uses same client (good, not creating new ones)
3. Some routes call `createClient()` directly for public data → 1 additional client

Under 100 concurrent users hitting different routes:
- ~200 clients created on average
- Free tier limit: **60 direct connections** - connection pool exhausted
- Pro tier base: **60 direct connections** - also exhausted
- Pro tier with pooler: **200 clients** - barely within limits

### Connection pool audit by route type

| Route group | Clients per request | Estimated concurrent capacity (free) |
|------------|-------------------|--------------------------------------|
| Public GET routes (verify, badges/issuer) | 1 | ~60 concurrent users |
| Authenticated GET routes (notifications, certificates) | 2 | ~30 concurrent users |
| Authenticated POST routes (register, checkin, like) | 2–3 | ~20–30 concurrent users |
| Webhook (auth0) | 1 | ~60 concurrent calls |
| Server actions with auth | 2 | ~30 concurrent calls |


## 9. Critical Gaps Summary

### 🔴 Critical - Blocks production readiness

| Gap | Routes affected | Impact | Fix |
|-----|----------------|--------|-----|
| **No production logging** | All | ✅ **FIXED** - `lib/logger.ts` sends structured JSON to Axiom via HTTP ingest. Falls back to console in dev. |
| **No fetch() timeouts** | All external API calls (Resend, Groq, GitHub, Cloudinary) | ✅ **FIXED** - All 7 external `fetch()` calls now have timeouts (5s Resend, 10s background email, 15s GitHub, 30s Groq). `package.json` enforces Node >=20. |
| **No body size limits** | All 17 mutation routes | ✅ **FIXED** - All 16 POST routes (15 body-parsing + webhook) reject > 1 MB via `rejectOversized(request)` helper in `validation.ts` before body parsing. Returns 413. |
| **Connection pool mismatch** | All | Exhausts 60-connection pool under load | Enable PgBouncer or add connection pooling middleware |
| **No pagination on GET routes** | 10+ GET routes | Silent truncation at 1,000 rows | Add `range()` header or `limit/offset` params |

### 🟠 High - Should be addressed this quarter

| Gap | Routes affected | Impact | Fix |
|-----|----------------|--------|------|
| **No rate limiting on 25/27 routes** | All except contact + sponsor | ✅ **FIXED** - All 16 mutation routes now check `checkRateLimit()` before body parsing |
| **No idempotency on 15/17 mutation routes** | All except register + projects | Double-submission creates duplicate records | Accept `idempotency-key` header |
| **No cache headers on 7/10 GET routes** | events, projects, certificates, notifications, metrics | Unnecessary repeated DB queries | Add `Cache-Control: public, max-age=60` |
| **Server actions throw Errors** | All 25 actions | Generic 500 with no error detail | Return structured `{ success, error }` objects |
| **Graceful degradation missing** | All | Any dependency failure = 500 page | Add fallback UI per dependency |

### 🟡 Medium - Worth tracking

| Gap | Impact | Fix |
|-----|--------|-----|
| **Auth0 session verification** | Unauthenticated requests get 401 | Add startup health check for Auth0 |
| **Upstash free tier headroom unknown** | Rate limiting could be silently disabled | Add monitoring on Upstash command count |
| **vercel.json missing** | Functions use default 300s timeout everywhere | Explicitly set timeout per route group |
| **Webhook body loaded before Svix check** | OOM risk from large Svix-signed payloads | Add content-length check before `req.json()` |
| **No structured error correlation IDs** | Cannot trace errors across routes | Add `x-request-id` header to every response |


## 10. Deployment Gate Checklist

Attach this checklist to every deployment.

### Pre-deployment

- [ ] All `fetch()` calls have explicit `AbortSignal.timeout()` (5s for user-facing, 10s background, 15s GitHub, 30s Groq)
- [ ] All POST routes that parse a request body have a `content-length` check via `rejectOversized(request)` rejecting > 1 MB before `request.json()` - shared pattern in `lib/validation.ts`
- [ ] All mutation routes have rate limiting applied via `withRateLimit` wrapper
- [ ] All mutation routes that create resources have idempotency key support
- [ ] All GET routes that return lists have pagination (`limit` + `offset` or `Range` header)
- [ ] All GET routes have cache headers (`Cache-Control` or `CDN-Cache-Control`)
- [ ] Server actions return structured objects, not thrown Errors

### Platform ceiling check

- [ ] Total Supabase client calls per request ≤ 2
- [ ] Expected concurrent users × clients-per-request < Supabase connection pool limit
- [ ] Upstash monthly command budget estimated and not exceeded
- [ ] Function bundle size verified (< 250 MB)
- [ ] No API route will exceed 4.5 MB response body (if so, use streaming or pagination)

### External dependency check

- [ ] Resend daily email budget known and not exceeded
- [ ] Groq daily rate limit known and not exceeded (7,200 req/day on free)
- [ ] GitHub API rate limit known and not exceeded (5,000 req/hr)
- [ ] All new external dependencies have CSP directives updated in `next.config.ts`
- [ ] Every external `fetch()` has: timeout, error handling, retry strategy

---

## Maintenance

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
