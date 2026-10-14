# Butwal Hacks — Product Overview

> Mission, users, route architecture, and roadmap for the Butwal Hacks platform. Maintained by the core team. Visual rules are in [DESIGN.md](DESIGN.md); engineering detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Contents

- [What this is](#what-this-is)
- [Who it's for](#who-its-for)
- [Quick actions](#quick-actions)
- [Reference](#reference)
  - [Product identity](#product-identity)
  - [Stack](#stack)
  - [Hosts and subdomain routing](#hosts-and-subdomain-routing)
  - [Nine route zones](#nine-route-zones)
  - [Roles and access](#roles-and-access)
  - [Delivery status](#delivery-status)
  - [Key technical decisions](#key-technical-decisions)
- [Troubleshooting](#troubleshooting)
- [See also](#see-also)

## What this is

A youth technology initiative in Butwal, Nepal: ORCID-style credential verification plus hackathon management, on a flat, crisp, structured SaaS foundation with a selective red glow.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| Product and design | Understanding who the platform serves and what is still open |
| Contributors | Finding the zone a feature belongs to |
| Reviewers | Judging whether a change advances a roadmap item |

## Quick actions

**Find the zone before you write the route.** Every route must fit one of the nine zones below; if it does not, the feature is mis-scoped.

**Check the roadmap before estimating.** Items under "Genuinely open" in [Delivery status](#delivery-status) are the only outstanding work. Anything previously listed there and not listed now shipped.

## Reference

### Product identity

**Mission:** Power Nepal's next generation of builders through hands-on hackathons, verified credentials, and a thriving community.

**Creative north star:** "The Builder's Workbench." A flat, crisp, structured SaaS platform where credentials are earned, verified, and proudly displayed. Precision and trust are communicated through deliberate restraint: clean surfaces, clear hierarchy, and a single red accent that means something.

**Target users:**

| User | Who they are |
|------|-------------|
| Hackers, or builders | Students and young technologists in Nepal who join events, earn credentials, and build projects |
| Organizers | Volunteers who run events, issue trust markers, and manage programs |
| Maintainers | Core team members with audited administrative access |
| Sponsors and recruiters | Organizations that search for talent and fund bounties |

**Non-goals:**

- Not a general-purpose social network
- Not a code hosting platform; GitHub serves that
- Not an LMS; learning here is project-based, not course-based

### Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16, App Router | Turbopack |
| Authentication | Auth0 | v4 SDK, mounted at `/auth/*` via `proxy.ts` |
| Database | Supabase PostgreSQL | Service Role Key only, bypassing RLS. Supabase Auth is not used |
| Media CDN | Cloudinary | Image uploads with metadata tags |
| Rate limiting | Upstash Redis | Serverless Redis over REST |
| Email | Resend | Transactional mail |
| Analytics | Vercel Analytics and PostHog | Traffic plus behavioral funnels |
| Error monitoring | Sentry | Production error tracking |
| Hosting | Vercel | Subdomain routing via `proxy.ts` |
| Funding | Open Collective | Transparent community funding; Stripe is not used |
| CSS | Tailwind CSS v4 | `@theme` directives plus a custom `@layer utilities` |

### Hosts and subdomain routing

| Host | Purpose | Zones |
|------|---------|-------|
| `butwalhacks.com` | Public marketing | 1 |
| `app.butwalhacks.com` | Application | 2 through 9 |
| `*.butwalhacks.com` | Chapter subdomains | Rewritten for white-label org routing |

Subdomain enforcement lives in `my-app/src/proxy.ts`. In local development on `localhost`, all zones are reachable from one origin.

### Nine route zones

#### Zone 1: public marketing

Landing, blog, chapters, about, community, contact, cookie policy, events, explore, gallery, initiatives, programs, resources, support, transparency, legal pages, the PWA offline page, and the public project showcase.

#### Zone 2: authentication

`/auth/login`, `/auth/logout`, `/auth/callback`. Handled by `@auth0/nextjs-auth0` through `proxy.ts`.

#### Zone 3: public credentials

`/p/[slug_id]` for a public hacker ID, `/verify/[markerId]` for trust marker verification, `/widget/[slugId]` for the embeddable badge.

#### Zone 4: hacker dashboard

`/dashboard/hacker` with the XP bar, upcoming events, and activity feed. Plus `/work` for the Kanban board, `/api-keys`, `/projects`, and `/team-matching`.

#### Zone 5: organizer dashboard

`/dashboard/organizer` overview, `/events/[event_id]` detail with check-in, `/api-keys`, and `/issue-marker`.

#### Zone 6: maintainer dashboard

`/dashboard/maintainer` with system stats and an audit log preview, `/dedicate-school`, and `/audit-log`.

#### Zone 7: organizations and portal

`/orgs/[slug]/dashboard` and `/orgs/[slug]/events/new`. Under `/portal`: `/sponsors`, `/bounties`, `/recruiters`, and `/payouts`.

#### Zone 8: teams and social

`/teams/create` and `/teams/[id]`.

#### Zone 9: API

58 route files holding 65 handlers. The high-traffic and security-relevant ones, all verified present under `my-app/src/app/api/`:

| Route | Purpose |
|-------|---------|
| `/api/keep-alive` | Public ping driven by the keep-alive workflow |
| `/api/health` | Health check |
| `/api/metrics` | Public platform metrics, rate limited |
| `/api/contact` | Contact form |
| `/api/events/register` | Event registration |
| `/api/events/[eventId]/registrations` | Roster; organizer or maintainer only, carries PII, served `Cache-Control: private` |
| `/api/v1/profile/[slugId]` | Profile data |
| `/api/v1/api-keys`, `/api/v1/issue-marker` | API keys and trust marker issuance |
| `/api/verify/[bhId]`, `/api/badges/*` | Credential verification and badge issuance |
| `/api/webhooks/auth0` | User sync webhook |
| `/api/webhooks/opencollective` | Signature-verified `expense.*` webhook |
| `/api/github/sync`, `/api/github/deep-sync` | Project sync |
| `/api/certificates/extract` | Certificate OCR |
| `/api/cloudinary-signature` | Pre-signed upload |
| `/api/ai/chat` | BH Bot |
| `/api/report-error` | Client error reporting |

### Roles and access

| Role | Access |
|------|--------|
| `hacker` | Own profile, events, teams, projects, trust markers |
| `organizer` | Own events from creation through seven days after they end. An organizer with no events may create the first one |
| `maintainer` | Maintainer role plus a verified `@butwalhacks.com` Auth0 email. Fails closed if either is missing |
| `sponsor` | Event-scoped access, granted after organizer verification |
| `lead` | Valid role; falls through to the hacker dashboard |

Roles are stored in the Supabase `profiles.role` column and enforced through the predicates in `my-app/src/lib/dashboard-access.ts`, which the proxy and API routes both call.

### Delivery status

Audited against the tree. Four items previously listed as backlog had already shipped, so the list was corrected rather than trusted.

**Shipped:**

- The AI layer: team matching, certificate OCR, and BH Bot are built and routed.
- GitHub deep sync through an authenticated `POST /api/github/sync`.
- The PWA shell, dashboard bottom tabs, safe-area helpers, and an installable manifest.
- The recruiter portal at `/portal/recruiters`.

**Genuinely open:**

| Item | What is missing |
|------|-----------------|
| Subdomain routing enforcement in production | `proxy.ts` resolves the host, but `vercel.json` declares no domains, so the marketing and app split is not enforced at the edge |
| Open Collective payout integration | The verified webhook writes to `sponsor_opportunities` while `/portal/payouts` reads `sponsor_payouts`, and nothing inserts into that table. The reader and the writer are wired to different tables |
| Discord Bot | `src/lib/discord.ts` exists and a webhook proxy references it, but there is no bot process, gateway connection, or notification consumer. Treat it as a library, not a shipped bot |
| Multi-chapter localization | `src/lib/i18n.ts` carries roughly 450 Nepali strings consumed by 23 components, but chapter-scoped content is not translated |

**Known defects from that audit:**

- `public/manifest.webmanifest` was referenced by the root layout and did not exist, so the PWA could not be installed. It has been added, with `manifest.test.ts` asserting it stays present, that its icons exist, and that its theme colour matches the viewport.
- Deploys fail at the database migration step because `SUPABASE_DB_URL` is a transaction-pooler URL, which cannot run DDL. Migration 126 has never reached production. It needs a direct or session-pooler connection string.

### Key technical decisions

| Decision | Rationale |
|----------|-----------|
| Auth0 over Supabase Auth | Multi-provider OAuth, MFA, organizations for multi-chapter, and Post-Login Actions for webhook sync |
| Service Role Key only | Authorization lives in application code rather than database policies. Every service-role call must sit behind an explicit auth check |
| `proxy.ts` over `middleware.ts` | Auth0 v4 requires a specific middleware setup. A single proxy handles auth and subdomain routing together |
| `bh-*` utility classes | A consistent design system without repeating Tailwind classes, defined in `globals.css` |
| Flat design with selective glow | The flat foundation avoids AI-startup clichés. Red glow is spent only on CTAs and verified markers |
| SQL migrations under `supabase/migrations/` | Version controlled, repeatable, reviewable in a PR |
| Open Collective over Stripe | Transparent community funding with no payment processing on the platform |
| PostHog for analytics | Vercel Analytics for traffic, PostHog for behavioral funnel tracking |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| A new route has no clear home | It does not fit one of the nine zones | Re-scope it, or add it to an existing zone |
| `/portal/payouts` always renders empty | The Open Collective webhook writes to a different table than the page reads | See the open roadmap item above |
| Subdomain behaves like the app in production | `vercel.json` declares no domains, so the edge does not enforce the split | Add the domains in the Vercel project |
| A maintainer sees a redirect loop | Auth0 email is not `@butwalhacks.com` | Maintainer access fails closed on both role and verified email |

## See also

- [DESIGN.md](DESIGN.md) — the visual system
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — ADRs and engineering reference
- [AGENTS.md](AGENTS.md) — conventions and verification gates
- [README.md](README.md) — project overview