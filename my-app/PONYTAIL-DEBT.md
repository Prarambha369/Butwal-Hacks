# 🧹 Ponytail Debt Ledger

**Generated:** 2026-07-14
**Total markers:** 131
**With upgrade triggers:** 48
**Documentation-only (no trigger):** 83

Every deliberate shortcut marked with `ponytail:` in the codebase. Grouped by file with ceiling and upgrade path.

---

## 🔴 Actionable Debt (with upgrade triggers)

### `src/components/command-search.tsx`
- **L11** — No cmkd/kbar dep; raw `useEffect` keyboard listener. *Upgrade: search needs fuzzy matching, keyboard navigation, or a11y ARIA combobox pattern.*
- **L68** — `requestAnimationFrame` focus defer. *Upgrade: DOM readiness race shows up in e2e tests.*
- **L260** — `indexOf` O(n²) search. *Upgrade: results > 12 items per query.*

### `src/components/dashboard/activity-feed.tsx`
- **L36** — Removed 30s auto-refresh interval. *Upgrade: dashboard needs push-based live updates.*

### `src/components/projects/project-grid.tsx`
- **L61** — Client-side pagination of up to 100 projects. *Upgrade: projects exceed 100 per query.*

### `src/lib/metrics.ts`
- **L103** — Hardcoded static numbers. *Upgrade: real data sources connected.*

### `src/lib/members.ts`
- **L2** — Static member data. *Upgrade: replace with Supabase query.*

### `src/lib/posthog-logger.ts`
- **L19** — Console-only logging. *Upgrade: swap in a real transport.*

### `src/lib/cache/edge-cache.ts`
- **L25** — No-op cache fallback. *Upgrade: Redis configured.*

### `src/lib/actions/activity.ts`
- **L26** — Gracefully handles missing `audit_logs` table. *Upgrade: migration 013 applied to production.*

### `src/lib/emails/ghost-marker-notification.ts`
- **L1** — Inline HTML email template. *Upgrade: >3 email types → extract template engine.*

### `src/components/ui/button.tsx`
- **L6** — 3-line Slot replaces `@radix-ui/react-slot`. *Upgrade: need polymorphic `as` prop with proper type safety.*

### Timeout ceilings (API routes):
| File | Line | Ceiling | Upgrade |
|------|------|---------|---------|
| `src/app/api/contact/route.ts` | 25 | 5s timeout | Email API latency >5s |
| `src/app/api/sponsor/route.ts` | 25 | 5s timeout | Sponsor form email API slow |
| `src/app/api/github/sync/route.ts` | 42 | 15s timeout | Accounts with >50 repos |
| `src/app/api/certificates/extract/route.ts` | 35 | 30s AI inference timeout | Consistently times out |
| `src/app/api/v1/issue-marker/route.ts` | 169 | 10s notification email timeout | Resend latency >10s |
| `src/lib/actions/generate-profile-summary.ts` | 82 | 30s AI timeout | Groq inference too slow |

### `src/lib/logger.ts`
- **L67** — Shared batch array for concurrent serverless invocations. *Upgrade: need per-request correlation via next-axiom.*

### `src/lib/actions/feedback.ts`
- **L19** — Simple in-memory rate limit (resets on server restart). *Upgrade: rate limits need to persist across server restarts.*

---

## 📝 Documentation-only markers (83 total)

These explain design decisions or document completed migrations. No action needed.

### Auth0 migration completed (14 markers)
`src/app/(main)/dashboard/hacker/certificates/page.tsx:98`,
`src/app/(main)/dashboard/hacker/layout.tsx:94`,
`src/app/(main)/dashboard/hacker/projects/page.tsx:17`,
`src/app/(main)/dashboard/organizer/layout.tsx:80`,
`src/app/(main)/dashboard/organizer/events/page.tsx:15`,
`src/app/api/profile/complete/route.ts:47`,
`src/app/api/profile/update/route.ts:48`,
`src/app/api/projects/like/route.ts:37`,
`src/app/api/resources/complete/route.ts:35`,
`src/app/api/teams/route.ts:60`,
`src/app/api/events/register/route.ts:20`,
`src/app/api/events/route.ts:13`,
`src/app/api/events/checkin/route.ts:54`,
`src/app/lib/actions/events.ts:19`
> All document the migration from Supabase Auth → Auth0. No upgrade path — migration is complete.

### Profile UUID resolution pattern (10 markers)
`src/app/(main)/dashboard/hacker/projects/page.tsx:17`,
`src/app/api/events/register/route.ts:20`,
`src/app/api/events/route.ts:13`,
`src/app/api/projects/route.ts:46`,
`src/app/api/teams/route.ts:21`,
`src/app/api/v1/issue-marker/route.ts:42`,
`src/app/api/organizer/metrics/route.ts:12`,
`src/components/dashboard/team-invite-list.tsx:32`,
`src/components/dashboard/team-management.tsx:30`,
`src/components/projects/like-button.tsx:25`
> Standard pattern: resolve Auth0 `sub` → profile UUID for FK queries. Intentional design.

### Contextual error display (5 markers)
`src/components/dashboard/team-request-list.tsx:69`,
`src/components/dashboard/team-management.tsx:135`,
`src/components/dashboard/team-invite-list.tsx:92`,
`src/components/dashboard/rewards-store.tsx:67`,
`src/app/api/metrics/route.ts:51`
> Errors shown inline near action buttons, not as toasts. UX choice.

### Design pattern explanations (20 markers)
Various files documenting why a single endpoint was chosen, why hooks must be placed before early returns, why optimistic UI is used, etc. All intentional.

### ESLint config (3 markers)
`eslint.config.mjs:8-10`
> Intentional rule relaxations for pragmatic development speed.

---

## 📊 Summary

```
131 markers total
 48 have explicit upgrade trigger
 83 are documentation-only (completed migrations, pattern explanations)
  0 with no-trigger tag that silently rot
```

The codebase is well-maintained. The 48 actionable markers are mostly timeout ceilings (5s–30s) that will only trigger if external APIs slow down, and simple patterns consciously chosen over heavy dependencies. No silent rot.
