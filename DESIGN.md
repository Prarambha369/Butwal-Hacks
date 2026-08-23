---
name: Butwal Hacks
description: ORCID-style verification and hackathon management platform for Nepal's youth tech community. Flat, layered Kloner.app aesthetic with selective red glow on CTAs and verified trust markers.
colors:
  primary: "#FE0000"
  primary-deep: "#B10000"
  primary-dark: "#7b0000"
  light-red: "#ff7c7c"
  light-red-soft: "#ffb9b9"
  bg-base-light: "#F7F7F8"
  surface-light: "#FFFFFF"
  surface-hover-light: "#F0F0F2"
  border-light: "#E5E5E5"
  text-muted-light: "#888888"
  text-secondary-light: "#666666"
  text-body-light: "#333333"
  text-primary-light: "#1F1F1F"
  bg-base-dark: "#1a1a1a"
  surface-dark: "#2a2a2a"
  surface-hover-dark: "#3a3a3a"
  border-dark: "#4a4a4a"
  text-muted-dark: "#7a7a7a"
  text-secondary-dark: "#909090"
  text-body-dark: "#cccccc"
  text-primary-dark: "#f0f0f0"
  status-green: "#16A34A"
  status-blue: "#2563EB"
  status-teal: "#0D9488"
  status-yellow: "#CA8A04"
  status-orange: "#EA580C"
  status-red: "#DC2626"
typography:
  display:
    fontFamily: "'DM Sans', 'Inter', sans-serif"
    fontWeight: 800
    lineHeight: 1.08
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
  body:
    fontFamily: "'DM Sans', 'Inter', sans-serif"
    fontWeight: 400
    lineHeight: 1.625
    fontSize: "0.9375rem"
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontWeight: 700
    letterSpacing: "0.12em"
    textTransform: "uppercase"
    fontSize: "0.625rem"
  title:
    fontFamily: "'DM Sans', 'Inter', sans-serif"
    fontWeight: 700
    lineHeight: 1.25
    fontSize: "1rem"
rounded:
  card: "12px"
  input: "8px"
  button: "8px"
  pill: "9999px"
  badge: "6px"
spacing:
  section: "5rem"
  card-padding: "1.5rem"
  grid-gap: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.button}"
    padding: "0.625rem 1.5rem"
    fontWeight: 700
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    boxShadow: "0 0 20px rgba(254, 0, 0, 0.2)"
  button-pill:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0.75rem 2rem"
    fontWeight: 700
  button-pill-hover:
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
    padding: "{spacing.card-padding}"
  card-hover:
    backgroundColor: "{surface-light}"
    border: "1px solid {border-light}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  input:
    backgroundColor: "{surface-light}"
    border: "1px solid {border-light}"
    rounded: "{rounded.input}"
    padding: "0.5rem 0.75rem"
  badge:
    backgroundColor: "rgba(254, 0, 0, 0.08)"
    textColor: "{colors.primary}"
    rounded: "{rounded.badge}"
    fontSize: "0.6875rem"
    fontWeight: 600
---

# Design System: Butwal Hacks

## 1. Overview

**Creative North Star: "The Builder's Workbench"**

Butwal Hacks is a flat, layered SaaS platform built for Nepal's hacker community — a workbench with everything a builder needs and nothing they don't. The design prioritizes clarity, hierarchy, and earned familiarity over ornament.

Surfaces are solid white or light gray (`#F7F7F8` / `#FFFFFF`). Borders are crisp 1px (`#E5E5E5`). Depth comes from tonal layering — lighter content areas, slightly darker sidebars and panels — not from shadows or blur. A single assertive red accent (`#FE0000`) earns its place by being used sparingly on primary actions and verified credentials only.

The system rejects dark glassmorphism, backdrop-blur surfaces, liquid glass effects, gradient text, and anything that reads as a 2023-era AI startup. Instead, it builds trust through precision: consistent component vocabulary, exacting spacing, and a visual system that mirrors the cryptographic rigor of the trust marker engine underneath.

**Key Characteristics:**
- **Layered-by-default** — depth through background lightness changes, not shadows or glass
- **Single accent discipline** — Butwal Red is the only accent; appears on ≤10% of any screen
- **Selective glow** — red glow appears only on primary CTA hover and verified trust markers
- **Mono confidence** — JetBrains Mono for badges, metadata, IDs signals "this is technical, precise"
- **Responsive grid** — `repeat(auto-fit, minmax(280px, 1fr))` for adaptive layouts; no breakpoint-specific grid overrides

## 2. Colors: The Builder's Palette

A restrained neutral foundation with a single high-commitment red accent. Status colors are signal, not decoration.

### Primary
- **Butwal Red** (`#FE0000`): The single accent. Used for primary CTAs, trust markers (verified), and critical action buttons. Never decorative.
- **Deep Red** (`#B10000`): Hover state of primary buttons.
- **Dark Red** (`#7b0000`): Backgrounds for destructive or high-severity panels.
- **Light Red** (`#ff7c7c`) / **Light Red Soft** (`#ffb9b9`): Used at low opacity for subtle backgrounds and badges.

### Light Mode Neutral Scale
- **Bg Base** (`#F7F7F8`): Page background. Very light gray — the canvas.
- **Surface** (`#FFFFFF`): Cards, sidebars, section backgrounds. Pure white.
- **Surface Hover** (`#F0F0F2`): Hover state for interactive surfaces.
- **Border** (`#E5E5E5`): Structural lines, dividers, container edges.
- **Border Light** (`#EBEBEB`): Lighter dividers for nested groupings.
- **Text Muted** (`#888888`): Secondary info, timestamps, placeholder text. 4.8:1 on white ✅.
- **Text Secondary** (`#666666`): Nav links, metadata. 6.9:1 on white ✅.
- **Text Body** (`#333333`): Primary reading text. 12.8:1 on white ✅.
- **Text Primary** (`#1F1F1F`): Headings, emphasized text. 16.5:1 on white ✅.

### Dark Mode Neutral Scale (luminance inversion)
- **Bg Base** (`#1a1a1a`): Page background.
- **Surface** (`#2a2a2a`): Cards, sidebars.
- **Surface Hover** (`#3a3a3a`): Hover state.
- **Border** (`#4a4a4a`): Dividers, edges.
- **Text Muted** (`#7a7a7a`): Secondary info. 4.8:1 on #2a2a2a ✅.
- **Text Body** (`#cccccc`): Reading text.
- **Text Primary** (`#f0f0f0`): Headings.

### Status Colors
- **Green** (`#16A34A` light / `#4ADE80` dark): Success, online presence, verified.
- **Blue** (`#2563EB` / `#60A5FA`): Information, pending, links.
- **Teal** (`#0D9488` / `#2DD4BF`): Alternative accent for event UI.
- **Yellow** (`#CA8A04` / `#FACC15`): Warnings, pending review badges.
- **Orange** (`#EA580C` / `#FB923C`): Bounty levels, rewards, medium severity.
- **Red** (`#DC2626` / `#F87171`): Destructive actions, errors, high severity.

### Surface Inverse
- **Surface Inverse** (`#1F1F1F` light / `#333333` dark): Dark background for CTAs and code blocks in light mode; lighter panel in dark mode.

### Glow Tokens
- **Red Glow** (`--bh-glow-red`): `0 0 20px rgba(254,0,0,0.2)` light / `0 0 30px rgba(254,0,0,0.45)` dark. Primary pill buttons on hover and verified trust markers on hover.
- **Soft Red Glow** (`--bh-glow-red-soft`): `0 0 12px rgba(254,0,0,0.12)` light / `0 0 16px rgba(254,0,0,0.25)` dark. Verified trust markers at rest.

### Named Rules
**The Single Accent Rule.** Butwal Red is the only accent. Status colors carry meaning (green = success, blue = info), not decoration. If a color can't justify its role in one sentence, it's decorative — remove it.

## 3. Typography

**Body Font:** DM Sans (warm geometric sans, with Inter + system sans-serif fallback). Self-hosted via `next/font/google`.
**Mono Font:** JetBrains Mono (coding monospace with distinct punctuation). Self-hosted via `next/font/google`.

**Character:** DM Sans carries the warm, human feel of a community platform without sacrificing legibility. JetBrains Mono signals technical precision — badges, IDs, metadata. The pairing is purpose-based: human content in DM Sans, machine data in mono.

### Hierarchy
- **Display** (800, `clamp(2rem, 5vw, 3.5rem)`, 1.08 line-height): Hero headlines only. Using `text-wrap: balance`. Color: `text-primary`.
- **Title** (700, `1rem` / `text-base`, 1.25 line-height): Card titles, modal headers, section headings. Color: `text-primary`.
- **Body** (400, `0.9375rem` / `text-[15px]`, 1.625 line-height): Paragraphs, descriptions, list items. Max width 65–75ch for prose. Color: `text-body`.
- **Label/Mono** (700, `0.625rem` / `text-[10px]`, 0.12em tracking, uppercase): Badges, timestamps, metadata, BH-IDs, API keys. JetBrains Mono. Color: `text-muted`.

### Named Rules
**The Mono Data Rule.** Any text that represents a technical identifier (BH-ID, date, task name, API key) uses JetBrains Mono. Any text meant to be read as prose uses DM Sans. If in doubt, DM Sans wins.

## 4. Elevation

The system uses a **layered** model — depth is communicated through background lightness changes rather than shadows or glass effects.

- **Content surface** (`bg-base`, `#F7F7F8`): The page background. Lightest layer.
- **Card surface** (`bg-surface`, `#FFFFFF`): Cards, sidebars, modals. One step lighter than bg-base.
- **Hover state** (`bg-surface-hover`, `#F0F0F2`): Interactive surfaces on hover. One step darker than surface.
- **Inverse surface** (`bg-surface-inverse`, `#1F1F1F`): Dark panels in light mode, lighter panels in dark mode. Contrasts against the normal surface stack.

**No shadows at rest.** Shadows appear only as interaction feedback on hover states:
- **Card hover**: `box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06)` (light) — subtle, wide, diffused.
- **Modal/overlay**: `box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08)` — deeper for floating layers.
- **Primary button hover**: Red glow replaces shadow (`0 0 20px rgba(254,0,0,0.2)`).

**No backdrop-blur. No glass effects. No parallax.** The layered tonal approach is the only depth system.

### Named Rules
**The Flat-At-Rest Rule.** Every surface is flat until the user interacts with it. Shadows and glows are responses to hover, focus, or active states only. At rest, the interface is a set of crisp planes distinguished by lightness alone.

## 5. Components

### Cards (`bh-card`, `bh-card-hover`, `bh-card-interactive`)
- **Shape:** Gently rounded corners (12px / `rounded-xl`).
- **Background:** Solid white (`bg-surface`).
- **Border:** 1px crisp (`border-border`).
- **Shadow at rest:** None.
- **Hover treatment:** Subtle shadow (`shadow-md` / `0 4px 6px -1px rgba(0,0,0,0.06)`) + slight lift (`hover:-translate-y-0.5`).
- **Internal padding:** `1.5rem` (p-6).
- **Interactive variant:** Hover also adds `border-primary-red/30` border highlight.

### Buttons
All buttons share `cursor-pointer`, `select-none`, `font-bold`, `transition-all duration-200`, and `active:scale-[0.97]` for tactile press feedback.

| Variant | Shape | Rest State | Hover | Focus |
|---------|-------|------------|-------|-------|
| **Primary** (`bh-btn-primary`) | 8px radius | `bg-primary-red`, white text | `bg-deep-red` | `ring-2 ring-primary-red ring-offset-2` |
| **Pill** (`bh-btn-pill`) | `rounded-full` | `bg-primary-red`, white text, 0.75rem 2rem padding | `bg-deep-red` + red glow shadow | same ring |
| **Secondary** (`bh-btn-secondary`) | 8px radius | Transparent, 1px `border-border`, `text-primary` | `bg-surface-hover` | same ring |
| **Ghost** (`bh-btn-ghost`) | 8px radius | Transparent, `text-secondary` | `bg-surface-hover` | same ring |

All buttons have `disabled:opacity-50 disabled:cursor-not-allowed`. Pill variant adds `font-bold` for emphasis.

### Inputs (`bh-input`, `bh-textarea`, `bh-select`)
- **Shape:** Gently rounded corners (8px).
- **Rest:** White `bg-surface`, 1px `border-border`, `text-primary` value, `text-muted` placeholder.
- **Focus:** Red border + `box-shadow: 0 0 0 2px rgba(254,0,0,0.15)` ring.
- **Disabled:** `opacity-50`, `cursor-not-allowed`.
- **Error:** Red border + red tint bg + red text message below.

### Badges (`bh-badge-*`)
- **Shape:** 6px rounded corners.
- **Font:** JetBrains Mono, `text-[11px]`, `font-semibold`, `uppercase`, `tracking-wide`.
- **Red badge** (`bh-badge-red`): `rgba(254,0,0,0.08)` bg, `text-primary-red`.
- **Green badge** (`bh-badge-green`): `rgba(22,163,74,0.08)` bg, `text-status-green`.
- **Blue badge** (`bh-badge-blue`): `rgba(37,99,235,0.08)` bg, `text-status-blue`.
- **Yellow badge** (`bh-badge-yellow`): `rgba(202,138,4,0.1)` bg, `text-status-yellow`.
- **Gray badge** (`bh-badge-gray`): `bg-surface-hover`, `text-muted`.

### Trust Markers
Three visual tiers:

- **Verified** — Red border (30% opacity), red tint bg, red text, soft red glow at rest (`--bh-glow-red-soft`), brighter on hover (`--bh-glow-red`).
- **Self-reported** — Standard `border-border`, `bg-surface-hover`, `text-secondary`. No glow.
- **Revoked** — Gray border (30% opacity), gray tint bg, `text-muted`, `line-through`.

All trust markers use JetBrains Mono, `text-[11px]`, `font-bold`, `uppercase`, `tracking-[0.05em]`, `rounded-full`.

### Navigation
- **Top Navbar**: Sticky, `bg-surface`, 1px `border-b border-border` on scroll. Red BH logo icon in `bg-deep-red` square. Nav links in `text-secondary`/`hover:text-primary`/`hover:bg-surface-hover`.
- **Dashboard Sidebar**: Fixed `w-56`, `bg-surface`, `border-r border-border`. Active nav item highlighted with red dot indicator and `font-semibold`. Role badge at top displays current role color.
- **Mobile**: Hamburger button (`md:hidden`) opens slide-in overlay with `shadow-xl`.

## 6. Do's and Don'ts

### Do:
- **Do** use `bg-surface` / `border-border` / `rounded-xl` as the standard card recipe
- **Do** use `bh-btn-pill` (`rounded-full`) for primary CTAs — the red glow appears on hover
- **Do** reserve Butwal Red (`#FE0000`) exclusively for CTAs, trust markers, and verified badges
- **Do** use JetBrains Mono uppercase for all badges, labels, timestamps, BH-IDs, and metadata
- **Do** use `focus-visible:ring-2 ring-primary-red ring-offset-2` as the global focus indicator
- **Do** layer depth through tonal background changes (lighter content, darker sidebars)
- **Do** use `text-body` for body copy (`#333333` light / `#cccccc` dark)
- **Do** use `text-muted` for placeholders, timestamps, and secondary metadata

### Don't:
- **Don't** use `backdrop-blur` — no glass effects on any surface
- **Don't** use inline `style={{}}` for colors — use `var(--bh-*)` CSS properties or Tailwind classes
- **Don't** use more than one accent on a screen — Butwal Red is the single accent; status colors are signal, not decoration
- **Don't** use box shadows on cards at rest — shadows are hover-interaction feedback only
- **Don't** use DM Sans for badges, IDs, or metadata — JetBrains Mono is for technical precision
- **Don't** use gradient text, parallax effects, or animated cursor-tracking elements
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards — never intentional
- **Don't** use the hero-metric template (big number, small label, gradient accent) — SaaS cliché
- **Don't** recreate the Kloner.app look exactly — the hybrid approach (flat foundation + layered depth + selective glow) is the brand
