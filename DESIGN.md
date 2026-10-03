# Butwal Hacks — Design System

> Visual design reference for the Butwal Hacks platform. Owned by the design and frontend maintainers. Product intent lives in [PRODUCT.md](PRODUCT.md); implementation rules live in [AGENTS.md](AGENTS.md).

## Contents

- [What this is](#what-this-is)
- [Who it's for](#who-its-for)
- [Quick actions](#quick-actions)
- [Reference](#reference)
  - [Design direction](#design-direction)
  - [Color](#color)
  - [Typography](#typography)
  - [Surfaces and elevation](#surfaces-and-elevation)
  - [Glow rules](#glow-rules)
  - [Utility classes](#utility-classes)
  - [Motion](#motion)
  - [Accessibility](#accessibility)
- [Troubleshooting](#troubleshooting)
- [See also](#see-also)

## What this is

The complete visual language for Butwal Hacks: a flat, crisp, structured SaaS surface where credentials are earned, verified, and displayed. Restraint is the point — clean surfaces, clear hierarchy, and a single red accent that only appears where it carries meaning.

Every token lives as a `--bh-*` CSS custom property in `my-app/src/app/globals.css`. There are 58 of them. Tailwind v4 `@theme` directives map them to utility classes, and `@layer utilities` defines the `bh-*` component classes on top.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| Frontend engineers | Choosing tokens and `bh-*` classes instead of ad-hoc values |
| Designers | Reviewing a change against the accent and glow budget |
| Reviewers | Checking design-system compliance in a PR |

## Quick actions

**Use a token, never a literal.** Import from the theme rather than writing hex values:

```tsx
// Correct — semantic token
<div className="bg-surface border border-border text-text-primary" />

// Wrong — hardcoded value, breaks dark mode
<div className="bg-white border-[#E5E5E5] text-[#1F1F1F]" />
```

**Never use** standard Tailwind palette classes (`bg-gray-800`, `text-red-500`), inline `style={{}}` for colors, or `backdrop-blur` on cards.

## Reference

### Design direction

The foundation is a flat Kloner.app-style SaaS surface. What that rules out:

| Excluded | Why |
|----------|-----|
| Backdrop blur and glass effects | Decoration without hierarchy; blur costs paint on low-end devices |
| Parallax | Reads as decoration, competes with content |
| Gradient text | Breaks legibility at small sizes and in dark mode |
| Shadows at rest | Cards read as floating; a 1px border reads as a surface |

### Color

Red is the only accent, and it is budgeted at roughly 10% of any screen.

| Role | Token | Light | Dark |
|------|-------|-------|------|
| Primary accent | `--bh-primary-red` | `#FE0000` | `#FE0000` |
| Accent pressed | `--bh-red-action` | `#E60000` | `#E60000` |
| Accent deep | `--bh-deep-red` | `#B10000` | `#B10000` |
| Accent darkest | `--bh-dark-red` | `#7b0000` | `#7b0000` |
| Accent soft | `--bh-light-red` | `#ff7c7c` | — |
| Page background | `--bh-bg-base` | `#F7F7F8` | `#1a1a1a` |
| Card surface | `--bh-surface` | `#FFFFFF` | `#2a2a2a` |
| Surface hover | `--bh-surface-hover` | `#F0F0F2` | `#3a3a3a` |
| Border | `--bh-border` | `#E5E5E5` | `#4a4a4a` |
| Border subtle | `--bh-border-light` | `#EBEBEB` | `#3a3a3a` |
| Text primary | `--bh-text-primary` | `#1F1F1F` | `#f0f0f0` |
| Text body | `--bh-text-body` | `#333333` | `#cccccc` |
| Text secondary | `--bh-text-secondary` | `#666666` | `#909090` |
| Text muted | `--bh-text-muted` | `#888888` | `#7a7a7a` |
| Inverse surface | `--bh-surface-inverse` | `#1F1F1F` | `#333333` |

Status colors are for state, never for decoration. Each has a light and dark value: `--bh-status-green`, `--bh-status-blue`, `--bh-status-teal`, `--bh-status-yellow`, `--bh-status-orange`, `--bh-status-red`.

The `--bh-glass-*` tokens exist (`--bh-glass-bg`, `--bh-glass-border`, `--bh-glass-blur`, `--bh-glass-saturate`) but resolve to a blur of `0px`. They are intentionally inert; do not reintroduce blur through them.

### Typography

Two families, loaded via `next/font` in `my-app/src/app/layout.tsx`.

| Role | Family | Weight | Usage |
|------|--------|--------|-------|
| Display | DM Sans | 800 | Hero headlines |
| Body | DM Sans | 400 | Paragraphs, descriptions |
| Label and mono | JetBrains Mono | 700, 10px, 0.12em tracking, uppercase | IDs, badges, metadata |

### Surfaces and elevation

- Cards: solid surface, 1px `--bh-border`, 12px radius, no shadow at rest.
- Inputs: solid surface, 1px border, same radius language.
- Buttons: pill shape (`rounded-full`) for primary CTAs, outline for secondary.
- Shadows (`--bh-shadow-sm` through `--bh-shadow-xl`) are for overlays and hover lift only, never for a static card.

### Glow rules

Glow is the strongest signal in this design system. It is spent only on verified trust.

| Token | Value (light / dark) | Applies to |
|-------|----------------------|------------|
| `--bh-glow-red` | `0 0 20px rgba(254,0,0,0.2)` / `0 0 30px rgba(254,0,0,0.45)` | Verified trust markers; primary CTA hover |
| `--bh-glow-red-soft` | `0 0 12px rgba(254,0,0,0.12)` / `0 0 16px rgba(254,0,0,0.25)` | Verified marker at rest |

A self-reported trust marker uses a standard border and **no** glow. If a diff adds glow anywhere else, that is a design-system violation.

### Utility classes

Defined in `@layer utilities` in `globals.css`.

| Class | Use |
|-------|-----|
| `bh-card`, `bh-card-hover`, `bh-card-interactive` | Card surface, with and without hover response |
| `bh-btn-primary`, `bh-btn-secondary`, `bh-btn-ghost` | Button variants |
| `bh-input`, `bh-input-sm`, `bh-select`, `bh-textarea` | Form controls |
| `bh-heading-xl`, `bh-heading-lg`, `bh-heading-md` | Section headings |
| `bh-trust-marker-verified`, `bh-trust-marker-self-reported`, `bh-trust-marker-revoked` | The three trust states |
| `bh-container`, `bh-section` | Layout primitives |
| `bh-tag` | Compact metadata pill |
| `bh-pt-safe`, `bh-pb-safe`, `bh-px-safe` | Mobile safe-area insets |
| `bh-overscroll-contain`, `bh-overscroll-none` | Scroll containment |
| `bh-touch-manipulation` | Tap target optimization |
| `bh-bg-grid` | Subtle grid backdrop |

### Motion

| Property | Value |
|----------|-------|
| Easing | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Duration | 150–250ms |
| Character | Smooth and subtle; no bounce, no overshoot |

Motion must respect `prefers-reduced-motion`.

### Accessibility

- Contrast meets WCAG AA against both the light and dark surface values above.
- Heading order is sequential; never skip a level for visual size.
- A skip link is present in the root layout.
- Dark mode follows system preference.
- Trust state is conveyed by text and border as well as color, so it survives color-blindness and screen readers.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Colors wrong in dark mode only | A literal hex was used instead of a token | Replace with the `--bh-*`-backed utility class |
| Card looks like it is floating | A shadow token was applied at rest | Remove it; cards use a 1px border |
| Blur appearing on a card | `backdrop-blur` reintroduced | Remove it; `--bh-glass-blur` is `0px` by design |
| Glow on an unverified badge | Glow applied outside the trust-marker classes | Use `bh-trust-marker-self-reported` |
| Accent dominating the screen | Red exceeded the 10% budget | Pull red back to CTAs, badges, and verified states |

## See also

- [PRODUCT.md](PRODUCT.md) — mission, users, and product direction
- [AGENTS.md](AGENTS.md) — build, verify, and contribution rules
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — engineering reference