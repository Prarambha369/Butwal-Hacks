# Butwal Hacks — Security Remediation Report

**Date:** 2026-10-16
**Branch / commit:** `main` @ `3854f86`
**Scope:** P0 authorization defects and P1 access-control defects, per the remediation brief.

Every finding below was re-verified against this checkout before being acted on.
Where a previously reported finding did **not** reproduce, that is recorded as
corrected rather than silently dropped.

---

## 1. Verified findings, in remediation order

| # | Severity | Finding | Location (pre-fix) | Status |
|---|----------|---------|--------------------|--------|
| 1 | **Critical** | Self-service maintainer escalation | `lib/actions/role-selection.ts:35-48, 62-65` | Fixed + proven |
| 2 | **Critical** | Role approval gated on role alone | `lib/actions/role-selection.ts:180, 214` | Fixed + proven |
| 3 | **Critical** | Cross-user profile write | `lib/actions/profile.ts:10-49` | Fixed + proven |
| 4 | **Critical** | Trust-marker issuance had no role check | `lib/actions/issue-marker.ts:12-17` | Fixed + proven |
| 5 | **High** | `requireMaintainer` weaker than every layout | `lib/actions/admin.ts:11-25` | Fixed + proven |
| 6 | **High** | Open Collective webhook failed open | `api/webhooks/opencollective/route.ts:79-82` | Fixed + proven |
| 7 | **High** | Unfiltered bounty query could deactivate the wrong row | `api/webhooks/opencollective/route.ts:107-116` | Fixed + proven |
| 8 | **High** | PostgREST filter injection in search | `api/search/route.ts:36, 46` | Fixed + proven |
| 9 | **Medium** | `profile_badges` filtered on a nonexistent column | `api/badges/check/route.ts:20` | Fixed + proven |
| 10 | **Medium** | `resource_completions` written with a nonexistent column | `api/resources/complete/route.ts:27` | Fixed + proven |
| 11 | **Medium** | Impact report had no object-level authorization | `lib/actions/projects.ts:88-105` | Fixed + proven |
| 12 | **Medium** | Middleware failed open on a database error | `proxy-helpers.ts:57-60` | Fixed + proven |
| 13 | **Low** | Rate-limit fail-open was silent | `lib/rate-limiter.ts:60, 68-71` | Made observable |
| 14 | — | Static secret on the Auth0 webhook | `api/webhooks/auth0/route.ts` | **Not changed** — see §5 |

### Findings that did not reproduce

| Reported finding | Evidence |
|---|---|
| Auth0 webhook skips verification when unconfigured | `route.ts:61-64` already returns 401 when the secret is unset. Correct. |
| `NEXT_PUBLIC_GROQ_API_KEY` reaches the client bundle | The variable exists only in untracked `my-app/.env.local` and is **not referenced anywhere in `src/`**. Next inlines `NEXT_PUBLIC_*` at reference sites only, so it is not shipped. Hygiene issue, not an active exposure. |
| `is_banned` is never enforced | **`profiles.is_banned` does not exist** — not in any of the 98 migrations, and confirmed absent in production via `information_schema`. `toggleBanUser()` writes it, so the ban feature is broken rather than unenforced. See §4. |

---

## 2. What changed

### 2.1 Role assignment is now a decision, not a preference

`selectRole` accepts `hacker` only. `organizer`/`sponsor` go through
`requestRoleUpgrade`; `maintainer` and `lead` are assigned by maintainer tooling
or the Auth0 role-sync webhook. The old `@butwalhacks.com` suffix check is gone
because an address attribute of an account is not an authorization decision —
and it was case-sensitive while the layout gate it mirrored was case-folded, so
the two did not agree.

Approval now also refuses to grant a privileged role even if the stored row asks
for it, so `role_requests` can never be the mechanism that mints `maintainer`.

### 2.2 One maintainer predicate, used everywhere

Added `accessSubjectFor()` to `lib/dashboard-access.ts`, which builds the
subject from the **Auth0 session** (`email` + `email_verified`) and the profile's
`role`. `profiles.email` is not evidence that Auth0 verified an address, so it
cannot establish staff status.

`requireMaintainer()`, `getPendingRoleRequests()` and `approveRoleRequest()` all
now call the same `isMaintainer()` the layouts and the proxy already used. The
role lookup is also inspected and logged instead of discarded.

> **Operational note.** This is a deliberate tightening: a maintainer whose
> Auth0 address is unverified will now be refused by the admin actions, exactly
> as the maintainer layouts already refused them. Existing maintainers should
> verify their Auth0 email. No profile data is changed by this.

### 2.3 Caller identity is derived, never supplied

`updateProfile()` no longer takes a `userId`. On the service-role client the
only thing that stood between one member and another's profile was the
truthiness of a caller-supplied identifier. The target now comes from the
session. Two callers in `profile-form.tsx` were updated.

### 2.4 Credential issuance is authorized at the operation

`issueTrustMarker()` gained `requireIssuer()`. The maintainer role is not
treated as a fallback — a profile claiming `role='maintainer'` on a personal or
unverified address must clear the same staff predicate the layouts use.
Authorization runs *before* `resolveProfileId()`, because that call has the side
effect of creating a profile row for a caller that has none.

### 2.5 Webhooks fail closed on their real gate

Open Collective now returns **503** in production when `OC_WEBHOOK_SECRET` is
missing, instead of logging a warning and parsing an unauthenticated body. The
HMAC comparison, length pre-check and raw-body reading were already correct.

It also refuses a BH-ID-only expense. A BH-ID does not identify which bounty is
meant, and the old unfiltered `maybeSingle()` could have resolved against any
active bounty. Redeliveries are idempotent: a bounty already inactive is
acknowledged without a second write, and a failed update returns 500 so the
provider retries instead of treating it as synced.

### 2.6 Search terms are values, not filter syntax

`SEARCH_TERM_PATTERN` in `lib/validation.ts` (reused by the previously dead
`validateSearchInput`) excludes comma, parenthesis, period, colon and asterisk —
PostgREST's `or()` delimiters — while keeping letters, numbers, spaces and
`_ ' & + . -`, plus the Devanagari range for the bilingual directory.

### 2.7 Two permanently-500 routes now work

`/api/badges/check` and `/api/resources/complete` referenced `auth0_user_id` on
tables keyed by `profile_id` (migrations 008 and 035), so PostgREST returned
42703 and both answered 500 for every caller. Both now resolve the caller's
profile row first, filter on `profile_id`, and return 404 when no profile
exists rather than proceeding.

### 2.8 Object-level authorization on impact reporting

`generateImpactReport()` now permits the project owner, a member of the owning
team, the owning event's organizer, or a maintainer — and returns `null`
otherwise, which the route surfaces as 404 so "forbidden" does not confirm that
a project exists. The 500 path no longer echoes the upstream error message.

### 2.9 Middleware fails closed

`requireRole()` denied on a role-lookup failure instead of calling
`NextResponse.next()`, which opened `/dashboard/maintainer/*`,
`/dashboard/organizer/*` and `/portal/*` for the duration of any Supabase
incident. The layout remains the second gate.

### 2.10 Rate limiting is no longer silently off

The fail-open behaviour is retained **deliberately** — it is defence in depth,
not an authorization control, and failing closed would deny service to every
member during a Redis incident. It now logs at error level, because "rate
limiting silently off" was indistinguishable from "not triggered". The webhooks'
real gate is the shared secret, which fails closed independently.

---

## 3. Verification

Baseline before any change: **112 files / 1632 tests passing**, typecheck clean.
This required `npm run test` from the repository root; invoking `vitest`
directly at the root bypasses the workspace's `cd my-app` and the `@/` alias
fails to resolve.

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | **pass**, exit 0, no diagnostics |
| Lint | `npm run lint` | **pass**, exit 0, 0 errors, 0 warnings |
| Test | `npm run test` | **pass** — 114 files, **1687 tests** (+55) |
| Build | `npm run build` | **pass**, exit 0, compiled in 4.9s |
| Secrets audit | `node .github/actions/secrets-audit/audit.mjs` | **pass** — 744 files scanned, none found |
| Dependency audit | `npm audit --omit=dev --audit-level=high` | **pass** — 0 vulnerabilities |

The build emits two `Error fetching chapters` / `Error fetching approved
testimonials` lines during prerender. These are pre-existing, occur because the
build has no database, and are documented as environment drift in
`docs/SEO_AEO_GEO_AUDIT.md` §H. They are unrelated to these changes.

### Regression tests were validated against the vulnerable code

Each fix was reverted individually and the new tests re-run, following the
discipline `docs/SEO_AEO_GEO_AUDIT.md` §G established for the sitemap tests. A
test that cannot fail is not a regression guard.

| Reverted file | New tests that failed |
|---|---|
| `lib/actions/role-selection.ts` | 8 of 8 |
| `lib/actions/admin.ts` | 3 of 6 (the other 3 were already-passing guardrails) |
| `lib/actions/issue-marker.ts` | 8 of 8 |
| `api/webhooks/opencollective/route.ts` | 4 of 4 affected |
| `api/search/route.ts` | 1 of 1 affected |
| `api/badges/check` + `api/resources/complete` | 5 of 8 affected |

Two of my own tests caught real bugs in my own fixes and were corrected before
completion: a maintainer-fallback that re-granted the authority the staff-address
rule exists to withhold, and a mock chain that short-circuited the
`requireIssuer` filter.

---

## 4. Findings requiring a decision, not a code change

**`profiles.is_banned` does not exist.** Confirmed absent from all 98 migrations
and from the production database via `information_schema.columns`. Consequences:

- `toggleBanUser()` writes a nonexistent column, so the maintainer ban button
  fails with 42703. The feature is broken, not merely unenforced.
- Enforcement is impossible without a migration, which is out of scope here.
- `is_suspended` **does** exist (migration 001) and is likewise referenced by no
  authorization gate — only by `sitemap.ts`.

**Recommended, needs a maintainer decision:** decide whether suspension or
banning is the intended control, add it as a numbered migration, and then
enforce it in `accessSubjectFor()`'s callers so one predicate covers it. No
speculative migration was written.

**`verifyApiKey()` has no call sites.** Keys can be minted and revoked but
authenticate nothing. Either wire it to a documented consumer or document the
feature as issuance-only.

**`profile-resolver.ts` still uses `MAX(slug_id)+1`**, the non-atomic pattern
migration 088 exists to replace. Concurrent first-time logins can collide.

**Production drift:** `profiles.xp` still exists in production, so migration
128 has not been applied there. Repair through a reviewed migration process,
not by adding duplicate columns.

---

## 5. Deliberately not changed

**The Auth0 webhook's shared secret is not a signature.** It is a static
`x-webhook-secret` compared with `timingSafeEqual`. There is no HMAC, timestamp,
nonce or signature, so a captured request can be replayed indefinitely.

Changing this requires the **sender** to change: the caller is a custom Auth0
Post-Login Action defined in the tenant, not one of Auth0's documented
webhook products. Inventing a header the sender does not send would be theatre.
The honest options, both tenant-side:

1. Have the Action fetch a signed JWT (Auth0 documents issuing these from Rules
   and Actions) and verify that; or
2. Rotate `AUTH0_SECRET`/`AUTH0_WEBHOOK_SECRET` and treat the current scheme as
   authentication-by-possession only.

The handler is already idempotent — an existing profile is updated, a new one is
created via an atomic BH-ID RPC keyed on `auth0_user_id` — so duplicate delivery
is safe. The existing tests cover missing-secret, wrong-secret, missing-fields,
oversized-payload and upgrade paths.

---

## 6. Production-only checks that still require access

None of these were performed; each needs production credentials or dashboard access.

1. **Whether `AUTH0_WEBHOOK_SECRET` has been exposed.** Rotate and review Auth0
   tenant logs for unauthorised role grants if exposure is suspected.
2. **Whether `OC_WEBHOOK_SECRET` is actually set in the Vercel production
   environment.** If it is not, the new 503 will break bounty completion — check
   this *before* deploying.
3. **Whether any profile currently holds `role='maintainer'` on a non-staff or
   unverified address.** Those accounts were able to escalate and should be
   reviewed.
4. **Vercel production environment variables** — specifically whether
   `NEXT_PUBLIC_GROQ_API_KEY` or other sensitive values are set there. Cannot be
   inspected from here.
5. **Real GCP/window in the Open Collective audit log** — whether forged
   `expense.paid` deliveries reached production while verification was skippable.
6. **Applied migration history versus the canonical set**, to quantify the drift
   implied by `xp` still being present.
7. **Rate-limit posture in production** — confirm `UPSTASH_REDIS_REST_URL` is
   set, now that a missing value logs at error level on every request.

---

## 7. Residual risk

| Risk | Severity | Why it remains |
|---|---|---|
| Auth0 webhook secret is replayable | High | Requires a tenant-side sender change (§5) |
| `verifyApiKey()` unused | Medium | Feature ambiguity, not an active hole |
| Non-atomic BH-ID in `profile-resolver.ts` | Medium | Concurrency, not authorization |
| Rate limiting is IP-keyed and fails open | Medium | Deliberate availability trade; now observable |
| Production schema drift | Medium | Needs a reviewed migration process |
| No ban/suspension enforcement | Medium | The column does not exist (§4) |
| Unverified JWT claims cached as social URLs | Low | Token arrives over TLS from the token endpoint; Auth0 re-validates at link time |
| Chapter-subdomain rewrite does not check the registrable domain | Low | Contained by Vercel domain configuration |

## 8. Rollback

Each group is independently revertible. Group 1 and 2 are single-file changes
plus their tests; Group 3 is the webhook route; the P1 items are each isolated.

Two changes are behaviour-tightenings rather than pure bug fixes and deserve a
staged rollout:

- **`requireMaintainer()` now checks `email_verified`.** An existing maintainer
  with an unverified Auth0 address will lose admin access until they verify.
  Roll back `lib/actions/admin.ts` and `role-selection.ts` if that strands
  anyone before they can act.
- **`selectRole()` no longer self-assigns `maintainer`.** Any workflow that
  relied on it — onboarding a new maintainer — must go through the maintainer
  users page or the Auth0 role sync instead.

The Open Collective 503 (§2.5) should be verified against the production secret
value before deploying, or bounty completion will stop until it is set.