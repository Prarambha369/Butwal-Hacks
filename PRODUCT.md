# Butwal Hacks — Product Overview

> **A nonprofit youth technology initiative in Butwal, Nepal.**
> ORCID-style credential verification + hackathon management platform.
> Flat Kloner.app foundation with selective red glow accents.

---

## 1. Product Identity

**Mission:** Power Nepal's next generation of builders through hands-on hackathons, verified credentials, and a thriving community.

**Creative North Star:** "The Builder's Workbench" — a flat, crisp, structured SaaS platform where credentials are earned, verified, and proudly displayed. The design communicates precision and trust through deliberate restraint: clean surfaces, clear hierarchy, and a single red accent that means something.

**Target Users:**
- 🟢 **Hackers** (Builders) — Students and young technologists in Nepal who participate in events, earn credentials, and build projects
- 🟡 **Organizers** — Volunteers who run events, issue trust markers, and manage programs
- 🔴 **Maintainers** — Core team members with god-mode access to audit and administration
- 🤝 **Sponsors/Recruiters** — Organizations who search for talent and fund bounties

**Non-goals:**
- NOT a general-purpose social network
- NOT a code hosting platform (use GitHub)
- NOT an LMS (learning is project-based, not course-based)

---

## 2. Design Direction: Hybrid Kloner.app

### Foundation — Kloner.app (Flat SaaS)
- **Backgrounds:** Pure White (`#FFFFFF`) or light gray (`#F7F7F8`). Dark mode: `#121212` / `#1E1E1E`.
- **Text:** Deep Charcoal (`#1F1F1F`). Dark mode: `#F5F5F5`.
- **Borders:** Crisp 1px (`#E5E5E5` light, `#333333` dark).
- **Cards:** Solid white surface, 1px border, 12px radius. No shadow at rest.
- **Buttons:** Pill-shaped (`rounded-full`) for primary CTAs, outline for secondary.
- **NO backdrop-blur, NO glass effects, NO parallax, NO gradient text.**

### Accent — Selective Red Glow
- Butwal Red (`#FE0000`) is the single accent — used on ≤10% of any screen
- Red glow (`--bh-glow-red: 0 0 20px rgba(254,0,0,0.25)`) appears only on:
  - Primary CTA buttons on hover
  - Verified trust markers (at rest and brighter on hover)
- Self-reported trust markers use standard borders with no glow

### Typography
| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | DM Sans (via `next/font`) | 800 | Hero headlines |
| Body | DM Sans (via `next/font`) | 400 | Paragraphs, descriptions |
| Label/Mono | JetBrains Mono (via `next/font`) | 700, 10px, 0.12em tracking, uppercase | IDs, badges, metadata |

### Design Token Reference
All tokens live in `src/app/globals.css` as `--bh-*` CSS custom properties. Theme `@tailwindcss` directives map them to utility classes (`bg-surface`, `text-primary`, `border-border`, etc.). Utility classes (`bh-card`, `bh-btn-pill`, `bh-input`, `bh-trust-marker-*`) are defined in `@layer utilities`.

See `DESIGN.md` for the complete design system reference.

---

## 3. Architecture Overview

### Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16 (App Router) | NO Turbopack |
| **Authentication** | Auth0 | v4 SDK via `@auth0/nextjs-auth0`, mounted at `/auth/*` via `proxy.ts` |
| **Database** | Supabase (PostgreSQL) | Service Role Key ONLY (bypasses RLS). NO Supabase Auth. |
| **Media CDN** | Cloudinary | Image uploads with metadata tags |
| **Rate Limiting** | Upstash Redis | Serverless Redis via REST API |
| **Email** | Resend | Transactional emails (contact form, notifications) |
| **Analytics** | Vercel Analytics + PostHog | Traffic + funnel tracking |
| **Error Monitoring** | Sentry | Production error tracking |
| **Hosting** | Vercel | Subdomain routing via `proxy.ts` |
| **Funding** | Open Collective | Transparent community funding (NO Stripe) |
| **CSS** | Tailwind CSS v4 | `@theme` directives + custom `@layer utilities` |

### Hosts & Subdomain Routing
| Host | Purpose | Routes |
|------|---------|--------|
| `butwalhacks.com` | Zone 1 — Public Marketing | Landing, blog, chapters, about, etc. |
| `app.butwalhacks.com` | Zones 2-9 — App | Dashboards, profiles, APIs, portal, orgs |
| `*.butwalhacks.com` | Chapter subdomains | White-label org routing via `proxy.ts` rewrite |

Subdomain enforcement lives in `src/proxy.ts`. In local development (`localhost`), all routes are accessible from one origin.

---

## 4. 9-Zone Route Architecture

All routes must fit into one of nine zones:

### Zone 1: Public Marketing (`butwalhacks.com`)
- `/` — Landing page (Hero, TrustedBy, ImpactMetrics, Features, FAQ, CTA, Footer)
- `/about`, `/blog`, `/blog/[slug]` — Content
- `/chapters`, `/chapters/[slug]` — School-based chapter listings
- `/community`, `/contact`, `/cookie-policy` — Community pages
- `/events`, `/events/[slug]` — Event listings and detail pages
- `/explore` — Member/explorer search
- `/gallery` — Photo gallery
- `/initiatives`, `/programs/[slug]` — Programs and initiatives
- `/resources`, `/support`, `/transparency` — Resource pages
- `/legal/privacy`, `/legal/terms` — Legal pages
- `/p/[slug_id]` — Public Hacker ID profiles (ORCID-style)
- `/verify/[markerId]` — Trust Marker verification
- `/widget/[slugId]` — Embeddable badge widget
- `/projects`, `/projects/[id]` — Public project showcase
- `/offline` — Offline page (PWA)

### Zone 2: Auth (`/auth/*` on either host)
- `/auth/login` — Auth0 login
- `/auth/logout` — Auth0 logout (POST)
- `/auth/callback` — Auth0 callback handler
- Handled by `@auth0/nextjs-auth0` via `proxy.ts`

### Zone 3: ORCID / Profiles (Public, marketing host)
- `/p/[slug_id]` — Public Hacker ID profile
- `/verify/[markerId]` — Trust Marker verification page
- `/widget/[slugId]` — Embeddable credential widget

### Zone 4: Hacker Dashboard (`app.butwalhacks.com/dashboard/hacker/*`)
- `/dashboard/hacker` — XP bar, upcoming events, activity feed
- `/dashboard/hacker/work` — Kanban board (Notion-style work distribution)
- `/dashboard/hacker/api-keys` — Developer API key management
- `/dashboard/hacker/projects` — Project submissions

### Zone 5: Organizer Dashboard (`app.butwalhacks.com/dashboard/organizer/*`)
- `/dashboard/organizer` — Event management overview
- `/dashboard/organizer/events/[event_id]` — Event detail + check-in
- `/dashboard/organizer/api-keys` — API key management
- `/dashboard/organizer/issue-marker` — Issue trust markers

### Zone 6: Maintainer Dashboard (`app.butwalhacks.com/dashboard/maintainer/*`)
- `/dashboard/maintainer` — System stats, audit log preview
- `/dashboard/maintainer/dedicate-school` — School dedication management
- `/dashboard/maintainer/audit-log` — Full audit log

### Zone 7: Orgs / Portal (`app.butwalhacks.com/orgs/*`, `/portal/*`)
- `/orgs/[slug]/events/new` — Org event creation
- `/orgs/[slug]/dashboard` — Org dashboard
- `/portal/sponsors` — Sponsor dashboard
- `/portal/bounties` — Bounty board
- `/portal/recruiters` — Recruiter talent search
- `/portal/payouts` — Payout management

### Zone 8: Teams & Social (`app.butwalhacks.com/teams/*`)
- `/teams/create` — Team creation
- `/teams/[id]` — Team detail

### Zone 9: API (`app.butwalhacks.com/api/*`)
- `/api/heartbeat` — Presence heartbeat (POST)
- `/api/metrics` — Public platform metrics (GET, rate-limited)
- `/api/contact` — Contact form (POST, rate-limited)
- `/api/profile/[slugId]` — Profile data (V1 API)
- `/api/events/register` — Event registration
- `/api/teams` — Team CRUD
- `/api/projects` — Project CRUD
- `/api/bounties` — Bounty management
- `/api/tasks` — Task CRUD (work distribution)
- `/api/webhooks/auth0` — Auth0 user sync webhook
- `/api/webhooks/proxy` — Generic webhook proxy
- `/api/github/sync` — GitHub project sync
- `/api/admin/oc-sync` — Open Collective sync (admin)
- `/api/v1/api-keys` — API key management
- `/api/v1/issue-marker` — Trust marker issuance
- `/api/cloudinary-signature` — Cloudinary upload signature
- `/api/ai/chat` — AI chat (BH Bot)
- `/api/cron/daily-stats` — Daily stats aggregation
- `/api/cron/cleanup-expired` — Expired claim cleanup
- `/api/csp-violation` — CSP violation reporting
- `/api/report-error` — Client error reporting

---

## 5. RBAC (Role-Based Access Control)

| Role | Badge | Permissions |
|------|-------|-------------|
| 🟢 **Hacker** | Green | View own profile, join events, form teams, submit projects, earn trust markers |
| 🟡 **Organizer** | Yellow | Create events, issue trust markers, manage check-ins, view event analytics |
| 🔴 **Maintainer** | Red | All permissions + revoke markers, view audit log, manage users, dedicate schools |
| 🤝 **Sponsor** | Blue | View talent search, post bounties, manage sponsorships |

Roles are stored in Supabase `profiles.role` column. Enforcement via middleware and server-side checks.

---

## 6. Current Implementation Status

### Phase 1: Foundation, Design Pivot & MVP (Days 1-100)

| Day Range | Milestone | Status |
|-----------|-----------|--------|
| 1-10 | Design System Pivot (Kloner.app) | ✅ Complete |
| 11-20 | Core Auth & Database (Auth0 + Supabase) | ✅ Complete |
| 21-30 | Marketing Site (Landing, Blog) | ✅ Complete |
| 31-40 | Subdomain Architecture & ORCID Engine | 🟡 In Progress |
| 41-50 | Hackathon Engine & Teams | 🟡 In Progress |
| 51-70 | Notion-Style Work Distribution | 📋 Planned |
| 71-80 | Maintainer God Mode & Crypto | 📋 Planned |
| 81-90 | PWA, Rate Limiting, SEO & Hard 404s | 📋 Planned |
| 91-100 | Launch & Analytics | 📋 Planned |

### Recently Completed
- ✅ Design system pivot: Kloner.app flat foundation + selective red glow
- ✅ Landing page: Hero, TrustedBy, ImpactMetrics, StaggeredFeatures, FAQ, CTA, Footer
- ✅ Auth0 integration with webhook sync to Supabase profiles
- ✅ Ghost Profile flow (issue marker → email → claim)
- ✅ Public Hacker ID profiles (`/p/[slug_id]`)
- ✅ Trust Markers visual hierarchy (verified/self-reported/revoked)
- ✅ Blog engine (`/blog`, `/blog/[slug]`)
- ✅ Dark mode with system preference detection
- ✅ Accessibility fixes (contrast, heading order, skip link)
- ✅ LCP performance optimization (Hero simplification, font preloading)
- ✅ TypeScript strict mode with 0 `any` types
- ✅ Ponytail audit applied (5 deps dropped, 3 orphaned pages deleted, 1 file shrunk)
- ✅ 850+ Tailwind utility classes consolidated from CSS variables
- ✅ SERVICE_ROLE pattern established for all Supabase queries

### Pending (Next Priority)
- [ ] Subdomain routing configuration (Vercel production)
- [ ] Hackathon event creation flow
- [ ] Team formation and project submission
- [ ] Notion-style work distribution (Kanban + table view)
- [ ] Maintainer god mode (marker revocation, audit log)
- [ ] Ed25519 trust marker signing
- [ ] PWA install prompt refinement
- [ ] Upstash rate limiting configuration
- [ ] E2E test suite
- [ ] Production deployment

---

## 7. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **No Supabase Auth** | Auth0 for auth | Multi-provider OAuth (Google, GitHub), webhook sync, ghost profiles |
| **Service Role Key Only** | Bypasses RLS | Simplified permissions — all backend queries use service role. Public routes use service role with scoped queries. |
| **`proxy.ts` over `middleware.ts`** | Explicit middleware file | Auth0 v4 requires specific middleware setup. Single proxy handles auth + subdomain routing. |
| **No Turbopack** | Standard Next.js build | Turbopack compatibility issues with `proxy.ts` and certain dependencies |
| **`bh-*` utility classes** | Custom CSS layer | Consistent design system without repeating Tailwind classes. Defined in `globals.css` `@layer utilities`. |
| **Flat design + selective glow** | Hybrid aesthetic | Kloner.app foundation avoids AI-startup clichés. Red glow earned its place — only on CTAs and verified markers. |
| **supabase/migrations/** | SQL-based schema | Version-controlled, repeatable, reviewable in PRs |
| **PostHog for analytics** | Free tier + funnels | Vercel Analytics for traffic, PostHog for behavioral funnel tracking |

---

## 8. Filesystem Structure (Key Paths)

```
Butwal-Hacks/
├── AGENTS.md              # Day 1-500 execution roadmap (authoritative spec)
├── AGENT_HANDOFF.md       # Build loop prompt for autonomous agents
├── DESIGN.md              # Design system reference
├── PRODUCT.md             # This file — product identity & architecture
├── my-app/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── layout.tsx            # Root layout (fonts, providers, skip-link)
│   │   │   ├── globals.css           # Design tokens, utility classes, theme
│   │   │   ├── (main)/               # Zone 1 marketing routes
│   │   │   ├── (auth)/               # Zone 2 auth routes
│   │   │   ├── p/[slug_id]/          # Zone 3 ORCID profiles
│   │   │   ├── dashboard/            # Zones 4-6 dashboards
│   │   │   ├── portal/               # Zone 7 portal
│   │   │   ├── orgs/                 # Zone 7 organizations
│   │   │   ├── teams/                # Zone 8 teams
│   │   │   └── api/                  # Zone 9 API endpoints
│   │   ├── proxy.ts                  # Middleware: auth + subdomain routing
│   │   ├── instrumentation.ts        # Next.js instrumentation (no-op)
│   │   ├── components/
│   │   │   ├── sections/             # Navbar, Hero, Footer, ContactCTA
│   │   │   ├── home/                 # Landing page sections
│   │   │   ├── hacker-id/            # Profile page components
│   │   │   ├── dashboard/            # Dashboard components
│   │   │   ├── ui/                   # Button, Card, Badge, Input primitives
│   │   │   └── ...                   # Feature-specific components
│   │   ├── lib/                      # Shared utilities, server actions, types
│   │   └── utils/supabase/           # Supabase client factories
│   ├── supabase/migrations/          # SQL schema migrations (085 files)
│   └── package.json
├── docs/                             # Documentation & audit reports
└── .github/                          # CI workflows, issue templates
```
