# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All dev commands run from `my-app/`:

```bash
cd my-app
npm install
npm run dev       # http://localhost:3000
npm run lint      # ESLint check
npm run build     # Production build — must pass before any PR
npm run start     # Serve production build locally
```

Run `npm run lint && npm run build` before every PR. Neither may fail.

## Architecture

### Project layout

The Next.js app lives in `my-app/` — the repo root holds only deployment config (`vercel.json`), logos, and docs. Vercel builds from `my-app/.next`.

### Content layer (no CMS)

All site content is static TypeScript — never reach for an external API:

| File | What it holds |
|------|--------------|
| `lib/content.ts` | `initiatives`, `events`, `blogPosts` arrays + lookup helpers |
| `lib/members.ts` | Community member directory |
| `lib/hacker-id.ts` | `hackerProfiles` record + `HackerProfile` types (certificates, projects, event history) |

To add or edit an initiative, event, or blog post, edit the arrays in `lib/content.ts` directly.

### Routing conventions

- **RSC by default** — add `"use client"` only when using hooks or browser APIs.
- **Dynamic slug pages** (`app/initiatives/[slug]`, `app/events/[slug]`, `app/blog/[slug]`, `app/programs/[slug]`, `app/p/[uniqueId]`) must export `generateStaticParams()` driven by the relevant `lib/` array, and call `notFound()` on a slug miss.
- **Hacker ID profiles** are served at `/p/[uniqueId]` (e.g. `/p/BH-2024-001`) from `lib/hacker-id.ts`.
- **API routes**: `app/api/contact/route.ts` and `app/api/sponsor/route.ts`.

### SEO — required on every route

```ts
import { buildPageMetadata } from "@/lib/seo"
export const generateMetadata = () =>
  buildPageMetadata({ title, description, path: "/your-path" })
```

`buildPageMetadata` sets canonical URL, Open Graph, Twitter Card, and robots directives in one call. No page ships without it.

### Navigation config

`lib/nav-config.ts` exports `navConfig`, `secondaryNavItems`, and `legalNavItems`. Both `TopNav` and `BottomNav` consume these arrays — add or rename nav entries here, not inside the component files.

### Shared utilities and hooks

| Symbol | Location | Purpose |
|--------|----------|---------|
| `cn()` | `lib/utils.ts` | `clsx` + `tailwind-merge` for conditional classes |
| `useInViewOnce<T>(threshold?)` | `hooks/useInViewOnce.ts` | One-shot IntersectionObserver; pair with `.section-fade` CSS class |
| `useSmoothScroll` | `hooks/useSmoothScroll.ts` | Lenis smooth scroll wrapper |

### Animation rules

- Heavy animations: `dynamic import("animejs")` inside `useEffect` only.
- Always guard with `prefers-reduced-motion` before running any animation.

### App shell

`app/layout.tsx` composes: `MaintenanceBanner → TopNav → {children} → Footer → BottomNav`. The `BottomNav` is mobile-only; `main` has `pb-24 md:pb-0` to avoid content being hidden behind it.

### Theming and styling

- Tailwind v4 setup (PostCSS-based, no `tailwind.config.js`).
- `next-themes` via `<ThemeProvider>` in `app/layout.tsx`; tokens defined in `app/globals.css`.
- Design accent colors: `--color-accent-yellow: #F5A623`, `--color-accent-teal: #00B4A6`, `--color-accent-orange: #E8622A`.

### Security headers

Defined in `next.config.ts` (lines 14–53). CSP allows GA4 and Vercel Analytics. Review the full directive list before loosening any rule — HSTS preload is on and `X-Frame-Options` is `DENY`.

### Analytics

Vercel `<Analytics />` + GA4 `next/script` (`G-NKE935H259`) in `app/layout.tsx`. Both are deferred.

### Deployment

Vercel auto-deploys `main`. Config in `vercel.json`. Pre-merge: validate JSON-LD at [validator.schema.org](https://validator.schema.org) and check Core Web Vitals on [PageSpeed Insights](https://pagespeed.web.dev).

## Key constraints

- No `dangerouslySetInnerHTML` except for JSON-LD injection in `app/page.tsx`.
- No page without `generateMetadata()`.
- No image without `alt` text; hero images use `next/image` with `priority`; below-fold images use `loading="lazy"`.
- One `<h1>` per page; never skip heading levels.
- `dangerouslySetInnerHTML` for JSON-LD belongs only in `app/page.tsx`, not in component files.
