# Butwal Hacks — Web App

The production website for [Butwal Hacks](https://butwalhacks.com), a youth-led nonprofit technology community in Western Nepal.

Built with **Next.js 16 App Router**, **Tailwind CSS v4**, **TypeScript**, **Auth0**, **Supabase**.

---

## Quick Start

```bash
# From repo root (not my-app/)
npm install
npm run dev
# → http://localhost:3000
```

> **Node version:** 20+ required.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/             # Public pages (home, explore, community, blog…)
│   ├── (auth)/             # Auth pages (sign-in, sign-up, sign-out)
│   ├── p/[bhId]/           # Public profile/BH-ID pages
│   ├── api/                # 36 route handlers (auth, webhooks, cron, AI…)
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Design tokens, Liquid Glass utilities
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── robots.ts           # robots.txt
│   └── manifest.ts         # PWA manifest
├── components/             # React components
│   ├── hacker-id/          # Profile identity card, live dot, etc.
│   ├── explorer/           # Member directory cards
│   ├── dashboard/          # Dashboard-specific components
│   ├── sections/           # Footer, hero sections
│   └── ui/                 # Primitive UI components
├── hooks/                  # Custom hooks
│   ├── use-presence.ts     # Supabase Realtime presence
│   └── ...
├── lib/                    # Business logic
│   ├── auth0.ts            # Auth0 client setup
│   ├── i18n.ts             # English + Nepali translations
│   ├── content.ts          # Static site content
│   ├── nav-config.ts       # Navigation structure
│   ├── seo.ts              # Metadata helpers
│   ├── utils.ts            # cn() and utility functions
│   └── actions/            # Server actions (api-keys, events, teams…)
├── utils/                  # Supabase clients
│   ├── supabase/
│   │   ├── client.ts       # Browser client (anon key)
│   │   ├── server.ts       # Server client (anon key)
│   │   ├── service.ts      # Service role client (bypasses RLS)
│   │   └── read-replica.ts # Read replica client
└── proxy.ts                # Auth0 middleware proxy
```

---

## Key Environment Variables

See `.env.example` for the full list. Required:

| Variable | Where to get it |
|---|---|
| `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET` | Auth0 Dashboard → Applications |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary Dashboard |
| `RESEND_API_KEY` | Resend Dashboard |
| `GROQ_API_KEY` | Groq Console |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog Project Settings |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke tests |

---

## Design System
See [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) for the full design language reference.

Key tokens defined in `globals.css`:

| Token | Light Value | Purpose |
|---|---|---|
| `--color-bg-base` | `#F7F7F8` | Page background |
| `--color-surface` | `#FFFFFF` | Card/modals/inputs |
| `--color-border` | `#E5E5E5` | 1px borders |
| `--color-primary` | `#1F1F1F` | Headings |
| `--bh-primary-red` | `#FE0000` | CTAs, trust markers |
| `--bh-glow-red` | `0 0 20px rgba(254,0,0,0.2)` | CTA hover glow |

---

## Deployment

Deployed to **Vercel** via GitHub integration. Pushes to `main` trigger automatic production deploy.

Environment variables must be set in Vercel Dashboard → Settings → Environment Variables.
