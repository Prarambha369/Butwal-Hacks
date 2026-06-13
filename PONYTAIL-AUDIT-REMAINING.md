# Ponytail Audit — src/app/(main) & src/app/api

**Date:** 2026-07-13
**Auditor:** ponytail-audit mode
**Scope:** `src/app/(main)/` (all routes) & `src/app/api/` (all handlers)

---

## Findings (ranked by cut size)

### DELETE

**1. `delete:` Duplicate SQL aggregation logic — ~120 lines**
`src/app/(main)/annual-report/page.tsx` has a `fetchReport()` function (lines 41-145) that is a near-exact duplicate of `getMetrics()` in `src/app/api/admin/annual-report/route.ts` (lines 20-120). The page could call the API route instead of duplicating 9 identical Supabase count queries plus monthly signup logic.
- **What to cut:** `fetchReport()` + the entire `YearMetrics` interface (shared with page render code)
- **Replacement:** The page calls `fetch("/api/admin/annual-report")` with a service-role server-side fetch, or the page imports `getMetrics` from a shared lib module
- **Path:** `src/app/(main)/annual-report/page.tsx` lines 20-145

**2. `delete:` Unused dynamic sections file — 30 lines**
`src/app/(main)/dashboard/hacker/dynamic-sections.tsx` loads `SkillTree` and `CertificateScanner` via dynamic imports. However, the `DynamicSections` component is only used in `dashboard/hacker/page.tsx`. The individual components (`skill-tree`, `certificate-scanner`) don't exist as separate source files (confirmed by grep returning 0 matches) — they would 404 if rendered. The entire file is speculative scaffolding.
- **What to cut:** `dynamic-sections.tsx` and its usage import/render in `page.tsx`
- **Replacement:** Remove the import and `<DynamicSections />` from `dashboard/hacker/page.tsx`
- **Path:** `src/app/(main)/dashboard/hacker/dynamic-sections.tsx`

**3. `delete:` `not-found.tsx` doesn't exist — confirmed by glob**
`src/app/(main)/` has no `not-found.tsx`. The AGENTS.md requires hard 404s via `notFound()`. If the file is supposed to exist, it's missing. If it's intentionally absent, Next.js uses its default 404 page.
- **What to cut:** Nothing to delete, but this is a gap vs spec
- **Path:** `src/app/(main)/not-found.tsx` (does not exist)

**4. `delete:` `BarChart3` icon imported but unused in support/page.tsx — wait, it IS used**
Checked again — `BarChart3` is rendered inside JSX. No false alarm.

---

### YAGNI

**5. `yagni:` Over-engineered tag-input duplicated across two forms — ~50 lines each**
`src/app/(main)/portal/sponsors/company/sponsor-company-form.tsx` and `src/app/(main)/portal/bounties/opportunity-form.tsx` both implement an identical `addTag`/`removeTag` pattern with `Enter` key handling, `Plus` button, chip display with `X` button. This is duplicated verbatim.
- **What to cut:** The duplicated tag-input logic in both forms
- **Replacement:** Extract a shared `<TagInput>` or `<MultiTagInput>` component in `src/components/ui/tag-input.tsx`
- **Path:** Both form files

**6. `yagni:` `api/sponsor/route.ts` — need to check its content**
This route handles sponsor inquiry form submissions. Checked — it's used by the `support/sponsor-form.tsx` component (POST to `/api/sponsor`). Not dead. Move on.

**7. `yagni:` API route `api/csp-violation/route.ts` — likely never called**
Browser CSP reports go here but CSP headers need to be explicitly configured in `next.config.ts` or middleware. This endpoint exists speculatively without the CSP config to send reports to it.
- **What to cut:** The entire file (unlikely to be sending reports without CSP config)
- **Replacement:** Nothing — add CSP config if needed later
- **Path:** `src/app/api/csp-violation/route.ts`

---

### SHRINK

**8. `shrink:` Static placeholder data in communityMetrics — ~10 lines**
`annual-report/page.tsx` has `communityMetrics` with hardcoded values:
```js
activeChapters: currentYear >= 2024 ? 3 : 0,
sponsorOrganizations: 0,
bountyCompleted: 0,
```
The same placeholder pattern exists in `api/admin/annual-report/route.ts`.
- **What to cut:** The hardcoded zeros and static chapter count
- **Replacement:** Either query real data or remove these sections entirely until real data sources exist. Currently they show "0" which looks broken.

**9. `shrink:` Empty comment lines / cosmetic imports — ~10 lines across multiple files**
`cookie-policy/page.tsx`, `governance/page.tsx`, `philosophy/page.tsx`, `support/page.tsx`, `resources/page.tsx` all have orphaned empty import lines (just whitespace between comment section markers). These are harmless but untidy.
- **What to cut:** The empty `import` lines that are just comments

---

### STDLIB

**10. `stdlib:` Form state management could use native `useActionState`**
`support/sponsor-form.tsx` uses `useState` with 4-state enum (`idle | submitting | success | error`). Next.js 16 ships `useActionState` for form management which handles these states natively with `pending` and `formData` support.
- **What to cut:** Manual `useState` + `fetch` call in `sponsor-form.tsx`
- **Replacement:** `useActionState` + Server Action (`/api/sponsor` becomes a server action import)

---

### NATIVE

**11. `native:` Manual `useEffect` keyboard nav in gallery-grid.tsx — could use `react-aria` or native dialog**
The lightbox in `gallery-grid.tsx` implements `keydown` listeners (`Escape`, `ArrowLeft`, `ArrowRight`) manually with useLayoutEffect cleanup.
- **What to cut:** The manual `keydown` handler (~15 lines)
- **Replacement:** `<dialog>` native element handles `Escape` natively. For arrow keys, `onKeyDown` on the dialog element itself suffices.

---

### CLEAN (no action needed)

- All `src/app/(main)` content pages (about, blog, chapters, community, contact, cookie-policy, docs, donors, events, explore, governance, initiatives, legal, opportunities, orgs, philosophy, profile, programs, projects, resources, support, teams, transparency, portal/*)
- All API routes that have actual consumers: `/api/contact`, `/api/events/*`, `/api/projects/*`, `/api/teams/*`, `/api/webhooks/*`, `/api/verify/*`, `/api/cloudinary-signature`, `/api/heartbeat`, `/api/report-error`, `/api/bounties`, `/api/tasks/*`, `/api/v1/*`

---

## Summary

| Tag | Finding | Lines | Deps |
|-----|---------|-------|------|
| `delete` | Duplicate `fetchReport` vs `getMetrics` in annual report | ~120 | 0 |
| `delete` | `dynamic-sections.tsx` scaffolding with missing component files | ~30 | 2 lazy imports |
| `yagni` | Duplicated tag-input logic across forms | ~50 each | 0 |
| `yagni` | `csp-violation` endpoint with no CSP config | ~20 | 0 |
| `shrink` | Hardcoded placeholder zeros in communityMetrics | ~10 | 0 |
| `stdlib` | Form state could use `useActionState` instead of manual `useState` | ~10 | 0 |

**net: -~230 lines, -0 deps possible.** (Conservative — the duplicate SQL logic is the big win.)

---

*One-shot report only. No files were harmed in the making of this audit.*
