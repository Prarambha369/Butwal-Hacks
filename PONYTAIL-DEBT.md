# Ponytail Debt Ledger — Butwal Hacks

> Harvested from all `ponytail:` comments across the codebase (100+ markers in app source).
> Generated: 2026-07-14

---

## Deferrals (markers naming a ceiling **and** an upgrade trigger)

These are intentional shortcuts with a known path to revisit them:

| File | What | Ceiling | Upgrade Trigger |
|------|------|---------|-----------------|
| `src/lib/members.ts:2` | Static explorer data | Static array, not from Supabase | When real data sources are connected |
| `src/lib/metrics.ts:103` | Hardcoded metrics | Static numbers | When real data sources are connected |
| `src/lib/cache/edge-cache.ts:12` | Direct Upstash REST API | No Redis SDK layer | When cache pattern needs evolve |
| `src/lib/cache/edge-cache.ts:25` | Silent Redis fallback | Cache is no-op when Redis unconfigured | When Redis is production-ready |
| `src/lib/actions/team-matching.ts:11` | Overlap scoring | No vector DB | When MVP needs scale (1000+ profiles) |
| `src/lib/actions/generate-profile-summary.ts:82` | 30s AI timeout | Long inference timeout | When Groq latency improves |
| `src/lib/actions/feedback.ts:14` | In-memory rate limit | Resets on server restart | When deployed to multiple instances |
| `src/app/api/github/sync/route.ts:42` | 15s GitHub API timeout | Returns 502 on timeout | When GitHub API latency is understood |
| `src/app/api/github/sync/route.ts:88` | 50-repo pagination | Users with 50+ repos sync again | When users hit the limit |
| `src/app/api/certificates/extract/route.ts:35` | 30s AI vision timeout | Long inference timeout | When AI latency improves |
| `src/app/api/sponsor/route.ts:25` | 5s email timeout | Email send may timeout | When Resend latency is optimized |
| `src/app/api/contact/route.ts:25` | 5s email timeout | Email send may timeout | When Resend latency is optimized |
| `src/app/api/v1/issue-marker/route.ts:169` | 10s notification email timeout | Background email, generous window | When notification throughput matters |
| `src/app/api/admin/oc-sync/route.ts:39` | No sync tracking | last_sync is null | Upgrade path: add sync_log table |
| `src/app/api/admin/oc-sync/route.ts:131` | Skip FK-mismatch inserts | Silently skips unmatched data | When data integrity validation is needed |
| `src/components/projects/project-grid.tsx:61` | Client-side pagination | Fetches up to ~100 projects | When projects exceed 100 |
| `src/app/api/ai/chat/route.ts:13` | No vector DB | Context via system prompt | When RAG needs scale |
| `src/components/command-search.tsx:11` | No cmdk/kbar deps | Hand-rolled command palette | When keyboard UX needs grow |
| `src/components/swipe-navigator.tsx:17` | Native touch events | No gesture library | When gesture complexity grows |
| `src/app/api/cron/daily-stats/route.ts:15` | Single aggregation query | No incremental logic | When data volume grows |
| `src/app/api/cron/cleanup-expired/route.ts:15` | Batch delete | Single query for cleanup | When expiry volume grows |
| `src/app/api/admin/annual-report/route.ts:17` | Single query batch | One endpoint aggregates all | When report types multiply |
| `src/instrumentation.ts:44` | 100 records / 2s batch | OTel batch processor limits | When log volume exceeds defaults |
| `eslint.config.mjs:8-10` | Deprecated rule downgrades | 4 lint rules relaxed | When team is ready to address them |
| `public/sw.js:10` | Max 50 cached images | Fixed count limit | When offline image needs grow |

---

## ⚠️ No-Trigger Markers (deferral with **no upgrade path** — rot risk)

These name a simplification but don't say when to revisit them. They silently rot without an explicit trigger:

| File | Line | What | Risk |
|------|------|------|------|
| `src/app/(main)/transparency/page.tsx` | 117 | Contributor list + expense breakdown skipped | Content gap on transparency page, no trigger to fill it |
| `src/lib/i18n.ts` | 1 | English + Nepali translations only | No trigger to add more languages |
| `src/lib/pagination.ts` | 33 | hasMore = returned ≥ limit | Edge case: exact match means last page is ambiguous |
| `src/lib/analytics/server.ts` | 7 | Lazily initialized singleton | Could miss events on cold start |
| `src/lib/analytics/server.ts` | 95 | No app shutdown event | Flush on deploy loses in-flight events |
| `src/lib/emails/ghost-marker-notification.ts` | 1 | Inline HTML template | No template engine for more email types |
| `src/app/api/csp-violation/route.ts` | 11 | Fire-and-forget, no response body | CSP violations silently dropped on error |
| `src/app/api/heartbeat/route.ts` | 16 | Fire-and-forget, no response | Monitoring can't confirm it ran |
| `src/app/api/webhooks/proxy/route.ts` | 18 | Simple POST relay | No retry, lost webhooks on failure |
| `src/app/api/report-error/route.ts` | 18 | Single Resend email, no retry, no queue | Error reports silently lost on failure |
| `src/components/pwa-install-prompt.tsx` | 10 | One-shot install prompt | Users who dismiss never prompted again |
| `src/components/pwa-register.tsx` | 7 | Registers on mount | No offline-capable registration |
| `src/components/posthog-provider.tsx` | 65 | Stable deps omitted from useEffect | Stale closure risk if email/name change mid-session |
| `src/hooks/use-analytics.ts` | 14 | Direct posthog-js wrapper | No abstraction layer to swap providers |
| `src/app/api/events/checkin/route.ts` | 25 | Toggle checkin if not provided | Ambiguous intent — default behavior may surprise |
| `src/app/api/events/[eventId]/registrations/route.ts` | 19 | Join-based fetch | No pagination for large events |
| `src/app/api/webhooks/auth0/route.ts` | 21 | Content-length check | Chunked encoding bypasses the check (per threat model T-009) |
| `src/app/layout.tsx` | 107 | pb-16 for mobile bottom nav | Fixed margin, not dynamic based on nav visibility |
| `src/components/network-status.tsx` | 11 | One state, one effect, native events | No polling fallback for browsers that don't fire offline events |
| `src/components/mobile-bottom-nav.tsx` | 29 | No animation library | No transitions on navigation |
| `src/supabase/functions/resend-email/index.ts` | 31 | Inline HTML builders | No template engine |
| `src/supabase/functions/discord-bot/index.ts` | 66 | Allows @here/@everyone pings | Could be abused for spam on critical events |

---

## Implementation Notes (not deferrals — just documenting the approach)

These `ponytail:` comments document *why* something is structured a certain way. Not debt, but useful reference:

| Count | Pattern | Example |
|-------|---------|---------|
| ~15 | Auth0 → UUID resolution pattern | "Look up profile UUID for profile_id FK" across API routes |
| ~10 | Auth0 migration notes | "Uses Auth0 session, removed Supabase Auth dependency" |
| ~6 | Inline error display | "inline error so user sees it in context, not as a fleeting toast" |
| ~5 | Service role bypass | "service role client bypasses RLS" |
| ~4 | Optimistic UI pattern | "optimistic UI — update state immediately, revert on failure" |
| ~4 | Graceful fallback | "gracefully handle missing table/column (migration not yet applied)" |
| ~3 | Zero-dependency decisions | "3-line Slot replaces @radix-ui/react-slot" / "no cmdk/kbar" / "no animation library" |
| ~3 | Silent failure | "silently fail in production — analytics shouldn't break the app" |

---

## Summary

**100 ponytail markers found in app source.**

- **25 deferrals with upgrade triggers** — tracked, know when to revisit
- **23 no-trigger markers** ⚠️ — rot risk, no trigger to revisit them
- **~50 implementation notes** — not debt, just documentation

Highest-rot-risk items:
1. `transparency/page.tsx:117` — contributor data skipped, no trigger to fill
2. `webhooks/proxy/route.ts:18` — no retry, lost webhooks
3. `report-error/route.ts:18` — error reports silently dropped
4. `webhooks/auth0/route.ts:21` — content-length check bypassable via chunked encoding (per threat model)
5. `analytics/server.ts:95` — no shutdown flush, events lost on deploy
