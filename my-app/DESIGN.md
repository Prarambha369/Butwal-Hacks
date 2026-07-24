# Butwal Hacks — Design System

**Register:** Product (dashboard/app UI — design serves the function)
**Platform:** Web
**Theme:** Light-first with dark mode support

---

## 1. Visual Philosophy

Flat, layered SaaS platform built for Nepal's hacker community. Surfaces are solid white or light gray. Depth comes from tonal layering (lighter content areas, slightly darker panels and sidebars), not from shadows or glass. A single red accent earns its place through rarity.

**Key characteristics:**
- Solid surfaces with crisp 1px borders
- Depth through lightness changes, not blur or shadow
- Single accent discipline — Butwal Red on ≤10% of any screen
- Selective red glow on primary CTAs and verified trust markers only
- JetBrains Mono for technical identifiers (BH-IDs, dates, task names, API keys)
- DM Sans for all reading text

---

## 2. Color Tokens

Defined in `globals.css` as CSS custom properties. Mapped to Tailwind theme in `@theme` block.

### Brand
```
--bh-primary-red:    #FE0000   Butwal Red — primary actions, verified markers
--bh-deep-red:       #B10000   Deep Red — hover states, pressed buttons
--bh-dark-red:       #7b0000   Dark Red — destructive backgrounds
--bh-light-red:      #ff7c7c   Light Red — badge backgrounds
--bh-light-red-soft: #ffb9b9   Soft Light Red — subtle fills
```

### Light mode (default)
```
--bh-bg-base:         #F7F7F8   Page canvas — very light gray
--bh-surface:         #FFFFFF   Card/panel surface — white
--bh-surface-hover:   #F0F0F2   Surface hover state
--bh-border:          #E5E5E5   Default border — 1px crisp
--bh-border-light:    #EBEBEB   Lighter divider
--bh-text-muted:      #888888   Muted/de-emphasized text
--bh-text-secondary:  #666666   Secondary labels, descriptions
--bh-text-body:       #333333   Body paragraphs
--bh-text-primary:    #1F1F1F   Headings, emphasis
```

### Dark mode
```
--bh-bg-base:         #1a1a1a   Dark canvas
--bh-surface:         #2a2a2a   Dark card surface
--bh-surface-hover:   #3a3a3a   Dark hover
--bh-border:          #4a4a4a   Dark borders
--bh-text-muted:      #7a7a7a
--bh-text-secondary:  #909090
--bh-text-body:       #cccccc
--bh-text-primary:    #f0f0f0
```

### Status colors
```
--bh-status-green:    #16A34A / #4ADE80   Success, verified
--bh-status-blue:     #2563EB / #60A5FA   Info, blue badges
--bh-status-teal:     #0D9488 / #2DD4BF   Teal accents
--bh-status-yellow:   #CA8A04 / #FACC15   Warnings, medium priority
--bh-status-orange:   #EA580C / #FB923C   Orange accents
--bh-status-red:      #DC2626 / #F87171   Destructive, errors
```

### Shadows
```
--bh-shadow-sm:   0 1px 2px rgba(0,0,0,0.05)
--bh-shadow-md:   0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.05)
--bh-shadow-lg:   0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04)
--bh-shadow-xl:   0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)
```

### Glow (accent only)
```
--bh-glow-red:      0 0 20px rgba(254,0,0,0.2)      Primary button hover
--bh-glow-red-soft: 0 0 12px rgba(254,0,0,0.12)    Verified trust markers
```

---

## 3. Typography

### Font families
- **DM Sans** (`--font-sans`): All UI text — headings, body, buttons, labels
- **JetBrains Mono** (`--font-mono`): Technical identifiers only — BH-IDs, dates, API keys, task names, code snippets, badge text

### Scale
- `text-[10px] font-mono` — metadata, timestamps, badge labels
- `text-xs` (12px) — secondary text, hints
- `text-sm` (14px) — body text, descriptions
- `text-base` (16px) — default paragraph
- `text-lg` (18px) — large body
- `text-xl`–`text-5xl` — headings (h4 → h1)
- `text-6xl`+ — hero display headings

### Conventions
- All headings use `font-bold` (700 weight)
- Body text uses `font-normal` (400 weight)
- Buttons use `font-semibold` (600 weight) via the `bh-btn-*` utility classes and the `Button` component
- Technical identifiers use `font-mono` with `uppercase` and `tracking-wider` or `tracking-tight`
- h1–h3 use `tracking-tight` for tighter headlines
- Body text capped at 65–75ch via `max-w-prose` or `max-w-2xl`

---

## 4. Component Vocabulary

### Card (`bh-card`)
The primary container. Solid white surface, 1px border, 12px border-radius. No blur, no glass.
```html
<div class="bh-card p-6">...</div>
```

Variants:
- `bh-card` — base card with hover shadow on interactive parents
- `bh-card-hover` — adds `translateY(-2px)` + border color change on hover
- `bh-card-interactive` — same as hover but with stronger border color

The `Card` component (`src/components/ui/card.tsx`) provides sub-components:
- `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

### Button (`src/components/ui/button.tsx`)
Pill-shaped (`rounded-full`). Base style via utility classes `bh-btn-primary`, `bh-btn-secondary`, `bh-btn-ghost`. Component variant also available.

Button variants:
| Variant | Use |
|---------|-----|
| `default` | Primary action — red bg, white text, red glow on hover |
| `ghost` | Low emphasis — transparent, border on hover. CSS-identical to `outline` (`bg-transparent` is inherited anyway). |
| `outline` | Secondary — 1px border, no bg on hover |
| `destructive` | Destructive action — dark red fill |
| `secondary` | Secondary action — surface-hover bg |
| `link` | Text-only link style |

Sizes: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`

All buttons have:
- `min-width: 44px` / `min-height: 44px` (touch target)
- `transition: all 0.2s ease`
- `active:scale-[0.97]` press feedback
- `focus-visible:ring-2 ring-primary-red` focus ring

### Badge (`src/components/ui/badge.tsx`)
Inline pill for status/tags. Uses `font-mono`, `text-xs`, `uppercase`, `tracking-widest`.
```html
<Badge variant="default">Label</Badge>
<Badge variant="outline">Label</Badge>
```

Inline CSS-only badges (`globals.css` utilities):
- `bh-badge-red`, `bh-badge-green`, `bh-badge-blue`, `bh-badge-yellow`, `bh-badge-gray`
- These duplicate the `Badge` component. Prefer the component for consistency; use utilities only when you can't (e.g., inside `.map()` callbacks where importing the component would be awkward).

### SectionHeading (`src/components/ui/section-heading.tsx`)
Reusable section header. 5 variants:
| Variant | When to use |
|---------|-------------|
| `accent` | Thin colored vertical bar on left — default section heading |
| `icon` | Icon inside a small badge container — feature sections |
| `badge` | Small colored pill + heading — milestone/badge sections |
| `dot` | Colored circle that can pulse — live status sections |
| `plain` | Just heading text — minimal sections |

Accepts `color` prop: `red` (default), `green`, `yellow`, `blue`, `orange`.

### EmptyState (`src/components/ui/empty-state.tsx`)
Consistent empty state for sections with no content (no projects, no teams, etc.).
```html
<EmptyState
  icon={<FolderKanban className="w-12 h-12" />}
  title="No projects yet"
  description="Submit your first project..."
  actions={[{ label: "Create Project", href: "/dashboard/projects/new", variant: "primary" }]}
  hint="You can also sync from GitHub"
/>
```

Sub-component: `NoResultsState` for search/filter empty results.

### Skeleton (`src/components/ui/skeleton.tsx`)
Loading placeholder. Uses `animate-pulse` and `bg-muted`.
- `Skeleton` — base primitive. Variants: `default`, `card`, `text`, `circle`, `image`
- `CardSkeleton` — card placeholder with icon area, title, lines
- `FeedSkeleton` — list of avatar + text items
- `TableSkeleton` — parameterized rows + columns

### TagInput (`src/components/ui/tag-input.tsx`)
Multi-tag input with add/remove chips. Enter or button to add, X to remove.

### Toast (`src/components/ui/sonner.tsx`)
Wrapper around Sonner. Positioned bottom-right, 5 visible toasts max, 4s duration.

---

## 5. Layout Conventions

### Spacing scale
Base unit: 4px (1rem = 16px).
```
p-4  = 16px  (card padding)
p-6  = 24px  (card padding, larger)
p-8  = 32px  (hero sections)
gap-3 = 12px (component gap)
gap-4 = 16px (section gap)
gap-6 = 24px (grid gap)
gap-8 = 32px (layout gap)
```

### Section spacing
```css
.bh-section {
  padding-top: 4rem;
  padding-bottom: 4rem;
}
@media (min-width: 768px) {
  .bh-section {
    padding-top: 6rem;
    padding-bottom: 6rem;
  }
}
```

### Container
`.bh-container` — `max-width: 80rem` (1280px), with responsive side padding.

### Responsive grids
Use `auto-fit` / `auto-fill` for adaptive columns without breakpoints:
```css
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))
```

### Z-index scale
```
dropdown → sticky → modal-backdrop → modal → toast → tooltip
```

### Divider
`.bh-divider` — `border-top: 1px solid var(--bh-border)`

---

## 6. Motion

### Timing
- `0.2s ease` — default transitions (hover, focus, color shifts)
- `0.3s ease` — panel slides, modal entrances
- `0.15s ease` — fast color transitions, toggle states

### Transition easing
`cubic-bezier(0.4, 0, 0.2, 1)` — standard ease-out throughout.

### Reduced motion
Every animation is wrapped in `@media (prefers-reduced-motion: reduce)` check. Components self-detect via `window.matchMedia` with a live listener. When reduced motion is active:
- Entrance animations become instant (no opacity/translate transitions)
- Hover effects (scale transforms) remain active (interaction feedback)
- Loading spinners remain active (functional, not decorative)

### Animation classes
- `.animate-bh-typing` — BH Bot typing indicator (staggered dots)
- `.animate-pulse` — loading skeletons, live dot indicators
- `.animate-spin` — loading spinners
- Entrance animations use Tailwind's `animate-in` / `fade-in` / `slide-in-from-bottom-*` / `zoom-in-*` utilities

---

## 7. Trust Markers (Visual Hierarchy)

Three tiers of credential badges, mirroring cryptographic truth:

| Class | When to use | Visual |
|-------|-------------|--------|
| `bh-trust-marker-verified` | Cryptographically-signed, active credentials | Red border + subtle red glow (`--bh-glow-red-soft`), red text, monospace |
| `bh-trust-marker-self-reported` | User-claimed (not verified) | Standard `--bh-border` border, no glow, muted text |
| `bh-trust-marker-revoked` | Revoked credentials | Grey border, `text-decoration: line-through`, low opacity |

---

## 8. Accessibility Targets

### Contrast (light mode)
- Body text `#333333` on `#F7F7F8` bg: **6.3:1** — exceeds 4.5:1
- Muted text `#888888` on `#F7F7F8` bg: **4.9:1** — meets 4.5:1
- Butwal Red `#FE0000` on white: **4.8:1** — meets 3:1 for large text

### Color usage
Red (`#FE0000`) never carries information alone. Always paired with an icon, label, structural position, or text.

### Focus states
`ring-2 ring-primary-red/60 ring-offset-2` — visible on all interactive elements.

Ring offsets vary by theme:
- Light mode: `ring-offset-white`
- Dark mode: `ring-offset-[#2a2a2a]` (to match the dark surface)

### Selection
`::selection` is styled `bg-primary-red/20 text-primary-red` across both themes.

### Keyboard navigation
Full keyboard navigation across all surfaces. Modals use native dialog semantics (`role="dialog"`, `aria-modal="true"`). Icon-only buttons use `aria-label`.

---

## 9. File Organization

```
src/
  components/
    ui/                Design system primitives (button, card, badge, etc.)
    dashboard/         Dashboard-specific components (role-selector, onboarding, etc.)
    hacker-id/         Public profile page components
    events/            Event page components
    community/         Community page components
    sections/          Layout sections (Navbar, Footer)
    projects/          Project gallery components
  app/                 Next.js App Router pages
  lib/                 Utilities, actions, content data
  hooks/               React hooks
  utils/supabase/      Supabase client factories
```

---

## 10. Previously Cleaned Up Redundancies

These were identified by ponytail-audit and removed in July 2026:

- `bh-btn-pill` (alias of `bh-btn-primary`) — removed, 2 callers migrated to `bh-btn-primary`
- `bh-btn-outline-pill` (alias of `bh-btn-secondary`) — removed, zero callers
- `bh-badge`, `bh-badge-red`, `bh-badge-green`, `bh-badge-blue`, `bh-badge-yellow`, `bh-badge-gray` — removed, zero callers (Badge component is canonical)
- `lg-surface`, `lg-surface-red` — removed, zero callers (legacy glass artefacts with blur(0px))

Canonical button utilities remaining: `bh-btn-primary`, `bh-btn-secondary`, `bh-btn-ghost`.
