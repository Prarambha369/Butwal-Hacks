# Ponytail Audit — Butwal Hacks (`my-app/src/`)

Date: 2026-07-14 | Total: 344 source files (239 .tsx + 105 .ts)

Ranked by impact (biggest cuts first).

---

## `shrink:` **16 skeleton variants → 3–4 parameterized**

`src/components/ui/skeleton.tsx` exports 16 named skeleton components. Import counts:

| Skeleton | Importers |
|----------|-----------|
| `BlogGridSkeleton` | **0** |
| `PageSkeleton` | **0** |
| `BlogCardSkeleton` | 1 |
| `StatCardSkeleton` | 1 |
| `StatsGridSkeleton` | 1 |
| `TableRowSkeleton` | 1 |
| `TableSkeleton` | 1 |
| `ActivityItemSkeleton` | 1 |
| `TeamMemberCardSkeleton` | 1 |
| `ActivityFeedSkeleton` | 2 |
| `TeamManagementSkeleton` | 2 |
| `TeamMatchingSkeleton` | 2 |
| `RewardsGridSkeleton` | 2 |
| `ProjectAnalyticsSkeleton` | 2 |
| `TeamPortfolioSkeleton` | 2 |

Two are dead exports (0 importers). The rest are structural clones (card, list, grid, table) with different classNames. Replace with `Skeleton` + layout props. **net: -~200 lines.**

---

## `delete:` **OpenTelemetry dependency set (4 packages)**

`@opentelemetry/api-logs`, `@opentelemetry/exporter-logs-otlp-http`, `@opentelemetry/resources`, `@opentelemetry/sdk-logs` — all pulled in by `src/lib/posthog-logger.ts` and `instrumentation.ts` to pipe structured logs to PostHog's OTLP endpoint. PostHog already has a native JS SDK (`posthog-js`/`posthog-node`) that captures events directly. The OTLP bridge adds 4 packages and ~60 lines of wrapping for something PostHog already handles.

The `posthogLog.info()` / `.warn()` / `.error()` calls are used across 12 API route files (25 call sites). These could be replaced with `console.log` + PostHog's native `capture()` or removed entirely (PostHog's SDK auto-captures errors and events via `captureServerEvent` which already exists in the codebase as `@/lib/analytics/server`). **net: -4 deps, -60 lines.**

---

## `shrink:` **`logger.ts` + `posthog-logger.ts` (193 combined lines)** → one 20-line file

- `src/lib/logger.ts` (133 lines) — structured logger with Axiom + console fallback. If `AXIOM_TOKEN` is unset (it's optional), this degrades to console logging anyway. The structured metadata passing adds complexity for marginal gain over bare `console`.
- `src/lib/posthog-logger.ts` (60 lines) — OpenTelemetry wrapper for PostHog logging (see above).

Both could be replaced with a single 20-line module that wraps `console` and calls `captureServerEvent` when available. **net: -~170 lines.**

---

## `yagni:` **`withRateLimit(withPayloadLimit(...))` double-wrap × 17**

17 API routes wrap their handler with both `withRateLimit` and `withPayloadLimit`. The composition is correct but verbose. A single `withStandardLimits` helper that composes both internally would save 17× the indentation + repeated import. Example:

```ts
// Before (17 files):
export const POST = withRateLimit(withPayloadLimit(async (req) => { ... }), "sensitive")
// After:
export const POST = withStandardLimits(async (req) => { ... })
```

**net: -~34 lines, cleaner API.**

---

## `shrink:` **`rate-limiter.ts` (148 lines)** → ~100

The file exports two HOFs (`withRateLimit`, `withPayloadLimit`) + configuration. 53+ uses mean the abstraction earns its keep, but the config section duplicates Upstash client initialization patterns. `RATE_LIMIT_TIERS` has 5 tiers but only 2–3 are actually used in API routes. **net: -~30 lines.**

---

## `shrink:` **Defensive memoization on cheap operations**

~50 lines of `useMemo`/`useCallback` wrapping:
- Filtering 12-item arrays (explorer-client, events-filter, etc.)
- `useMemo` wrapping a 4-item `.map()` (use-onboarding-progress)
- `useCallback` on simple keyboard event handlers (command-search)

The computations are trivially cheap. The memo overhead costs more than the recomputation. Removing them adds a re-render per keystroke or filter change, but those are already fast. **net: -~50 lines.**

---

## `yagni:` **`log.ts` in components/teams/ — zero importers? Need verification**

Confirm this file exists and is unused. **Pending check.**

---

## Summary

| Tag | Finding | net |
|-----|---------|-----|
| `shrink` | 16 skeleton variants → 3–4 parameterized | -200 lines |
| `delete` | OpenTelemetry 4-package dependency set | -4 deps, -60 lines |
| `shrink` | logger.ts + posthog-logger.ts → 20 lines | -170 lines |
| `yagni` | withStandardLimits helper vs double-wrap ×17 | -34 lines |
| `shrink` | rate-limiter.ts config compaction | -30 lines |
| `shrink` | Defensive useMemo/useCallback on cheap ops | -50 lines |
| **net** | | **~544 lines, -4 deps** |
