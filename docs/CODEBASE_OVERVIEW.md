# Butwal Hacks — Codebase Overview (State of the Union)

> Generated: July 23, 2026
> Branch: `test/ci-pipeline-verification`
> Root: `/home/mrbashyal/air/Butwal-Hacks/my-app`

---

## 1. Executive Summary

**Butwal Hacks** is a nonprofit youth technology initiative building an **ORCID-style credential verification system** and **hackathon management platform** (Devpost/MLH clone) for Nepal's next generation of builders.

The platform allows hackers to:
- Claim a verifiable **BH-ID** (Butwal Hacks Identifier)
- Earn **Trust Markers** (cryptographically signed credentials for achievements)
- Create **projects** and **teams** during hackathons
- Showcase their work on a public **Hacker ID profile** (`/p/[slug_id]`)
- Participate in **chapters** (regional communities across Nepal)

**Current state:** Post-MVP phase. Auth migrated from Clerk to Auth0. UI uses semantic @theme CSS variables with dark/light mode support. The core credentialing engine (Trust Markers, Ghost Profiles, Ed25519 signing) is built and stable. Dashboards for all three roles (Hacker, Organizer, Maintainer) exist along with sponsor portal, mentor directory (with Cal.com integration), team formation V2 (manual force-create), QR code check-in with scanner, certificate bulk PDF export, health endpoint (DB + Redis), and AI pitch generator. Nepali i18n covers 200+ translation keys across top UI surfaces. Test suite covers 875 tests across 47 test files (19 server action test files) with full mock isolation and CI integration.

---

## 2. Tech Stack & Integrations

| Layer | Technology | Role |
|-------|-----------|------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework, server components, API routes |
| **Language** | TypeScript 5 | Type-safe codebase |
| **Styling** | Tailwind CSS 4 + `tw-animate-css` | Utility-first CSS with Liquid Glass design system |
| **Auth** | Auth0 (`@auth0/nextjs-auth0` v4) | Universal Login, session management, M2M API access |
| **Database** | Supabase (`@supabase/supabase-js`) | Postgres database via Service Role Key (RLS disabled — auth handled by Auth0) |
| **Media** | Cloudinary (`cloudinary`) | Image uploads, transformations, CDN |
| **Rate Limiting** | Upstash Redis + Ratelimit | API rate limiting (5 tiers: public_form, sensitive, user_action, frequent, bulk) |
| **Email** | Resend | Transactional email (contact form, ghost marker notifications) |
| **Analytics** | PostHog (`posthog-js`, `posthog-node`) + OpenTelemetry logs | Product analytics, session recording, structured logging |
| **Observability** | Axiom (via OTel) | Production log sink (fire-and-forget) |
| **Finance** | Open Collective API | Transparent funding, bounty payouts |
| **Background** | Vercel Cron | Scheduled tasks (daily stats, cleanup expired sessions) |
| **AI** | Groq (Llama 3) | BH Bot chatbot, AI certificate extraction, AI pitch generation |
| **PWA** | Service Worker + manifest | Offline support, install prompt |
| **i18n** | Custom (`src/lib/i18n.ts`) | English + Nepali translations |
| **Validation** | Zod | Schema validation for API routes and forms |
| **Toast/UI** | Sonner | Toast notifications |

### Dependencies (key)
```json
{
  "next": "^16.1.6",
  "react": "^19.2.0",
  "@auth0/nextjs-auth0": "^4.25.0",
  "@supabase/supabase-js": "^2.108.2",
  "@upstash/ratelimit": "^2.0.8",
  "cloudinary": "^2.10.0",
  "resend": "^6.17.1",
  "posthog-js": "^1.396.6",
  "zod": "^3.25.76",
  "lucide-react": "^0.454.0"
}
```

---

## 3. Core Features Implemented

### ✅ Authentication & Profiles
- **Auth0 Universal Login** — `/auth/login`, `/auth/callback`, `/auth/logout` via `proxy.ts` middleware
- **Auth0 Webhook** — Post-login Action syncs user to Supabase `profiles` table
- **BH-ID Generation** — Sequential IDs (`BH-YY-NNN`) with year suffix
- **Ghost Profiles** — Unclaimed profiles created via email (Trust Markers issued before user registers)
- **Three Role RBAC** — 🟢 Hacker, 🟡 Organizer, 🔴 Maintainer (role-based dashboard routing)

### ✅ Liquid Glass Design System
- **Custom CSS variables** in `globals.css` with dark/light mode support
- **`.lg-surface` class** — `bg-surface/70 backdrop-blur-[30px] saturate-[180%] border border-border/30`
- **Brand palette** — Primary `#FE0000`, Glass Surface `#434343`, Borders `#656565`
- **Utility classes** — `.btn-primary`, `.btn-secondary`, `.btn-icon`, `.input-field`, `.trust-glow`, `.lg-surface-red`
- **next-themes** integration with FOUC prevention script

### ✅ Public Pages
- **Homepage** — Hero, Mission, Value Pillars, What We Do, Bento showcase grid, Stats counter, Latest updates
- **Community** — Member directory with filtering, testimonials
- **Chapters** — Chapter discovery and info pages
- **Events** — Event listing with filter (upcoming/past), event detail with countdown + registration
- **Projects** — Project grid/detail with likes, comments, GitHub sync
- **Hacker ID** (`/p/[slug_id]`) — Public profile with identity card, trust markers, projects, event timeline, photo gallery, certificates
- **Blog** — Blog listing with categories, search, newsletter signup
- **Explore** — Hub/explore page
- **Transparency** — Financial transparency with Open Collective
- **Contact** — Contact form via Resend
- **About, Philosophy, Governance, Donors, Initiatives, Programs** — Static content pages

### ✅ Dashboard (Server-side rendered)
- **Hacker Dashboard** — Activity feed, level progression, XP tracking, profile settings, projects management, teams management, certificates, GitHub sync, skill trees with unlockable micro-credentials
- **Organizer Dashboard** — Event management (create/edit/analytics), attendee management with CSV export + QR code check-in scanner, trust marker issuance, API keys, team force-creation
- **Maintainer Dashboard** — User management, trust override/revoke, moderation panel, audit log, site config, annual report generation, school dedication
- **Sponsor Portal** — Bounty board, opportunity management, hacker talent search with marker-type filtering

### ✅ Trust Marker System
- **Issue markers** — Organizers can issue markers to hackers by email
- **Ghost marker flow** — Unclaimed → email notification → claim via sign-in
- **Cryptographic signing** — Ed25519 keypair for verifiable markers
- **Verification** — `/verify/[markerId]` route with signature verification
- **Badge assertions** — Open Badges 3.0 compatible JSON-LD format
- **Certificate scanner** — AI-powered extraction from uploaded certificate images

### ✅ API Routes (51 endpoints)
- Auth0 webhook sync, Cloudinary signed uploads, event CRUD + registration + check-in + QR scan
- Project CRUD + likes + GitHub deep sync, team management (manual force-create), profile management
- AI chat (BH Bot), AI certificate extraction, AI pitch generator
- Contact form, feedback submission, notifications, reviews, sponsor + bounty operations
- Trust marker issuance (v1 API), badge assertions, annual report generation, health check
- Mentor directory, QR code check-in scanner, certificate bulk PDF export
- Cron jobs (daily stats, cleanup), Open Collective webhook, proxy webhooks
- Bounty listing with pagination, skill trees with status, GitHub deep sync

### ✅ Infrastructure
- **PWA** — Service worker, install prompt, offline page
- **Rate limiting** — 5 tiers with Upstash Redis
- **Structured logging** — Logger + Axiom + PostHog OTel
- **Analytics** — PostHog event capture (server + client)
- **SEO** — Dynamic metadata builder, JSON-LD schema, hreflang tags
- **i18n** — English + Nepali with 200+ translation keys
- **Command palette** — Cmd+K search across hackers, projects, events
- **Feedback widget** — Anonymous feedback collection
- **BH Bot** — RAG chatbot with Groq Llama 3
- **Mentor Directory** — Profiles with "Available for Mentorship" flag + Cal.com integration for 15-min chat requests
- **Team Formation V2** — Organizer manual force-create teams and assign members
- **QR Code Check-in** — Per-hacker QR code generation + scanner for marking attendance
- **Certificate Export** — Bulk PDF export of all trust markers for an event
- **Health Endpoint** — `/api/health` checking DB and Redis connectivity
- **AI Pitch Generator** — Groq-powered Devpost-style project description generation

---

## 4. Architecture & Data Flow

### Authentication Flow
```
User → /auth/login → Auth0 Universal Login → Redirect → /auth/callback
                                                          ↓
                                              Auth0 creates session
                                                          ↓
                                              Auth0 Action fires POST /api/webhooks/auth0
                                                          ↓
                                              Supabase profiles table upsert
                                                          ↓
                                              BH-ID generated (sequential)
```

### Auth Enforcement
- **Middleware** (`proxy.ts`): Auth0 mounts auth routes at `/auth/*`, protects `/portal/*`
- **Server components**: `auth0.getSession()` → redirect to `/auth/login` if unauthenticated
- **API routes**: `withRateLimit()` wraps handlers, `createAuthenticatedClient()` for DB access
- **Client components**: `useUser()` from `@auth0/nextjs-auth0/client` for conditional rendering

### Database Pattern
```
Supabase is used as a database ONLY (no Supabase Auth).
- Service Role Key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS
- ANON key (NEXT_PUBLIC_SUPABASE_ANON_KEY) for public reads
- auth0_user_id links Auth0 identity → Supabase profile
- All authenticated DB access goes through createServiceClient()
```

### Data Flow Example (Event Registration)
```
User clicks "Register" → EventRegisterButton (client)
                         → POST /api/events/register
                           → auth0.getSession() check
                           → withRateLimit("user_action")
                           → createServiceClient() → Supabase insert
                           → captureServerEvent("event_registered")
                           → posthogLog.info()
                           → Response { success: true }
```

### Security Layers
1. **Edge Middleware** — Auth0 session check, subdomain routing
2. **Rate Limiting** — 5 tiers via Upstash (3/min for sensitive ops, 30/min for webhooks)
3. **Input Validation** — Zod schemas on all POST routes
4. **Sanitization** — XSS prevention on form inputs (sanitizeName, sanitizeEmail, sanitizeDescription)
5. **Content Security** — `rejectOversized()` for payload limits
6. **Webhook Security** — `AUTH0_WEBHOOK_SECRET` header verification (production)
7. **Cryptography** — Ed25519 signing for trust marker verification

---

## 5. Route Map

### Public Routes
| Route | Type | Description |
|-------|------|-------------|
| `/` | Page | Homepage (Hero, Impact, Bento grid, Featured projects, Updates) |
| `/community` | Page | Member directory + testimonials |
| `/chapters` | Page | Chapter discovery |
| `/events` | Page | Events listing + filter |
| `/events/[slug]` | Page | Event detail (countdown, registration, timeline, FAQ) |
| `/events/[slug]/projects` | Page | Event project expo grid |
| `/projects` | Page | Project listing grid |
| `/projects/[id]` | Page | Project detail (likes, comments, contributions) |
| `/projects/impact/[id]` | Page | Impact report |
| `/explore` | Page | Community hub |
| `/blog` | Page | Blog listing with categories + search |
| `/blog/[slug]` | Page | Blog post detail |
| `/p/[slug_id]` | Page | Public Hacker ID profile |
| `/profile/[bh_id]` | Page | Profile redirect |
| `/verify/[markerId]` | Page | Trust marker verification |
| `/verify/[bhId]/embed` | API | Embedded verification widget |
| `/widget/[slugId]` | Page | Embeddable profile widget |
| `/about` | Page | About page |
| `/contact` | Page | Contact form |
| `/transparency` | Page | Financial transparency |
| `/privacy` | Page | Privacy policy |
| `/terms` | Page | Terms of service |
| `/cookies` | Page | Cookie policy |
| `/legal` | Page | Legal page |
| `/governance` | Page | Governance |
| `/philosophy` | Page | Philosophy page |
| `/donors` | Page | Donors page |
| `/initiatives` | Page | Initiatives listing |
| `/initiatives/[slug]` | Page | Initiative detail |
| `/programs/[slug]` | Page | Program detail |
| `/opportunities` | Page | Bounties + opportunities |
| `/offline` | Page | Offline fallback |
| `/docs/*` | Static | Documentation pages |

### Auth Routes
| Route | Description |
|-------|-------------|
| `/auth/login` | Auth0 Universal Login (mounted by proxy.ts) |
| `/auth/callback` | Auth0 post-login callback |
| `/auth/logout` | Auth0 logout |
| `/sign-in` | Sign-in page |
| `/sign-up` | Sign-up page |
| `/sign-out` | Sign-out page |
| `/claim/[token]` | Ghost profile claim flow |

### Dashboard Routes (Protected)
| Route | Role | Description |
|-------|------|-------------|
| `/dashboard` | All | Dashboard overview (activity feed, XP, stats) |
| `/dashboard/hacker` | Hacker | Hacker dashboard home |
| `/dashboard/hacker/profile` | Hacker | Profile settings |
| `/dashboard/hacker/projects` | Hacker | My projects |
| `/dashboard/hacker/teams` | Hacker | My teams |
| `/dashboard/hacker/certificates` | Hacker | Certificate scanner |
| `/dashboard/organizer` | Organizer | Organizer dashboard |
| `/dashboard/organizer/events` | Organizer | Event management |
| `/dashboard/organizer/events/new` | Organizer | Create event |
| `/dashboard/organizer/events/[event_id]` | Organizer | Event detail/edit |
| `/dashboard/organizer/events/[event_id]/analytics` | Organizer | Event analytics |
| `/dashboard/organizer/events/[event_id]/attendees` | Organizer | Attendee list + CSV export |
| `/dashboard/organizer/issue-marker` | Organizer | Issue trust markers |
| `/dashboard/organizer/api-keys` | Organizer | API key management |
| `/dashboard/maintainer` | Maintainer | Maintainer dashboard |
| `/dashboard/maintainer/users` | Maintainer | User management |
| `/dashboard/maintainer/audit-log` | Maintainer | Audit log |
| `/dashboard/maintainer/trust-override` | Maintainer | Trust marker override/revoke |
| `/dashboard/maintainer/site-config` | Maintainer | Site configuration |
| `/dashboard/projects/[projectId]/edit` | Owner | Edit project |

### Portal Routes (Protected — Sponsor/Recruiter)
| Route | Description |
|-------|-------------|
| `/portal` | Sponsor portal |
| `/portal/bounties` | Bounty board |
| `/portal/bounties/new` | Create bounty |
| `/portal/bounties/[id]/edit` | Edit bounty |
| `/portal/sponsors` | Sponsor directory |
| `/portal/sponsors/company` | Sponsor company profile |
| `/portal/payouts` | Payout management |

### Org Routes (Chapter subdomains)
| Route | Description |
|-------|-------------|
| `/orgs/[slug]` | Chapter page |
| `/orgs/[slug]/dashboard` | Chapter dashboard |
| `/orgs/[slug]/events` | Chapter events |
| `/orgs/[slug]/members` | Chapter members |

### API Routes (51 total)
| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/webhooks/auth0` |
| **Events** | `GET /api/events`, `POST /api/events/register`, `POST /api/events/checkin`, `GET /api/events/[eventId]/registrations` |
| **Projects** | `GET /api/projects`, `POST /api/projects/like`, `POST /api/github/sync`, `POST /api/github/deep-sync` |
| **Profiles** | `POST /api/profile/complete`, `POST /api/profile/update` |
| **Teams** | `POST /api/teams`, `POST /api/teams/force-create` |
| **Media** | `POST /api/cloudinary-signature` |
| **AI** | `POST /api/ai/chat` (BH Bot), `POST /api/ai/pitch`, `POST /api/certificates/extract` |
| **Badges** | `GET /api/badges/check`, `GET /api/badges/assertions/[markerId]`, `GET /api/badges/issuer` |
| **Trust** | `POST /api/v1/issue-marker`, `GET /api/verify/[bhId]`, `GET /api/verify/[bhId]/embed` |
| **Admin** | `GET /api/admin/annual-report`, `POST /api/admin/oc-sync` |
| **Contact** | `POST /api/contact` |
| **Feedback** | `POST /api/reviews` |
| **Cron** | `POST /api/cron/cleanup-expired`, `POST /api/cron/daily-stats` |
| **Webhooks** | `POST /api/webhooks/opencollective`, `POST /api/webhooks/proxy` |
| **Sponsors** | `POST /api/sponsor` |
| **Resources** | `POST /api/resources/complete` |
| **Metrics** | `GET /api/organizer/metrics` |
| **Notifications** | `GET /api/notifications` |
| **System** | `GET /api/heartbeat`, `POST /api/report-error`, `GET /api/health` |
| **Bounties** | `GET /api/bounties` (paginated), `POST /api/bounties` |
| **Skill Trees** | `GET /api/skill-trees` (paginated) |
| **Mentors** | `GET /api/mentors/available`, `POST /api/mentors/request-chat` |
| **Check-in** | `GET /api/events/[eventId]/checkin/qr/[profileId]`, `POST /api/events/[eventId]/checkin/scan` |
| **Certificates** | `GET /api/certificates/event/[eventId]/export` |

---

## 6. The Vision

Butwal Hacks is building a **credential authority for youth tech talent in Nepal**.

### End Goal
A platform where any young technologist in Nepal can:
1. **Claim a verifiable identity** (BH-ID) — their permanent, portable credential
2. **Earn Trust Markers** — cryptographically signed attestations of skills, achievements, and participation
3. **Showcase work** — projects, hackathon wins, certificates in one canonical profile
4. **Get discovered** — by recruiters, sponsors, and chapter organizers
5. **Verify anywhere** — embeddable widget, Open Badges 3.0, API access

### Key Differentiators
- **Ghost Profiles** — Trust Markers can be issued before a user registers (email-based claim flow)
- **Cryptographic verification** — Ed25519 signing ensures marker authenticity
- **Chapter system** — Decentralized regional communities across Nepal
- **Zero-cost for users** — Funded via Open Collective, no Stripe/fees
- **Liquid Glass aesthetic** — Premium dark-themed UI with red accent, glass morphism

### North Star Metrics
- Community of student builders, mentors, and organizers across Lumbini Province
- Regular hackathons, game jams, and workshops
- Open-source and hackathon projects built by the community
- Participants from across Lumbini and neighboring provinces
- Chapter network in planning — no active chapters yet

---

## 7. Component Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router (routes + API)
│   ├── (auth)/             # Auth pages (sign-in, sign-up, claim)
│   ├── (main)/             # Public pages with Navbar + Footer
│   │   ├── dashboard/      # Protected dashboard (hacker/organizer/maintainer)
│   │   ├── portal/         # Sponsor/recruiter portal
│   │   ├── orgs/           # Chapter subdomain pages
│   │   └── ...             # Public pages
│   ├── api/                # 51 API route handlers
│   ├── p/[slug_id]/        # Public Hacker ID profile
│   ├── verify/             # Trust marker verification
│   └── widget/             # Embeddable widget
├── components/
│   ├── sections/           # Navbar, Footer, Hero, WhatWeDo, ValuePillars, etc.
│   ├── hacker-id/          # Identity card, certificates, projects, timeline
│   ├── dashboard/          # Activity feed, level badge, skill tree, team management
│   ├── events/             # Event detail, filter, countdown, register button
│   ├── projects/           # Project card, grid, detail, submission form
│   ├── home/               # Bento grid, featured projects, stats counter
│   ├── ui/                 # Button, card, badge, skeleton, glass-primitive
│   └── ...                 # Providers, utilities, widgets
├── lib/
│   ├── actions/            # Server actions (profile, events, projects, teams, etc.)
│   ├── analytics/          # PostHog server events
│   ├── emails/             # Email templates
│   ├── gamification/       # Level/XP calculation
│   └── ...                 # auth0, i18n, logger, rate-limiter, validation, seo
└── utils/
    └── supabase/           # Client, server, service, read-replica clients
```

---

## 7a. Reusable UI Primitives

All UI primitives live in `src/components/ui/` and are imported throughout the application. They follow the Liquid Glass design system.

### Button (`src/components/ui/button.tsx`)
A polymorphic button component using `class-variance-authority` for variant management.

| Prop | Variants |
|------|----------|
| `variant` | `default` (red glass), `ghost` (transparent), `outline` (bordered), `destructive` (dark red), `secondary` (subtle), `link` (text only) |
| `size` | `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg` |
| `asChild` | Uses a custom 3-line `Slot` pattern (replaces `@radix-ui/react-slot`) |

Default variant includes `shadow-[0_0_20px_var(--glow-bh-red)]` and hover `scale-[1.03]` animation.

### Card (`src/components/ui/card.tsx`)
Standard card with 5 subcomponents:
- `Card` — container wrapper with `rounded-xl border bg-surface`
- `CardHeader` — top section with flex column layout
- `CardTitle` — heading with `font-semibold tracking-tight`
- `CardDescription` — muted description text using `text-secondary`
- `CardContent` — main body area
- `CardFooter` — bottom action area

### Badge (`src/components/ui/badge.tsx`)
Tiny label/tag for status indication. Uses `class-variance-authority`.

| Variant | Use Case |
|---------|----------|
| `default` | Generic tag (border-glass, subtle text) |
| `verified` | Trust marker verified (red-tinted) |
| `organizer` | Organizer role badge (yellow-tinted) |
| `ghost` | Minimal, transparent |
| `secondary` | Muted background |
| `outline` | Border-only |

### GlassPrimitive (`src/components/ui/glass-primitive.tsx`)
The core Liquid Glass wrapper component. Consolidates both GlassCard and GlassBadge into one.

| Prop | Values |
|------|--------|
| `variant` | `default`, `red`, `teal`, `yellow`, `green`, `blue` (card variants) + `badge-verified`, `badge-organizer`, `badge-pending`, `badge-revoked`, `badge-live` (badge variants) |
| `padding` | `sm` (p-4), `md` (p-6), `lg` (p-8), `xl` (p-10) |
| `interactive` | When true: adds hover lift effect + red border glow |
| `pulse` | When true: adds animate-pulse |
| `dot` | `red`, `teal`, `yellow`, `green` — adds a small colored dot indicator |

Default variant applies `lg-surface` class (`bg-surface/70 backdrop-blur-[30px] saturate-[180%] border border-border/30`).

### GlassCard (`src/components/ui/glass-card.tsx`)
Thin wrapper around `GlassPrimitive` for card use. Accepts same `variant` (card variants only), `padding`, and `interactive` props.

### GlassBadge (`src/components/ui/glass-badge.tsx`)
Thin wrapper around `GlassPrimitive` for badge/tag use. Accepts:
- `tier`: `default`, `live`, `verified`, `organizer`, `pending`, `revoked`
- `dot`: `red`, `teal`, `yellow`, `green` — live dot indicator
- `pulse`: adds animation

Usage: `<GlassBadge tier="live" dot="green" pulse>Live</GlassBadge>`

### RoseLoader & RoseSpinner (`src/components/ui/rose-loader.tsx`)
Custom red-themed loading spinner with animated SVG circles.

| Component | Variants |
|-----------|----------|
| `RoseLoader` | `size`: `fullscreen` (fixed overlay), `lg`, `md`, `sm`. Accepts optional `text` prop. |
| `RoseSpinner` | `size`: `lg` (48px), `md` (28px), `sm` (16px). Inline, used inside buttons/containers. |

### Skeleton (`src/components/ui/skeleton.tsx`)
Loading placeholder with multiple presets.

| Variant | Shape |
|---------|-------|
| `default` | Generic 16px bar |
| `card` | Large card placeholder (h-48) |
| `text` | 3/4 width text line |
| `circle` | Circular avatar placeholder |
| `image` | Image placeholder (h-40) |

Also exports pre-composed skeletons: `BlogCardSkeleton`, `BlogGridSkeleton`, `PageSkeleton`.

### EmptyState (`src/components/ui/empty-state.tsx`)
`NoResultsState` component — displays a `SearchX` icon, message, and "Clear filters" button. Used by the blog search.

### Separator (`src/components/ui/separator.tsx`)
Simple horizontal rule: `<hr className="h-px w-full bg-border" />`.

### CSS Utility Classes (from `globals.css`)

| Class | Definition |
|-------|-----------|
| `.lg-surface` | `bg-surface/70 backdrop-blur-[30px] saturate-[180%] border border-border/30 rounded-[20px]` |
| `.lg-surface-red` | `bg-bh-red-600/80 backdrop-blur-[30px] border border-bh-red-500/50 shadow-[0_4px_24px_-4px_var(--bh-glow-red)]` |
| `.btn-primary` | `bg-primary-red hover:bg-deep-red text-white rounded-full font-bold` |
| `.btn-secondary` | `bg-transparent hover:bg-surface/50 border border-border/50 rounded-full` |
| `.btn-icon` | `bg-surface/70 backdrop-blur-[30px] h-10 w-10 rounded-[12px] border border-border/30` |
| `.input-field` | `bg-bg-base/50 border border-border/30 rounded-[12px] focus:border-primary-red` |
| `.trust-glow` | `border-primary-red shadow-[0_0_15px_var(--bh-glow-red)]` |
| `.custom-scrollbar` | Thin scrollbar with `var(--bh-border)` thumb color |

---

## 8. Current Technical Debt & Known Issues

| Issue | Status |
|-------|--------|
| `@aws-sdk/client-s3` dependency orphaned (R2 abandoned) | Resolved ✅ |
| R2 env vars in `.env.example` | Resolved ✅ |
| Footer.tsx legacy CSS migration (`.bg-bg`, `.text-neutral-50`, etc.) | Resolved ✅ |
| `event-feedback-form.tsx` deleted — no feedback on events page | Resolved ✅ — verified dead |
| `tooltip.tsx` and `tabs.tsx` UI primitives deleted | Resolved ✅ — verified dead |
| `common.search` and `nav.search` duplicate i18n keys | Resolved ✅ |
| `swagger-ui-react` orphaned dependency | Resolved ✅ |
| `public/swagger.json` orphaned static file | Resolved ✅ |
| Footer.tsx `Image fill` parent height | Resolved ✅ |
