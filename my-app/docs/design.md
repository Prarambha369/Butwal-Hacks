# Design System: Butwal Hacks (Liquid Glass Edition)

## 1. Visual Theme & Atmosphere

The Butwal Hacks design system embodies a "High-End Hacker Workshop." It merges Apple's meticulous precision (translucent materials, concentric geometry) with Hack Club's raw, youthful energy, grounded in Butwal's cultural heritage.

The visual language is immersive and premium. Instead of flat backgrounds, the UI floats on deep, dark surfaces, layered with translucent, blurred "Liquid Glass" elements. The atmosphere is empowering and authoritative—designed to signal that this is the official infrastructure layer for tech talent, where achievements are permanent and verified.

**Key Characteristics**
- Deep, immersive dark mode base with high-contrast, surgical use of Heritage Red.
- Translucent "Liquid Glass" surfaces (backdrop-blur, subtle borders) that let background glows peek through.
- Mathematical "concentricity" in corners (Inner Radius = Outer Radius - Padding) to create a quiet, nested rhythm.
- Monospace typography for technical data (IDs, stats) to signal precision and authenticity.
- Strict visual hierarchy separating "Self-Reported" data from "Verified Trust" data.

## 2. Color Palette & Roles

### Primary Reds (Action & Trust)
Red is used surgically. It is never used for large background areas (to prevent eye strain). It is reserved for Primary CTAs, Verified Trust Markers, and subtle glows.
- **Heritage Red** (`#FE0000`): Primary call-to-action buttons, verified badge backgrounds, and key brand markers.
- **Deep Red** (`#B10000`): Hover states for primary buttons, glowing borders for Trust Markers.
- **Dark Red** (`#7b0000`): Deep, ambient radial glows in the hero background.
- **Light Red / Glow** (`#ff7c7c` / `#ffb9b9`): Soft hover states for glass cards or subtle text highlights.

### Neutral Scale (Structure & UI)
The entire application structure uses this grayscale ramp to create the premium, high-contrast aesthetic.
- **Temple Black** (`#242424`): The deepest base layer of the app (Immersive Background).
- **Glass Surface** (`#434343`): Used with opacity (e.g., `bg-[#434343]/70`) to create Liquid Glass cards.
- **Borders** (`#656565`): Used with low opacity (e.g., `border-[#656565]/30`) for subtle glass borders.
- **Muted Text** (`#898989`): Secondary text, metadata, dates, and placeholders.
- **Body Text** (`#d6d6d6`): Standard paragraph text for readability.
- **Builder White** (`#FFFFFF`): Bold headlines, primary card titles, and text on red buttons.

## 3. Typography Rules

### Font Family
- **Primary: Inter** (sans-serif, body/headings)
  - Fallback stack: `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
- **Secondary: JetBrains Mono** (monospace, technical metadata)
  - Fallback stack: `JetBrains Mono, Menlo, Monaco, Consolas, Liberation Mono, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display/H1 | Inter | 60px (`text-6xl`) | 800 (`font-extrabold`) | 1.1 | -0.02em (`tracking-tighter`) | Hero headlines, massive left-aligned titles |
| Heading/H2 | Inter | 36px (`text-4xl`) | 700 (`font-bold`) | 1.2 | -0.01em (`tracking-tight`) | Section headings, dashboard titles |
| Heading/H3 | Inter | 24px (`text-2xl`) | 600 (`font-semibold`) | 1.3 | 0px | Card titles, subsection headers |
| Body Text | Inter | 16px (`text-base`) | 400 | 1.5 | 0px | Primary paragraph text, descriptions |
| Emphasis Text | Inter | 14px (`text-sm`) | 500 | 1.4 | 0px | Secondary body, supplementary text |
| Technical/Mono | JetBrains Mono | 14px (`text-sm`) | 400 | 1.4 | 0.05em | Hacker IDs, stats, dates, code blocks |

### Principles
- **Inter** provides a clean, modern, Apple-esque readability for all UI elements.
- **JetBrains Mono** is reserved for technical metadata (e.g., `BH-24-001`), signaling precision and the "hacker" ethos.
- Headlines are always left-aligned and bold. Center alignment is reserved only for single-line stats or modal headers.
- Weight hierarchy is strict: Extrabold for heroes, Semibold for cards, Regular for body.

## 4. Component Stylings

*Note: All components MUST use Tailwind arbitrary values (e.g., `bg-[#242424]`) instead of inline `style={{}}` attributes to prevent React Hydration mismatches.*

### Buttons

#### Primary Button (Capsule)
- **Background**: `bg-[#FE0000]`
- **Text Color**: `text-[#FFFFFF]`
- **Font**: Inter, 16px, 600 weight
- **Padding**: `10px 24px`
- **Border Radius**: `rounded-[9999px]` (Capsule)
- **Hover State**: `hover:bg-[#B10000]`, slight scale `hover:scale-[1.02]`
- **Usage**: "Sign Up", "Register", "Issue Marker".

#### Secondary Button (Glass Outline)
- **Background**: `bg-transparent`
- **Text Color**: `text-[#FFFFFF]`
- **Font**: Inter, 16px, 500 weight
- **Padding**: `10px 24px`
- **Border Radius**: `rounded-[9999px]`
- **Border**: `border border-[#656565]/50`
- **Hover State**: `hover:bg-[#434343]/50`

#### Icon Button
- **Background**: `bg-[#434343]/70 backdrop-blur-[30px]`
- **Text Color**: `text-[#FFFFFF]`
- **Size**: `40px x 40px` (`h-10 w-10`)
- **Border Radius**: `rounded-[12px]` (Fixed shape, not capsule)
- **Border**: `border border-[#656565]/30`

### Cards & Containers (Liquid Glass)

#### Standard Glass Card
- **Background**: `bg-[#434343]/70`
- **Blur**: `backdrop-blur-[30px] saturate-[180%]`
- **Text Color**: `text-[#FFFFFF]`
- **Padding**: `24px` (`p-6`)
- **Border Radius**: `rounded-[20px]` (Outer)
- **Border**: `border border-[#656565]/30`
- **Box Shadow**: `shadow-[0_8px_32px_rgba(0,0,0,0.3)]`
- **Usage**: Self-reported projects, standard dashboard widgets.

#### Verified Trust Marker Card
- **Background**: `bg-[#434343]/70` (Same glass)
- **Border**: `border-[#FE0000]`
- **Box Shadow**: `shadow-[0_0_15px_rgba(254,0,0,0.2)]` (Red Glow)
- **Usage**: ONLY for Organizer-issued Trust Markers.

#### Revoked Marker Card
- **Background**: `bg-[#434343]/50` (Faded)
- **Text Color**: `text-[#898989] line-through`
- **Border**: `border border-[#656565]/30`
- **Usage**: Revoked certificates (maintains audit trail).

### Concentric Math (Crucial)
If a Glass Card has a corner radius of `20px` (`rounded-[20px]`) and padding of `16px` (`p-4`), the inner element (like an image or code block) MUST have a corner radius of `4px` (`rounded-[4px]`).
*Formula: Inner Radius = Outer Radius - Padding.*

### Inputs & Forms

#### Text Input
- **Background**: `bg-[#242424]/50`
- **Text Color**: `text-[#FFFFFF]`
- **Font**: Inter, 16px, 400 weight
- **Padding**: `12px 16px`
- **Border Radius**: `rounded-[12px]`
- **Border**: `border border-[#656565]/30`
- **Focus State**: `focus:border-[#FE0000]`, `focus:ring-2 focus:ring-[#FE0000]/20`
- **Placeholder Color**: `text-[#898989]`

## 5. Layout Principles

### Spacing System
**Base Unit**: `4px`
- `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`.
- Sections maintain `64px` vertical spacing for breathing room.

### Grid & Container
- **Max Width**: `1200px` (Centered content container)
- **Navbar**: Floating, sticky, max-width `1100px`, centered with `24px` side margins.
- **Bento Grid**: Irregular CSS Grid (`grid-cols-1 md:grid-cols-3`). Items can span 2 rows/cols (`md:row-span-2`) for visual interest on the homepage.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Ground (0) | Solid `#242424` background | App base layer. |
| Glass (1) | `bg-[#434343]/70 backdrop-blur-[30px]` | Standard cards, navbars, sidebars. |
| Opaque (2) | Solid `#434343` background | Dense data tables in Organizer/Maintainer dashboards (macOS style). |
| Elevated (3) | Glass + `shadow-[0_8px_32px_rgba(0,0,0,0.3)]` | Modals, popovers, floating action buttons. |
| Trust Glow (4) | Glass + `shadow-[0_0_15px_rgba(254,0,0,0.2)]` | Verified Trust Markers only. |

## 7. Do's and Don'ts

### Do
- **Use Heritage Red** (`#FE0000`) surgically for primary CTAs and Trust Markers.
- **Use Tailwind arbitrary values** (`bg-[#242424]`) for all colors to prevent hydration errors.
- **Maintain strict concentric math** when nesting elements inside Glass Cards.
- **Use JetBrains Mono** for all IDs, stats, and dates to reinforce the technical aesthetic.
- **Apply heavy backdrop-blur** (`backdrop-blur-[30px]`) to make glass surfaces pop against the dark background.

### Don't
- **NEVER use inline `style={{}}` attributes** for colors or backgrounds (causes SSR hydration mismatches).
- **NEVER use Heritage Red** for massive background areas; it causes severe eye strain. Use it only for glows, borders, and buttons.
- **Don't use border radius below `8px`** for interactive elements.
- **Don't mix auth contexts.** Auth0 handles 100% of auth. Supabase is database-only (Service Role Key).
- **Avoid flat, solid backgrounds** for cards. They must be translucent to maintain the Liquid Glass aesthetic.

## 8. Agent Prompt Guide (For AI Implementation)

When building components, feed the AI these exact class strings:

- **Glass Wrapper:** `className="bg-[#434343]/70 backdrop-blur-[30px] saturate-[180%] border border-[#656565]/30 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"`
- **Primary Button:** `className="bg-[#FE0000] hover:bg-[#B10000] text-white font-semibold rounded-[9999px] px-6 py-2.5 transition-all hover:scale-[1.02]"`
- **Verified Marker:** `className="bg-[#434343]/70 border border-[#FE0000] shadow-[0_0_15px_rgba(254,0,0,0.2)] rounded-[20px] p-4"`
- **Monospace ID:** `className="font-mono text-[#898989] text-sm tracking-wider"`
