# Butwal Hacks V2 — Launch Readiness Checklist

## 🎯 Launch Date: TBD

This document tracks everything required before the V2 launch. All items must be checked before deployment to production.

---

## 1. Infrastructure & Deployment

- [ ] **Production build passes** — `npm run build` exits with 0
- [ ] **Vercel deployment configured** — Domain, env vars, regions
- [ ] **Supabase project** — Production instance linked, migrations up-to-date
- [ ] **Auth0 tenant** — Production app configured with correct URLs
- [ ] **Custom domain** — `butwalhacks.com` SSL certificate active
- [ ] **Security headers** — CSP, HSTS, X-Frame-Options verified via `curl -I`
- [ ] **Environment variables** — All keys set in Vercel project settings:
  - Auth0 (`AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`)
  - Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
  - Cloudinary (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
  - Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
  - Resend (`RESEND_API_KEY`, `CONTACT_EMAIL`)
  - PostHog (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`)
  - Groq (`GROQ_API_KEY`)
  - Axiom (`AXIOM_TOKEN`, `AXIOM_DATASET`)

## 2. Auth & Onboarding

- [ ] **Auth0 Post-Login Action** deployed — syncs user to Supabase profiles
- [ ] **Sign-up flow tested** — New user creates account, redirected to dashboard
- [ ] **Sign-in flow tested** — Returning user logs in, sees their profile
- [ ] **Password reset flow** — Works end-to-end
- [ ] **Role assignment** — New users get `hacker` role by default
- [ ] **BH-ID generation** — Sequential IDs working (`BH-YY-NNN`)

## 3. Core Features

### Dashboard
- [ ] **Hacker dashboard** — Shows XP, projects, teams, events
- [ ] **Organizer dashboard** — Event management, check-ins, issue marker
- [ ] **Sponsor dashboard** — Hacker discovery, opportunity management
- [ ] **Maintainer dashboard** — User management, moderation, audit log

### Events
- [ ] **Event creation** — Organizer can create events
- [ ] **Registration flow** — Users can register for events
- [ ] **Check-in** — QR/barcode check-in at events
- [ ] **Event expo** — Projects displayed per event

### Projects
- [ ] **Project submission** — Users can submit projects
- [ ] **Project details** — View page with team, description, tech stack
- [ ] **Impact reports** — Users can submit impact reports
- [ ] **Project likes** — Like/unlike functionality

### Teams
- [ ] **Team creation** — Users can create teams
- [ ] **Team invites** — Invite members via email/BH-ID
- [ ] **Team chat** — Realtime messaging (if enabled)
- [ ] **Team discovery** — Find teams to join

### Trust Network
- [ ] **Trust markers** — Issue, claim, verify markers
- [ ] **Badge assertions** — Open Badges 3.0 JSON-LD format
- [ ] **Verify embed** — Embeddable verification widget
- [ ] **Badge check** — Public badge verification endpoint

### Gamification
- [ ] **XP system** — Points awarded for activities
- [ ] **Levels** — User levels based on XP thresholds
- [ ] **Micro-credentials** — Skill trees with unlockable credentials
- [ ] **Leaderboard** — Public XP ranking

## 4. Content & SEO

- [ ] **Home page** — Hero, stats, features, CTA
- [ ] **About page** — Mission, team, impact numbers
- [ ] **Events page** — Upcoming and past events
- [ ] **Blog** — Posts with full SEO metadata
- [ ] **Chapters page** — Local chapter discovery
- [ ] **Transparency page** — Financials, governance
- [ ] **Privacy Policy** — GDPR-compliant
- [ ] **Terms of Service** — Legal terms
- [ ] **Cookie Policy** — Cookie consent info
- [ ] **Sitemap** — Auto-generated, all public routes included
- [ ] **Robots.txt** — Correct disallow rules
- [ ] **JSON-LD** — Organization, Article, Event schemas on all pages
- [ ] **Open Graph tags** — Verified via opengraph.xyz
- [ ] **Twitter Cards** — Summary card with image

## 5. PWA & Mobile

- [ ] **Service worker** — Registered, caches static assets
- [ ] **Manifest** — App name, icons, theme color correct
- [ ] **Install prompt** — PWA install prompt on mobile
- [ ] **Offline page** — Custom offline fallback
- [ ] **Mobile bottom nav** — Tab bar for key pages
- [ ] **Swipe gestures** — Back navigation via swipe

## 6. Analytics & Monitoring

- [ ] **Vercel Analytics** — Page views, web vitals
- [ ] **PostHog** — Events, funnels, user identification
- [ ] **PostHog Logs** — OTel structured logging (instrumentation.ts)
- [ ] **Axiom** — Structured server-side logs
- [ ] **Upstash rate limiting** — Rate limiter active on API routes
- [ ] **Error tracking** — Error boundaries on pages

## 7. Security

- [ ] **CSP** — Script-src, connect-src covering all services
- [ ] **HSTS** — max-age=63072000, preload
- [ ] **X-Frame-Options: DENY** — No iframe embedding (except verify widget)
- [ ] **API key hashing** — SHA-256 hashing, no plaintext storage
- [ ] **Rate limiting** — All public POST endpoints protected
- [ ] **Input sanitization** — Contact forms, project submission, team chat
- [ ] **Secrets audit** — No hardcoded keys in source

## 8. Performance (Core Web Vitals)

- [ ] **LCP < 2.5s** — Hero image has `priority`, WebP format
- [ ] **CLS < 0.1** — No layout shifts from images/fonts
- [ ] **INP < 200ms** — Minimal client JS on landing page
- [ ] **Lighthouse score ≥ 90** — Mobile + Desktop
- [ ] **Bundle size** — Code-split heavy components (animejs, charts)

## 9. Edge Functions & Integrations

- [ ] **Supabase Edge Functions** — Deployed (hello, trust, slack-bot, discord-bot, github-webhook, resend-email)
- [ ] **Slack webhook** — Notifications configured (optional)
- [ ] **Discord webhook** — Community announcements (optional)
- [ ] **GitHub webhook** — PR/star/issue tracking (optional)
- [ ] **Auth0 webhook** — Post-Login Action calling `/api/webhooks/auth0`
- [ ] **Open Collective webhook** — Bounty payout tracking (optional)

## 10. Pre-Launch Verification

- [ ] `curl -I https://butwalhacks.com` — 200 + security headers
- [ ] `curl -I https://butwalhacks.com/not-found` — 404
- [ ] PageSpeed Insights — All pages green
- [ ] Google Rich Results Test — Structured data valid
- [ ] Schema.org Validator — JSON-LD correct
- [ ] Login flow — Auth0 hosted login works
- [ ] Registration — New user can join
- [ ] PDF report generation — Works for admin

---

## Launch Day Runbook

```bash
# 1. Final build and deploy
cd my-app
npm run build && npm run lint
git push origin main    # Vercel auto-deploys

# 2. Verify deployment
curl -I https://butwalhacks.com
curl https://butwalhacks.com/api/health

# 3. Run migrations (if any pending)
supabase db push --linked

# 4. Deploy Edge Functions
supabase functions deploy hello --project-ref <ref>
supabase functions deploy trust --project-ref <ref>
supabase functions deploy resend-email --project-ref <ref>

# 5. Monitor
#   - Vercel Dashboard: Deployment status, logs
#   - PostHog: Incoming events
#   - Axiom: Server logs
```

## Post-Launch (First 24h)

- [ ] Monitor error rates in Vercel Dashboard
- [ ] Check PostHog for user signups
- [ ] Verify email delivery via Resend dashboard
- [ ] Test sign-up flow on production
- [ ] Check mobile layout on physical devices
- [ ] Review Lighthouse scores
