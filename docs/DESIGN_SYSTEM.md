# Design System

The Butwal Hacks interface uses flat, solid surfaces with selective red accents. Cards have crisp 1px borders. Background blur is used for functional separation (modal overlays, status toasts, image captions) not decoration.

## Colors

### Brand Reds

| Token | Value | Usage |
|-------|-------|-------|
| Primary Red | `#FE0000` | CTAs, trust markers, brand identity |
| Deep Red | `#B10000` | Button hover states, dark red surfaces |
| Dark Red | `#7b0000` | Deep backgrounds, destructive buttons |

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| Background Base | `#F7F7F8` | Page background |
| Surface | `#FFFFFF` | Cards, modals, inputs |
| Surface Hover | `#F0F0F2` | Hover states |
| Border | `#E5E5E5` | All borders, dividers |
| Text Muted | `#888888` | Secondary text, placeholders |
| Text Secondary | `#666666` | Body text |
| Text Body | `#333333` | Paragraph text |
| Text Primary | `#1F1F1F` | Headings, titles |

### Dark Mode

| Token | Value |
|-------|-------|
| Background Base | `#1a1a1a` |
| Surface | `#2a2a2a` |
| Border | `#4a4a4a` |
| Text Primary | `#f0f0f0` |

## Rules

### 1. No Inline Styles for Colors
Use Tailwind arbitrary values or CSS variable references. Never use `style={{ backgroundColor: '#FE0000' }}`.

Correct: `bg-[#FE0000]` or `bg-primary-red`
Wrong: `style={{ background: '#FE0000' }}`

### 2. Concentricity
Inner radius equals outer radius minus padding. For example, if a card has `rounded-[20px]` and `p-4` (16px), inner content should have `rounded-[4px]`.

### 3. Trust Hierarchy

| Level | Style |
|-------|-------|
| Verified | Red border (`border-[#FE0000]`) with red glow (`shadow-[0_0_12px_rgba(254,0,0,0.12)]`) |
| Self-Reported | Standard border, no glow |
| Revoked | Greyed out with strikethrough |

### 4. Typography

- **DM Sans** (Inter fallback): headings, body text, labels, UI copy
- **JetBrains Mono**: BH-IDs, dates, task names, code blocks, monospaced data

### 5. Buttons

| Type | Style |
|------|-------|
| Primary | Solid red (`#FE0000`), white text, pill shape (`rounded-full`), glow on hover |
| Secondary | White surface, 1px border, pill shape, no glow |
| Ghost | Text-only, no background, pill shape |

### 6. Surfaces

- Cards are solid white (`#FFFFFF`) with 1px borders (`#E5E5E5`)
- No backdrop blur on cards, buttons, or page sections
- Blur is acceptable for: modal overlays, status toasts, image captions over photos
- No gradient backgrounds on page sections (gradients on hero photos are fine)

### 7. Glow Usage

The red glow (`--bh-glow-red`) appears only on hover for primary CTAs and permanently on verified trust markers. Self-reported items never glow.
