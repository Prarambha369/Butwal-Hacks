# Architecture

## Overview

Butwal Hacks is a Next.js 16 App Router application deployed on Vercel. It combines an ORCID-style credential verification system with a Devpost/MLH-style hackathon management platform.

```
Browser ──► Vercel (Next.js 16) ──┬── Auth0 (Authentication)
                                   ├── Supabase (PostgreSQL Database)
                                   ├── Cloudinary (Image CDN)
                                   ├── Upstash Redis (Rate Limiting)
                                   ├── Resend (Transactional Email)
                                   └── Open Collective (Payments)
```

---

## 9-Zone Route Architecture

The application uses subdomain routing: `butwalhacks.com` serves public marketing content, while `app.butwalhacks.com` serves authenticated dashboards and API routes.

| Zone | Routes | Subdomain | Auth Required |
|------|--------|-----------|---------------|
| 1. Public Marketing | `/`, `/about`, `/blog`, `/chapters`, `/community` | `butwalhacks.com` | No |
| 2. Auth | `/sign-in`, `/sign-up`, `/auth/*` | `butwalhacks.com` | No |
| 3. Public Profiles | `/p/[slug_id]`, `/verify/[markerId]` | `butwalhacks.com` | No |
| 4. Hacker Dashboard | `/dashboard/hacker/*` | `app.butwalhacks.com` | Yes |
| 5. Organizer Dashboard | `/dashboard/organizer/*` | `app.butwalhacks.com` | Yes (Organizer) |
| 6. Maintainer Dashboard | `/dashboard/maintainer/*` | `app.butwalhacks.com` | Yes (Maintainer) |
| 7. Organizations | `/orgs/[slug]/*` | `app.butwalhacks.com` | Yes |
| 8. Sponsor Portal | `/portal/sponsors/*`, `/portal/bounties/*` | `app.butwalhacks.com` | Yes (Sponsor) |
| 9. API | `/api/*` | `app.butwalhacks.com` | Varies |

---

## Data Flow

### Authentication Flow (Auth0)

```
User → Auth0 Login → Auth0 Callback → proxy.ts Middleware
                                           │
                                    Auth0 Post-Login Action
                                           │
                                    Webhook → /api/webhooks/auth0
                                           │
                                    Supabase: Upsert Profile
                                           │
                                    User redirected to Dashboard
```

### API Request Flow

```
Browser → proxy.ts (Auth0 Session Middleware)
              │
              ↓
        Next.js API Route
              │
          ├── withRateLimit()  (Upstash Redis)
          ├── getSession()     (Auth0 cookie)
          ├── Zod Validation   (Input sanitization)
          └── Supabase         (Service Role Key, bypasses RLS)
```

### ORCID Engine

```
Organizer issues marker ──► /api/v1/issue-marker
                                │
                            Ghost Profile (unclaimed)
                                │
                            Email sent via Resend
                                │
                            Recipient claims via Auth0 login
                                │
                            Profile claimed → Trust Marker active
                                │
                            Cryptographically signed (Ed25519)
                                │
                            Verifiable at /verify/[marker_id]
```

---

## Key Design Decisions

### Why Auth0 (not Supabase Auth)?
- Auth0 provides enterprise-grade SSO, MFA, and social login
- Auth0 Organizations power multi-chapter support
- Auth0 Post-Login Actions sync user data to Supabase via webhook
- Supabase Auth is disabled; only the database layer is used

### Why Service Role Key (not RLS)?
- RLS is disabled for simplicity at MVP stage
- All mutations are gated by Auth0 session validation in the API route
- The service role key is never exposed to the browser

### Design Philosophy
The interface blends solid, grounded surfaces with selective depth effects. Cards and panels use solid backgrounds and crisp 1px borders — they feel like paper. Blur and shadow are reserved for moments that need visual separation: modal overlays, floating toasts, image captions. Butwal Red (`#FE0000`) is used sparingly for CTAs and verified trust markers — when you see red, it means something.

---

## Directory Structure

```
Butwal-Hacks/
├── my-app/                     # Next.js application
│   ├── src/
│   │   ├── app/                # App Router (pages + API routes)
│   │   │   ├── (main)/         # Public pages (home, about, blog, events...)
│   │   │   ├── (auth)/         # Auth pages (sign-in, sign-up)
│   │   │   ├── dashboard/      # Hacker/Organizer/Maintainer dashboards
│   │   │   ├── p/              # Public BH-ID profiles
│   │   │   ├── verify/         # Trust marker verification
│   │   │   ├── widget/         # Embeddable verification widget
│   │   │   ├── api/            # 51 route handlers
│   │   │   ├── layout.tsx      # Root layout with metadata
│   │   │   ├── globals.css     # Design tokens & utilities
│   │   │   ├── sitemap.ts      # Dynamic sitemap
│   │   │   ├── robots.ts       # robots.txt config
│   │   │   └── manifest.ts     # PWA manifest
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Business logic, i18n, content
│   │   └── utils/              # Supabase client factories
│   └── public/                 # Static assets
├── supabase/migrations/        # 65 database migrations
├── docs/                       # Wiki-style documentation
└── .github/                    # CI workflows, issue templates
```
