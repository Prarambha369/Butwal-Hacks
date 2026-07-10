# Pre-Deployment Audit Checklist

## Build & Compilation
- [ ] `npm run build` passes with 0 errors
- [ ] `npm run lint` passes with 0 warnings (errors only)
- [ ] `npm run test` (vitest) passes
- [ ] `npx playwright test` (E2E) passes

## Environment Variables
- [ ] Auth0 credentials set in Vercel environment:
  - `AUTH0_SECRET` (64-char hex string)
  - `AUTH0_DOMAIN` = `butwal.jp.auth0.com`
  - `AUTH0_CLIENT_ID`
  - `AUTH0_CLIENT_SECRET`
  - `APP_BASE_URL` = `https://butwalhacks.com`
- [ ] Supabase env vars set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Other service keys configured:
  - Cloudinary, Resend, Upstash, PostHog, Axiom, Groq

## Auth0 Dashboard Configuration
- [ ] **Auth0 Action (Post-Login)**: Create a Post-Login Action that fires `POST` to
      `https://butwalhacks.com/api/webhooks/auth0` with `{ sub, email, name }` payload.
      Without this, new users won't get a Supabase profile and login will redirect in a loop.
- [ ] Allowed Callback URLs: `https://butwalhacks.com/api/auth/callback`
- [ ] Allowed Logout URLs: `https://butwalhacks.com`
- [ ] Allowed Web Origins: `https://butwalhacks.com`
- [ ] Application Type: Regular Web Application
- [ ] Token Endpoint Auth Method: `client_secret_post`

## Supabase
- [ ] All migrations applied (001–075)
- [ ] RLS disabled on all tables (migration 073 applied)
- [ ] Service Role Key has full access to all tables

## SEO & Structured Data
- [ ] `sitemap.xml` accessible at `/sitemap.xml`
- [ ] `robots.txt` accessible at `/robots.txt`
- [ ] JSON-LD Organization schema present in `<head>`
- [ ] All pages have `generateMetadata()` with canonical URL
- [ ] hreflang tags for `ne` and `en`
- [ ] OG images configured for all key routes
- [ ] All 4xx pages return proper HTTP status codes

## Performance (Core Web Vitals)
- [ ] Hero image uses `priority` prop on `next/image`
- [ ] Below-fold images use `loading="lazy"`
- [ ] Fonts preloaded with `font-display: swap`
- [ ] No layout-shifting elements on homepage
- [ ] Minimal client-side JS on landing page
- [ ] Animations respect `prefers-reduced-motion`

## Security
- [ ] CSP headers set (Clerk domains removed, Auth0 domains added)
- [ ] HSTS preload enabled (`max-age=63072000; includeSubDomains; preload`)
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] Auth0 webhook has shared secret check (if applicable)

## Monitoring
- [ ] Vercel Analytics enabled
- [ ] Axiom log drain configured (via `withAxiom()` in next.config)
- [ ] PostHog analytics configured for funnels and user behavior
- [ ] Rate limiting active on API routes (via Upstash)

## PWA
- [ ] Service worker registers and caches shell
- [ ] `/offline` page renders when offline
- [ ] Manifest is valid (application name, icons, theme color `#FE0000`)
- [ ] Install prompt appears on supported browsers

## Post-Deploy Verification
- [ ] `/` — Homepage renders with hero, stats, and CTA
- [ ] `/sign-in` — Redirects to Auth0 Universal Login
- [ ] `/events` — Events page loads with upcoming events
- [ ] `/blog` — Blog page loads with posts
- [ ] `/dashboard` — Redirects to Auth0 login when unauthenticated
- [ ] `/profile/[bh_id]` — Public profile renders
- [ ] `/_not-found` (invalid route) — Returns 404 page
- [ ] Lighthouse audit scores ≥ 90 on mobile
- [ ] E2E tests pass against deployed URL
