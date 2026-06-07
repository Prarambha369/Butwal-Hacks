# Butwal Hacks — AI Agent Guidelines

**Next.js 16.1.6 App Router monorepo** (`my-app/package.json` line 52). Root delegates to `my-app/`. All content lives in code.

## Critical Workflows
```bash
# From repo root
npm install && npm run dev                        # → http://localhost:3000

# From my-app/ (required before PR)
npm run lint && npm run build
```

## Architecture Essentials
- **Server Components by default** — add `"use client"` only for hooks (`useState`, `useEffect`) or browser APIs (`IntersectionObserver`, etc.).
- **Content-driven** — all site content (initiatives, events, blog, members) lives in `my-app/lib/content.ts` and `my-app/lib/members.ts`. No CMS.
- **Static generation**: Dynamic `[slug]` pages must export `generateStaticParams()` from `lib/content` arrays and use `notFound()` on misses (see `app/blog/[slug]/page.tsx`).

## Patterns & Helpers
| Pattern | Implementation |
|---------|---|
| **SEO metadata** | `buildPageMetadata({ title, description, path })` from `@/lib/seo.ts`. Use in every route's `generateMetadata()`. |
| **Conditional CSS** | `cn()` from `@/lib/utils.ts` (clsx + tailwind-merge). Example: `cn("base", condition && "modifier")` |
| **Scroll reveals** | `useInViewOnce<HTMLElement>(threshold?)` hook + `.section-fade` CSS class. Fires once, no dependencies. |
| **Heavy animations** | Dynamic `import("animejs")` in `useEffect()` to avoid SSR hydration errors. Check `prefers-reduced-motion` first. See `components/home/desktop-landing.tsx`. |
| **Theme toggle** | `next-themes` via `<ThemeProvider>` in `app/layout.tsx`. Client uses class-based toggle on `<html>`. |

## Integration Points
- **Analytics**: Vercel `<Analytics />` + GA4 `next/script` (ID: `G-NKE935H259`) in `app/layout.tsx`.
- **Security**: Headers defined in `my-app/next.config.ts` (lines 14–53). CSP allows GA4 + Vercel analytics; HSTS preload enabled; X-Frame-Options: DENY. Review before loosening.
- **Deployment**: Vercel auto-deploys `main`. Config in `vercel.json`.

## Avoid
- No CMS; no external content APIs — edit `lib/content.ts` directly.
- No `dangerouslySetInnerHTML` except JSON-LD in `app/page.tsx`.
- No animations on mount without `prefers-reduced-motion` guard.


