# Butwal Hacks — Web App

The production website for [Butwal Hacks](https://butwalhacks.com), a youth-led nonprofit technology community in Western Nepal.

Built with **Next.js 15 App Router**, **Tailwind CSS v4**, **TypeScript**, and **animejs**.

---

## Quick Start

```bash
# From the repo root (monorepo workspace)
npm install
npm run dev
# → http://localhost:3000
```

> **Node version:** 18+ recommended.

---

## Project Structure

```
my-app/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout (font, theme, analytics, metadata)
│   ├── page.tsx          # Home page (JSON-LD + <DesktopLanding />)
│   ├── globals.css       # Design tokens, animations, reduced-motion
│   ├── sitemap.ts        # Auto-generated XML sitemap
│   ├── robots.ts         # robots.txt rules
│   ├── about/            # Static pages (about, community, contact…)
│   ├── blog/             # Blog index + [slug] detail
│   ├── events/           # Events index + [slug] detail
│   ├── initiatives/      # Initiatives index + [slug] detail
│   └── governance/       # Governance page
│
├── components/
│   ├── home/
│   │   └── desktop-landing.tsx   # 10-section landing page (main deliverable)
│   ├── site-header.tsx            # Sticky header + mobile nav
│   ├── footer.tsx                 # Shared footer (if used)
│   └── ui/                        # shadcn/ui primitives (badge, card…)
│
├── hooks/
│   └── useInViewOnce.ts   # IntersectionObserver hook (scroll-triggered reveals)
│
├── lib/
│   ├── content.ts         # All site content: initiatives, events, blogPosts
│   ├── seo.ts             # buildPageMetadata() helper + siteKeywords
│   ├── nav-config.ts      # Navigation structure (used by site-header)
│   └── utils.ts           # cn() Tailwind class merge utility
│
├── public/
│   └── logo.png           # Primary logo (also used as favicon)
│
├── next.config.ts         # Next.js config (strict mode, image domains)
└── tsconfig.json
```

---

## Adding & Editing Content

All site content lives in **`lib/content.ts`** — no CMS required.

### Add an Initiative

```ts
// lib/content.ts
export const initiatives: Initiative[] = [
  {
    slug: "my-initiative",       // URL: /initiatives/my-initiative
    name: "My Initiative",
    status: "active",            // "active" | "planned" | "proposed"
    tier: 2,                     // 1–4 (display priority)
    summary: "One-line summary shown on cards.",
    details: [
      "Paragraph shown on the detail page.",
    ],
  },
  // …existing initiatives
]
```

### Add an Event

```ts
export const events: EventItem[] = [
  {
    slug: "event-slug-2026",
    title: "Event Name 2026",
    initiativeSlug: "hackathon",  // must match an initiative slug
    status: "planned",            // "planned" | "completed"
    dateLabel: "October 10–11, 2026",
    summary: "Short description for cards and SEO.",
  },
]
```

### Add a Blog Post

```ts
export const blogPosts: BlogPost[] = [
  {
    slug: "my-post",
    title: "My Post Title",
    publishedAt: "2026-04-01",    // ISO date — used in sitemap lastModified
    excerpt: "Short summary for cards and meta description.",
    body: [
      "First paragraph.",
      "Second paragraph.",
    ],
  },
]
```

---

## Navigation

Edit **`lib/nav-config.ts`** to add, remove, or reorder nav items. Items with a `children` array render as dropdown menus on desktop and collapsible sections on mobile.

---

## Design System

| Token | Value |
|---|---|
| Primary (crimson) | `#8B0000` (light) / `#DC143C` (dark) |
| Background (dark) | `#0f0f0f` |
| Font | Inter (via `next/font/google`) |
| Border radius | `0.375rem` |
| Max content width | `1280px` (`max-w-6xl`) |

**Spacing scale:** `8 / 16 / 24 / 32 / 48 / 64 / 96px`

### CSS Classes (globals.css)

| Class | Purpose |
|---|---|
| `.section-fade` | Scroll reveal — add `is-visible` to animate in |
| `.hero-animate` | Hero entrance target for animejs |
| `.hero-bg` | Deep red→black gradient + dot-grid texture |
| `.hover-shimmer` | Shimmer sweep on card hover |
| `.live-pulse` | Pulsing green dot for LIVE badges |

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce`. animejs checks this before running. CSS transitions collapse to `0.01ms`.

---

## Animation (animejs)

The hero section entrance uses **animejs** (`import("animejs")` — dynamic import).

```ts
// Pattern used in desktop-landing.tsx
import("animejs").then((mod) => {
  const anime = mod.default ?? mod
  anime({
    targets: containerRef.current!.querySelectorAll(".hero-animate"),
    opacity: [0, 1],
    translateY: [28, 0],
    duration: 800,
    easing: "easeOutQuad",
    delay: anime.stagger(120, { start: 60 }),
  })
})
```

Scroll sections use `useInViewOnce` + `.section-fade` CSS — no JS animation library needed.

---

## SEO

- **Per-page metadata:** use `buildPageMetadata()` from `lib/seo.ts`
- **JSON-LD:** Organization + NGO schema in `app/page.tsx`
- **Sitemap:** auto-generated from `app/sitemap.ts` — add new static routes there
- **Robots:** `app/robots.ts` allows all crawlers, references sitemap

```ts
// Example — adding metadata to a new page
import { buildPageMetadata } from "@/lib/seo"

export const metadata = buildPageMetadata({
  title: "Page Title",
  description: "Page description for Google and social sharing.",
  path: "/my-page",
  keywords: ["extra", "keywords"],
})
```

---

## Analytics

- **Vercel Analytics** — `<Analytics />` in `app/layout.tsx` (automatic, no config needed on Vercel)
- **Google Analytics** — GA4 tag `G-NKE935H259` loaded via `next/script` with `strategy="afterInteractive"`

---

## Deployment

Deployed to **Vercel** via GitHub integration. Pushes to `main` trigger a production deploy automatically.

Environment variables: none required for the current feature set.

---

## Contributing

1. Fork → branch (`feature/my-feature`)
2. Run `npm run dev` and test locally
3. Run `npm run lint` — fix any ESLint errors
4. Run `npm run build` — ensure no TypeScript or build errors
5. Open a Pull Request with a clear description

**Code style:** TypeScript strict mode. Keep components focused. Prefer server components; add `"use client"` only when browser APIs or hooks are needed.

---

## Maintainers

This project is volunteer-maintained. For questions, open an issue or email `hello@butwalhacks.com`.
