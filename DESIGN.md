---
name: Butwal Hacks
description: A nonprofit youth technology initiative in Butwal, Nepal — ORCID-style verification and hackathon management platform. Flat Kloner.app foundation with selective red glow accents.
colors:
  primary: "#FE0000"
  primary-deep: "#B10000"
  primary-dark: "#7b0000"
  light-red: "#ff7c7c"
  light-red-soft: "#ffb9b9"
  bg-base-light: "#F7F7F8"
  surface-light: "#FFFFFF"
  surface-hover-light: "#F3F4F6"
  border-light: "#E5E5E5"
  text-muted-light: "#8B8B8B"
  text-secondary-light: "#5C5C5C"
  text-body-light: "#2C2C2C"
  text-primary-light: "#1F1F1F"
  bg-base-dark: "#121212"
  surface-dark: "#1E1E1E"
  surface-hover-dark: "#2A2A2A"
  border-dark: "#333333"
  text-muted-dark: "#6B6B6B"
  text-secondary-dark: "#A3A3A3"
  text-body-dark: "#D4D4D4"
  text-primary-dark: "#F5F5F5"
  status-green: "#22C55E"
  status-blue: "#3B82F6"
  status-teal: "#14B8A6"
  status-yellow: "#EAB308"
  status-orange: "#F97316"
  status-red: "#EF4444"
  glow-red: "0 0 20px rgba(254, 0, 0, 0.25)"
  glow-red-soft: "0 0 12px rgba(254, 0, 0, 0.15)"
typography:
  display:
    fontFamily: "'DM Sans', 'Inter', sans-serif"
    fontWeight: 800
    lineHeight: 1.08
  body:
    fontFamily: "'DM Sans', 'Inter', sans-serif"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontWeight: 700
    letterSpacing: "0.12em"
    textTransform: "uppercase"
    fontSize: "10px"
rounded:
  card: "12px"
  input: "8px"
  button: "8px"
  pill: "9999px"
  badge: "6px"
spacing:
  section: "4rem / 6rem (md)"
  card-padding: "1.5rem"
  grid-gap: "1.5rem"
shadows:
  sm: "0 1px 2px rgba(0, 0, 0, 0.04)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)"
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.button}"
    padding: "0.625rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-pill:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0.625rem 1.5rem"
    hover:
      boxShadow: "{glow-red}"
      backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "transparent"
    border: "1px solid {border-light}"
    rounded: "{rounded.button}"
    padding: "0.625rem 1.5rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{text-secondary-light}"
    rounded: "{rounded.button}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{surface-light}"
    border: "1px solid {border-light}"
    rounded: "{rounded.card}"
  input:
    backgroundColor: "{surface-light}"
    border: "1px solid {border-light}"
    rounded: "{rounded.input}"
    focus:
      borderColor: "{colors.primary}"
      boxShadow: "0 0 0 2px rgba(254, 0, 0, 0.15)"
  badge-red:
    backgroundColor: "rgba(254, 0, 0, 0.08)"
    textColor: "{colors.primary}"
    rounded: "{rounded.badge}"
---

# Design System: Butwal Hacks (Hybrid Kloner.app)

## 1. Overview

**Creative North Star: "The Builder's Workbench"**

Butwal Hacks is a flat, crisp, structured SaaS platform inspired by Kloner.app. The design prioritizes clarity and hierarchy over decoration — solid white cards, crisp 1px borders, and a single assertive red accent that earns its place by being used sparingly.

The system rejects dark glassmorphism, backdrop-blur surfaces, liquid glass effects, and anything that looks like a 2023-era AI startup. Instead, it builds depth through luminance contrast (dark text on white, light text on dark), subtle hover states, and a signature red glow reserved exclusively for primary actions and verified credentials.

**Key Characteristics:**
- **Flat-by-default** — surfaces are solid white (or dark charcoal), 1px borders, no backdrop-blur
- **Single accent discipline** — Butwal Red (`#FE0000`) is the only accent. It appears on ≤10% of any screen
- **Selective glow** — the red glow (`--bh-glow-red`) appears only on primary CTA hover and verified trust markers
- **Mono confidence** — JetBrains Mono for labels, badges, metadata signals "this is technical, precise"
- **Dark mode via CSS variables** — light and dark themes are true luminance inversions of each other

## 2. Colors: The Builder's Palette

### Primary
- **Butwal Red** (`#FE0000`): The single accent. Used for primary CTAs, trust markers (verified), and critical action buttons. Never decorative.
- **Deep Red** (`#B10000`): Hover state of primary red.
- **Dark Red** (`#7b0000`): Backgrounds for destructive panels.
- **Light Red** (`#ff7c7c`) / **Light Red Soft** (`#ffb9b9`): Used at low opacity for subtle backgrounds.

### Light Mode Neutrals
- **Bg Base** (`#F7F7F8`): Page background. Very light gray.
- **Surface** (`#FFFFFF`): Cards, sidebars, section backgrounds. Pure white.
- **Surface Hover** (`#F3F4F6`): Hover state for interactive surfaces.
- **Border** (`#E5E5E5`): Structural lines, dividers, container edges.
- **Text Muted** (`#8B8B8B`): Secondary info, timestamps, placeholder text.
- **Text Secondary** (`#5C5C5C`): Nav links, metadata (~6.3:1 on white ✅).
- **Text Body** (`#2C2C2C`): Primary reading text (~13.5:1 on white ✅).
- **Text Primary** (`#1F1F1F`): Headings, emphasized text (~16.5:1 on white ✅).

### Dark Mode Neutrals (strict luminance inversion)
- **Bg Base** (`#121212`): Page background. Near-black.
- **Surface** (`#1E1E1E`): Cards, sidebars.
- **Surface Hover** (`#2A2A2A`): Hover state.
- **Border** (`#333333`): Dividers, edges.
- **Text Muted** (`#6B6B6B`): Secondary info.
- **Text Secondary** (`#A3A3A3`): Nav links (~5.1:1 on #1E1E1E ✅).
- **Text Body** (`#D4D4D4`): Reading text.
- **Text Primary** (`#F5F5F5`): Headings.

### Status Colors
- Green (`#22C55E`): Success, online presence
- Blue (`#3B82F6`): Information, pending
- Teal (`#14B8A6`): Alternative accent for event UI
- Yellow (`#EAB308`): Warnings, pending review
- Orange (`#F97316`): Bounty levels, rewards
- Red (`#EF4444`): Destructive actions, errors

### Glow Tokens
- **Hackathon Glow** (`--bh-glow-red`): `0 0 20px rgba(254,0,0,0.25)` (light) / `0 0 30px rgba(254,0,0,0.35)` (dark). Used on primary pill buttons hover and verified trust markers hover.
- **Soft Glow** (`--bh-glow-red-soft`): `0 0 12px rgba(254,0,0,0.15)` (light) / `0 0 16px rgba(254,0,0,0.2)` (dark). Used on verified trust markers at rest.

## 3. Typography

**Body Font:** DM Sans (with Inter + system sans-serif fallback). CSS variable `--font-sans`.
**Mono Font:** JetBrains Mono (with monospace fallback). CSS variable `--font-mono`.

Fonts are self-hosted via `next/font/google` with `display: swap` and `preload: true`.

### Hierarchy
- **Display** (800, `text-4xl`–`text-7xl` clamp): Hero headlines. Leading of 1.08. Color: `text-primary`.
- **Title** (700, `text-lg`–`text-2xl`): Card titles, modal headers. Color: `text-primary`.
- **Body** (400, `text-base` with 1.625 line-height): Paragraphs, descriptions. Max width 65-75ch. Color: `text-text-body`.
- **Label/Mono** (700, `text-[10px]`, 0.12em tracking, uppercase): Badges, trust markers, metadata, IDs. JetBrains Mono. CSS: `font-mono text-[10px] font-bold uppercase tracking-[0.12em]`.

## 4. Elevation & Depth

The system uses a **flat-by-default** approach. Shadows appear only as a response to interaction:

- **Card at rest**: Solid white (`bg-surface`) with 1px border (`border-border`). No shadow.
- **Card hover**: Subtle shadow (`shadow-md` / `0 4px 6px -1px rgba(0,0,0,0.06)`) + slight lift (`hover:-translate-y-0.5`).
- **Interactive card hover**: Same as card hover + red border highlight (`border-color: rgba(254,0,0,0.3)`).
- **Primary button hover**: Red glow (`box-shadow: var(--bh-glow-red)`).

**No backdrop-blur. No glass effects on surfaces. No parallax on decorative elements.**

## 5. Components

### Cards (`bh-card`, `.bh-card-hover`, `.bh-card-interactive`)
- Solid white (or dark charcoal) surface.
- 1px crisp border (`border-border`).
- 12px border radius (`rounded-xl` / `0.75rem`).
- No shadow at rest. On hover: subtle shadow + slight translateY lift.
- Interactive variant adds red border highlight on hover.

### Buttons
| Variant | Class | Style | Hover |
|---------|-------|-------|-------|
| **Primary** | `bh-btn-primary` | Red background, white text, 8px radius | Deep red |
| **Pill (Primary)** | `bh-btn-pill` | Red background, white text, `rounded-full` | Deep red + red glow shadow |
| **Secondary** | `bh-btn-secondary` | Transparent, 1px border, 8px radius | Surface hover fill |
| **Ghost** | `bh-btn-ghost` | Text only, 8px radius | Surface hover fill |
| **Outline Pill** | `bh-btn-outline-pill` | Transparent, 1px border, `rounded-full` | Surface hover fill |

All buttons have `active:scale-[0.97]` for tactile press feedback.

### Inputs (`bh-input`, `.bh-input-sm`, `.bh-select`, `.bh-textarea`)
- White surface with 1px border, 8px radius.
- On focus: red border + red ring glow (`box-shadow: 0 0 0 2px rgba(254,0,0,0.15)`).
- Placeholder: `text-muted` (`#8B8B8B`).

### Badges
| Variant | Class | Style |
|---------|-------|-------|
| Red | `bh-badge-red` | `rgba(254,0,0,0.08)` bg, red text |
| Green | `bh-badge-green` | `rgba(34,197,94,0.08)` bg, green text |
| Blue | `bh-badge-blue` | `rgba(59,130,246,0.08)` bg, blue text |
| Yellow | `bh-badge-yellow` | `rgba(234,179,8,0.1)` bg, yellow text |
| Gray | `bh-badge-gray` | Surface hover bg, secondary text |

### Trust Markers
Three states, each with a dedicated utility class:

- **Verified** (`bh-trust-marker-verified`): Red border (30% opacity), red tint bg, red text, soft red glow. Glows brighter on hover.
- **Self-reported** (`bh-trust-marker-self-reported`): Standard border, surface hover bg, secondary text. No glow.
- **Revoked** (`bh-trust-marker-revoked`): Grey border (30% opacity), grey tint bg, muted text, strikethrough.

All trust markers use JetBrains Mono uppercase, 11px font, 0.05em letter-spacing, `rounded-full`.

### Navigation
- **Navbar**: Sticky, solid `bg-surface`, 1px bottom border on scroll. Red BH icon logo in deep red background.
- **Nav links**: Secondary text color, medium weight. Hover: primary text + surface hover bg.
- **Dashboard sidebar**: Solid surface, active state via red left border or red dot indicator.
- **Mobile**: Hamburger with overlay panel, fade + translate transition.

## 6. Do's and Don'ts

### Do:
- **Do** use `bh-card` as the primary container pattern for all card-like sections
- **Do** use `bh-btn-pill` (`rounded-full`) for primary CTAs — the red glow appears on hover
- **Do** reserve Butwal Red (`#FE0000`) exclusively for CTAs, trust markers, and verified badges — never for decorative borders
- **Do** use JetBrains Mono uppercase for all badges, labels, timestamps, and metadata
- **Do** use `focus-visible:ring-2 ring-primary-red/40 ring-offset-2 rounded-lg` as the global focus indicator
- **Do** use the `custom-scrollbar` utility for scrollable sections
- **Do** use `border-border` for all structural lines — `#E5E5E5` light, `#333333` dark
- **Do** use `text-text-body` for body copy — `#2C2C2C` light, `#D4D4D4` dark

### Don't:
- **Don't** use `backdrop-blur` — no glass effects on any surface
- **Don't** use inline `style={{}}` for colors — use `var(--bh-*)` or Tailwind classes
- **Don't** use more than one accent — Butwal Red is the only accent. Status colors are signal, not decoration
- **Don't** use box shadows on cards at rest — surfaces should appear flat until hovered
- **Don't** use DM Sans for metadata or badges — JetBrains Mono is for technical precision
- **Don't** use gradient text, parallax effects, or animated cursor-tracking elements
- **Don't** apply shadows and borders together on the same element — pick one (1px border OR shadow, not both)

## 7. CSS Custom Properties (Token Reference)

All design tokens are defined as CSS custom properties in `globals.css`:

```css
:root {
  --bh-primary-red: #FE0000;
  --bh-deep-red: #B10000;
  --bh-dark-red: #7b0000;
  --bh-bg-base: #F7F7F8;
  --bh-surface: #FFFFFF;
  --bh-surface-hover: #F3F4F6;
  --bh-border: #E5E5E5;
  --bh-text-muted: #8B8B8B;
  --bh-text-secondary: #5C5C5C;
  --bh-text-body: #2C2C2C;
  --bh-text-primary: #1F1F1F;
  --bh-glow-red: 0 0 20px rgba(254, 0, 0, 0.25);
  --bh-glow-red-soft: 0 0 12px rgba(254, 0, 0, 0.15);
}

.dark {
  /* Luminance inversion of :root values */
  --bh-bg-base: #121212;
  --bh-surface: #1E1E1E;
  --bh-border: #333333;
  --bh-text-primary: #F5F5F5;
  --bh-glow-red: 0 0 30px rgba(254, 0, 0, 0.35);
}
```

Tailwind v4 `@theme` directives map these to utility classes (`bg-surface`, `text-primary`, `border-border`, etc.). See `globals.css` for the complete mapping.

All utility classes (`bh-card`, `bh-btn-primary`, `bh-input`, `bh-badge-*`, `bh-trust-marker-*`, etc.) are defined in `globals.css` `@layer utilities`.
