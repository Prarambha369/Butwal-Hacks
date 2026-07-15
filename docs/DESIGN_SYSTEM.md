# Design Language

The Butwal Hacks interface is built on a simple idea: **trustworthy tools should feel solid, not flashy.** Surfaces are grounded. Color is used sparingly. Every visual decision has a reason — and that reason is never "because it looked cool in a demo."

This isn't a rigid framework. It's a set of principles that leave room for judgment.

---

## Principles

**Flat foundations, selective depth.** Cards, modals, and panels sit on solid white or light gray surfaces with crisp 1px borders. They feel like paper — tangible, honest. But a modal overlay or a floating action bar might use a subtle blur to separate it from the content beneath. The rule isn't "never use blur" — it's "use blur when you need separation, not decoration."

**Red means something.** Butwal Red (`#FE0000`) is reserved for actions that matter — primary buttons, verified credentials, trust markers. It's not a decorative accent. If something is red on the page, you should be able to click it or trust it.

**Glow is earned.** The red glow (`--bh-glow-red`) only appears on hover for primary actions and permanently on verified trust markers. Self-reported items never glow. This creates a visual hierarchy that rewards verification.

**Borders are honesty.** Every card, input, and section has a clear 1px border. No floating elements. No ambiguity about where one thing ends and another begins.

---

## Surfaces

| Element | Light Mode | Dark Mode | Why |
|---------|-----------|-----------|-----|
| Page background | `#F7F7F8` | `#1a1a1a` | Soft off-white reduces eye strain |
| Cards, modals | `#FFFFFF` | `#2a2a2a` | Solid white feels tangible, not ephemeral |
| Input fields | `#FFFFFF` solid | `#2a2a2a` solid | No transparency — input text needs contrast |
| Modal overlays | `bg-background/80` (no blur) | `bg-background/80` (no blur) | Solid dim is cleaner than blurred |
| Floating bars | Solid with border | Solid with border | Keep them grounded |
| Dividers | `1px solid #E5E5E5` | `1px solid #4a4a4a` | Crisp, unambiguous |

### Where blur makes sense

These are the places where `backdrop-filter: blur()` is intentional, not decorative:

- **Status toasts** (network alerts, confirmation messages) — a subtle background blur helps them sit above the page without blocking it entirely
- **Modal backdrops** — only when the content behind is heavily distracting (e.g., a full-screen photo lightbox). Standard modals use a solid dim.
- **Image overlays** — text that needs to be readable against a photo (hero captions, card hover states)

Everything else stays solid. If you're adding blur to a card or a button, ask yourself: does this need to float, or does it need to feel solid?

---

## Buttons

Buttons are pill-shaped (`rounded-full`). This isn't a trend — it's practical. Pill shapes give buttons a distinct silhouette that separates them from cards, badges, and other interactive elements.

| Type | Style | Glow |
|------|-------|------|
| Primary | Solid red (`#FE0000`), white text, pill | Red glow on hover |
| Secondary | White surface, 1px border, pill | None |
| Ghost | Text-only, no background, pill | None |
| Destructive | Dark red background, pill | None |

---

## Trust Markers

Trust markers are the most visually important element on a profile — they represent verified achievement. The design hierarchy is deliberate:

```
Verified     → Red border + subtle red glow
Self-reported → Standard border, no glow, lower opacity
Revoked       → Greyed out, strikethrough
```

The glow on verified markers uses `--bh-glow-red-soft` (subtle) at rest and `--bh-glow-red` (stronger) on hover. This is the only place where a permanent glow exists.

---

## Color Palette

### Brand Reds

| Token | Value | Used For |
|-------|-------|----------|
| `--bh-primary-red` | `#FE0000` | Primary CTAs, verified markers, brand identity |
| `--bh-deep-red` | `#B10000` | Button hover states, dark red surfaces |
| `--bh-dark-red` | `#7b0000` | Deep backgrounds, destructive buttons |

### Light Mode

| Token | Value | Used For |
|-------|-------|----------|
| `--bh-bg-base` | `#F7F7F8` | Page background |
| `--bh-surface` | `#FFFFFF` | Cards, modals, inputs |
| `--bh-surface-hover` | `#F0F0F2` | Hover states |
| `--bh-border` | `#E5E5E5` | All borders, dividers |
| `--bh-text-muted` | `#888888` | Secondary text, placeholders |
| `--bh-text-secondary` | `#666666` | Body text |
| `--bh-text-body` | `#333333` | Paragraph text |
| `--bh-text-primary` | `#1F1F1F` | Headings, titles |

### Dark Mode

Dark mode inverts the neutrals while keeping brand reds identical:

| Token | Value |
|-------|-------|
| `--bh-bg-base` | `#1a1a1a` |
| `--bh-surface` | `#2a2a2a` |
| `--bh-border` | `#4a4a4a` |
| `--bh-text-primary` | `#f0f0f0` |

### Status Colors

| Meaning | Light | Dark |
|---------|-------|------|
| Success | `#16A34A` | `#4ADE80` |
| Info | `#2563EB` | `#60A5FA` |
| Warning | `#CA8A04` | `#FACC15` |
| Error | `#DC2626` | `#F87171` |

---

## Typography

- **DM Sans** (primary) — used everywhere: headings, body text, labels, UI copy
- **JetBrains Mono** (secondary) — used for BH-IDs, dates, task names, code blocks, monospaced data

---

## Common Patterns

### Cards
```css
.bh-card {
  background: var(--bh-surface);        /* solid white */
  border: 1px solid var(--bh-border);   /* crisp 1px */
  border-radius: 0.75rem;
}
```

### Primary Button
```css
.bh-btn-pill {
  border-radius: 9999px;
  background-color: var(--bh-primary-red); /* #FE0000 */
  color: white;
}
.bh-btn-pill:hover {
  box-shadow: var(--bh-glow-red); /* red glow on hover only */
}
```

### Verified Trust Marker
```css
.bh-trust-marker-verified {
  border: 1px solid rgba(254, 0, 0, 0.4);
  box-shadow: var(--bh-glow-red-soft); /* permanent subtle glow */
}
```

---

## CSS Conventions

- **No inline `style={{}}` for colors.** Use Tailwind arbitrary values (`bg-[#FE0000]`) or CSS variable references (`bg-[var(--bh-primary-red)]`).
- **No gradient backgrounds for page sections.** Use solid colors. Gradients on photos (hero overlays, image fade effects) are fine.
- **No unnamed decorative effects.** Every `backdrop-filter`, `box-shadow`, or `animation` should have a functional justification.
- **Prefer CSS variables over hardcoded hex** for any value that appears in more than one place.

---

## What This Looks Like in Practice

A visitor landing on butwalhacks.com sees:

- A white navbar with a crisp bottom border — solid, not blurred
- A hero section with bold typography on a clean background — no floating blobs, no gradient mesh
- Cards with 1px borders and subtle hover shadows — they feel like you could pick them up
- A primary CTA button that's pill-shaped and red — it glows on hover because that tells you it's clickable
- Verified hacker profiles with a distinct red-bordered badge that glows — you know immediately this credential has been checked

Nothing is there by accident. Nothing is there because a template put it there. Every surface, every border, every glow has a job to do.
