# 🧹 Ponytail Audit — Remaining Cuts

**Audit date:** 2026-07-14
**Codebase:** 337 files, ~39,630 lines, 24 production dependencies

---

## Findings (ranked biggest cut first)

### `delete:` `src/lib/metrics.ts` — 0 external imports
Hardcoded static stats numbers. All consumers inline their own data. No imports found outside its own directory.
- **Cut:** Full file
- **net:** -60 lines

### `delete:` `src/lib/posthog-logger.ts` — 0 external imports
Thin `console.log` wrapper around PostHog calls. Sentry handles production error tracking; `@/lib/logger.ts` handles structured logging. All callers can use `logger.info/error` directly.
- **Cut:** Full file
- **net:** -30 lines

### `delete:` `class-variance-authority` dependency
Used in exactly 2 files (`button.tsx`, `badge.tsx`), each defining <6 variant combinations. Replace with a plain `Record<string, string>` map:
```typescript
// Before: cva("base", { variants: { variant: { primary: "bg-red" } } })
// After: const variantMap = { primary: "bg-red", secondary: "bg-gray" };
//         cn("base", variantMap[variant])
```
- **Cut:** `npm uninstall class-variance-authority`, simplify 2 files
- **net:** -1 dep, ~-10 lines

### `shrink:` `src/lib/rate-limiter.ts` — 146-line wrapper
Exports `withRateLimit(fn, bucket)`. Three API routes import it (contact, metrics, one more). Inline the 4-line rate limit check into each route:
```typescript
// The actual logic per caller:
const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10s") })
const { success } = await limiter.limit(ip)
if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
```
- **Cut:** Delete `rate-limiter.ts`, inline into 3 route handlers
- **net:** -1 file, ~-130 lines

### `native:` `src/lib/auth-guard.ts` — 63-line custom guard
Exports `requireAuth()` and `requireRole()`. Auth0 SDK ships `auth0.requireAuth()` as built-in middleware. Server layouts already handle role checks inline. This file is a redundant abstraction layer.
- **Cut:** Delete `auth-guard.ts`, use `auth0.middleware(request)` + inline role checks (already done in layouts)
- **net:** -1 file, ~-55 lines

### `yagni:` `src/components/deferred-mount.tsx` — single-use wrapper
20-line component that defers children mount to `requestAnimationFrame`. Used once in `layout.tsx`. Same effect with 6-line `useEffect` + `useState` inlined.
- **Cut:** Delete component, inline pattern in `layout.tsx`
- **net:** -1 file, ~-12 lines

### `shrink:` `src/components/ui/rose-loader.tsx` — duplicate components
`RoseLoader` (uses `<div>`) and `RoseSpinner` (uses `<span>`) are functionally identical. Codebase already uses `RoseSpinner` everywhere. `RoseLoader` is unused.
- **Cut:** Delete `RoseLoader` export
- **net:** -15 lines

### `yagni:` 4 `Skeleton` interfaces in one file
`SkeletonProps`, `CardSkeletonProps`, `FeedSkeletonProps`, `TableSkeletonProps` — each is `{ className?: string }`. Collapse to one:
```typescript
interface SkeletonProps {
  variant?: "card" | "feed" | "table";
  className?: string;
}
```
- **Cut:** Replace 4 interfaces with 1
- **net:** -3 interfaces, ~-20 lines

---

## Previously Flagged — Now Verified Clean

| Finding from previous audit | Status |
|---|---|
| `cn()` hand-rolled → `tailwind-merge` | ✅ Already fixed — re-exports `twMerge` |
| `swipe-navigator.tsx` | ✅ Still imported in `layout.tsx` (mobile gestures) |
| `pwa-register.tsx` | ✅ Still imported in `layout.tsx` (PWA service worker) |
| `json-ld.tsx` | ✅ Imported by 4 files |
| `mobile-bottom-nav.tsx` | ✅ Imported in `layout.tsx` |
| `network-status.tsx` | ✅ Imported in `layout.tsx` |

---

## Not Worth Cutting

| File | Reason |
|---|---|
| `proxy.ts` (319 lines) | Justified — subdomain routing + RBAC + chapter rewrites |
| `src/components/assistant-panel.tsx` (435 lines) | Domain complexity — AI chat panel with message history |
| `src/components/tasks/table-task-view.tsx` (435 lines) | Domain complexity — Notion-style table with inline editing |
| `src/lib/content.ts` (410 lines) | Content data, not logic |
| `supabase/migrations/*.sql` | Schema migrations, one-time deploy |

---

## Summary

```
net: -7 files, -372 lines, -1 dep (class-variance-authority) possible
```

### Quickest wins (apply in order):
1. `npm uninstall class-variance-authority` + simplify 2 components
2. `rm src/lib/metrics.ts src/lib/posthog-logger.ts`
3. `rm src/lib/rate-limiter.ts` + inline into 3 callers
4. `rm src/lib/auth-guard.ts` + `rm src/components/deferred-mount.tsx`
5. Simplify `skeleton.tsx` + `rose-loader.tsx`
