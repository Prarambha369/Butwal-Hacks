# Ponytail Audit — `src/components/ui/`

**9 files, ~950 lines total.** Ranked by impact (biggest cuts first).

---

## `shrink:` **skeleton.tsx — 16 exports, 310 lines → 1 component + 100 lines**

`delete:` `BlogGridSkeleton` (0 importers). `PageSkeleton` (0 importers).

`shrink:` The remaining 14 variants are structural clones of 4 patterns (card, list, grid, table). Each is 15–40 lines of Skeleton-composition JSX. Replace with the existing parameterized `Skeleton` primitive plus 3–4 named composition helpers:

- `SkeletonCard` — for stat cards, reward cards, project cards, team cards, portfolio cards
- `SkeletonTable` — for tables and rows (already partially parameterized with `rows`/`columns`)
- `SkeletonFeed` — for activity feeds, team member lists
- `SkeletonGrid` — generic grid wrapper (already `BlogGridSkeleton` and `RewardsGridSkeleton` are identical except for className)

Each composition helper is ~20 lines. **net: -~200 lines.**

---

## `yagni:` **`sonner.tsx` — re-export wrapper, 40 lines → delete file**

`sonner.tsx` re-imports `Toaster as SonnerToaster` from the `sonner` package and re-exports it with hardcoded style overrides. The overrides reference `--glass-bg`, `--blur`, `--glass-border` — legacy Liquid Glass tokens from the old design system that was pivoted away from.

Replace the import in `layout.tsx` with a direct import from `sonner`:
```tsx
import { Toaster } from "sonner";
```

The hardcoded styles (`backdropFilter: "blur(var(--blur))"`, `border: "1px solid var(--glass-border)"`, `boxShadow: "0 8px 32px rgba(0,0,0,0.4)"`) should be updated to match the Kloner.app aesthetic (crisp borders, no backdrop-blur). **net: -40 lines, fixes legacy tokens.**

---

## `shrink:` **`rose-loader.tsx` — duplicated spinner, legacy token reference, 75 lines → 40 lines**

`delete:` `SpinnerSvg` internal component renders a hand-rolled SVG spinner circle. The codebase already uses `Loader2` from `lucide-react` (in command-search, team-create, event-create forms). Replace the SVG with `<Loader2 className="animate-spin" />`.

`shrink:` `RoseLoader` and `RoseSpinner` are nearly identical. `RoseLoader` wraps `RoseSpinner` in a `<div>` for non-fullscreen sizes. Collapse into one component:

```tsx
export function RoseLoader({ size = "md", fullscreen = false, ... }) {
  if (fullscreen) return <div className="fixed inset-0 ..."><Loader2 /><p>...</p></div>;
  return <Loader2 className={cn(sizeClasses[size])} />;
}
```

`fix:` `var(--color-bh-red-500, var(--color-bh-red-500))` — fallback is identical to primary. Change to `var(--color-primary-red, #FE0000)`. **net: -~35 lines, -1 dep on legacy token.**

---

## `yagni:` **`empty-state.tsx` — `useEffect` + `useState` for reduced-motion guard, 150 lines → 110 lines**

The `useEffect` + `useState` + `window.matchMedia` listener runs on every mount. When rendering multiple empty states in a list (e.g., dashboard with no teams *and* no projects), each creates its own listener instance. Replace with a single CSS-based approach: the `animate-in fade-in` class already exists, and `@media (prefers-reduced-motion: reduce)` can disable it globally via CSS — no JS needed:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-in { animation: none; }
}
```

Also `fix:` `bg-bh-red-500` legacy token still used in action buttons → `bg-primary-red`. **net: -~15 lines JS + removes 1 legacy token.**

---

## `fix:` **Legacy tokens across 4 files**

| File | Token | Fix |
|------|-------|-----|
| `badge.tsx` | `border-bh-red-500/50` | `border-primary-red/50` |
| `empty-state.tsx` | `bg-bh-red-500` (×2) | `bg-primary-red` |
| `section-heading.tsx` | `bg-bh-red-500` (×2, in colorMap) | `bg-primary-red` |
| `tag-input.tsx` | `focus:border-bh-red-500/50` | `focus:border-primary-red/50` |

**net: minor, but closes the legacy-migration gap.**

---

## `lean:` **`card.tsx`** — 6 clean thin wrappers, 35 lines. No cuts.
## `lean:` **`tag-input.tsx`** — 90 lines, clean multi-tag component. One legacy token (flagged above).
## `lean:` **`badge.tsx`** — 45 lines, cva with 6 variants. Earns its keep. One legacy token (flagged above).

---

## Summary

| Tag | Finding | net |
|-----|---------|-----|
| `shrink` | skeleton.tsx — 16 exports → 1 primitive + 4 composable helpers | -200 lines |
| `yagni` | sonner.tsx — re-export wrapper with legacy tokens | -40 lines |
| `shrink` | rose-loader.tsx — SVG → lucide Loader2, merge RoseLoader/RoseSpinner | -35 lines |
| `yagni` | empty-state.tsx — JS reduced-motion → CSS media query | -15 lines |
| `fix` | 4 files with legacy `bh-red-500` tokens → `primary-red` | minor |
| **net** | | **~290 lines, -4 legacy token references** |
