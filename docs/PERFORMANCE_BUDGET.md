# Performance Budget — Butwal Hacks

Measurable targets for web performance, accessibility, and user experience. Enforced by CI where possible, monitored via Vercel Analytics and Lighthouse.

---

## 1. Core Web Vitals

| Metric | Target | Source |
|--------|--------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Lighthouse / Web Vitals |
| **INP** (Interaction to Next Paint) | < 200ms | Lighthouse / Web Vitals |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse / Web Vitals |
| **FCP** (First Contentful Paint) | < 1.8s | Lighthouse / Web Vitals |
| **TTFB** (Time to First Byte) | < 800ms | Lighthouse / Vercel Analytics |

---

## 2. Lighthouse Scores

| Category | Target | Enforcement |
|----------|--------|-------------|
| **Performance** | >= 90 | Manual — Lighthouse CI |
| **Accessibility** | >= 95 | Manual — Lighthouse CI |
| **Best Practices** | >= 90 | Manual — Lighthouse CI |
| **SEO** | >= 95 | Manual — Lighthouse CI |

---

## 3. Bundle Size

| Asset | Target |
|-------|--------|
| Initial JS (all routes) | < 250 KB gzip |
| Initial CSS | < 30 KB gzip |
| Fonts (self-hosted) | < 50 KB total (DM Sans + JetBrains Mono, woff2) |
| Per-page JS increment | < 50 KB gzip |

### Current State
- Fonts self-hosted via `next/font/google` with `display: swap` and `preload: true`
- `lucide-react` tree-shakes unused icons
- Sentry tree-shakes debug logging in production (`treeshake.removeDebugLogging: true`)
- `noUnusedLocals` and `noUnusedParameters` prevent dead code accumulation

---

## 4. Images

| Rule | Target | Implementation |
|------|--------|---------------|
| Format | WebP or AVIF via Cloudinary | `q_auto,f_auto,w_{width}` transform |
| Optimization | Cloudinary auto | `cloudinaryUrl()` utility in `@/lib/utils.ts` |
| Responsive | `sizes` attribute on all `<Image>` | `next/image` component |
| Lazy loading | Below-fold images | `loading="lazy"` (default for `next/image`) |
| Priority | Above-fold LCP images | `priority` prop on hero images |
| Placeholder | DiceBear for missing avatars | `getAvatarUrl()` and `getDiceBearPlaceholder()` in `@/lib/utils.ts` |

### Remote Image Sources (whitelisted in `next.config.ts`)
- `api.dicebear.com` — avatar placeholders
- `images.unsplash.com` — blog covers
- `res.cloudinary.com` — CDN images
- `api.qrserver.com` — QR codes

---

## 5. Security

| Header | Value | Location |
|--------|-------|----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | `next.config.ts` |
| `X-Content-Type-Options` | `nosniff` | `next.config.ts` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `next.config.ts` |
| `Content-Security-Policy` | Per-route: `frame-ancestors 'none'` or `frame-ancestors *` for `/widget/*` | `next.config.ts` |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=()` | `next.config.ts` |
| `X-Frame-Options` | Not used — CSP `frame-ancestors` is the modern standard | Replaced by CSP |

---

## 6. Accessibility

| Requirement | Target | Implementation |
|-------------|--------|---------------|
| Skip-to-content | Visible on keyboard focus | Anchor `#app-content` in `layout.tsx` |
| Focus indicators | `ring-2 ring-primary-red ring-offset-2` | Global `focus-visible` styles in `globals.css` |
| ARIA labels | All interactive elements | `aria-label`, `aria-hidden` attributes |
| Color contrast | >= 4.5:1 for text, >= 3:1 for large text | All colors checked in `DESIGN.md` |
| Heading order | Logical hierarchy | h1 -> h2 -> h3, no jumps |
| Touch targets | >= 44x44 px | `bh-icon-btn`, `bh-btn-*` classes enforce min sizes |

---

## 7. SEO

| Requirement | Target | Implementation |
|-------------|--------|---------------|
| Metadata | All pages | `generateMetadata()` or `export const metadata` |
| Open Graph | All pages | `openGraph` title, description, image |
| Canonical URLs | All pages | `alternates.canonical` in metadata |
| Structured data | JSON-LD on landing page | `SafeJsonLd` component in `layout.tsx` |
| Sitemap | Dynamic | `src/app/sitemap.ts` |
| Robots | Dynamic | `src/app/robots.ts` |
| hreflang | English + Nepali | `layout.tsx` alternate links |

---

## 8. Reliability

| Metric | Target | Implementation |
|--------|--------|---------------|
| Offline support | PWA service worker | `public/sw.js` (basic cache-first for assets) |
| Error recovery | Error boundary with retry | `app/error.tsx` |
| Loading states | Skeleton/spinner for all async content | `app/loading.tsx`, `Skeleton` component |
| 404 handling | Hard 404 via `notFound()` | `app/not-found.tsx` + route-level `notFound()` |
| API fallibility | Fail-open for non-critical backends | Rate limiter fails open if Redis unreachable |

---

## 9. Monitoring

| Tool | What It Monitors |
|------|------------------|
| Vercel Analytics | Traffic, page views, geolocation |
| PostHog | Funnels, user behavior, feature adoption |
| Sentry | Error tracking with source map support |
| CSP Violations | `/api/csp-violation` endpoint |
| Client Error Reporting | `/api/report-error` endpoint from `app/error.tsx` |

---

## 10. Measurement

### CI
- Lighthouse scores are NOT currently enforced in CI (manual check)
- Build output warns on large bundles via Next.js CLI
- Secret scan and dependency audit run on every PR

### Local
1. `npx lighthouse http://localhost:3000 --view` — run against any page
2. Chrome DevTools > Lighthouse panel — on production URL
3. Vercel Analytics > Web Vitals — real-user monitoring in production

### If Budget Is Exceeded
1. Check `next.config.ts` `images.remotePatterns` — only whitelist needed sources
2. Verify fonts are self-hosted via `next/font` (not external CDN)
3. Check bundle analyzer: `ANALYZE=true npm run build`
4. Profile LCP element — is it a Cloudinary image? Add `priority` and optimize `sizes`
5. Check render-blocking resources — inline critical CSS
