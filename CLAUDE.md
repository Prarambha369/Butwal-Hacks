# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
cd my-app
npm install
npm run dev       # http://localhost:3000
npm run lint      # ESLint check
npm run build     # Production build — must pass before any PR
npm run start     # Serve production build locally
```

Run `npm run lint && npm run build` before every PR. Neither may fail.

## Governing Document

**Read `AGENTS.md` first** — it is the authoritative governing spec for this project.
It contains:
- The **Agentic Loop Protocol** (CHECK → VERIFY → TEST → BUILD → CLEANUP)
- The **Official Brand Color Palette** with exact hex codes
- The **Liquid Glass CSS** design system
- The **Continuouse Cleanup Protocol** (Ponytail Audit)
- The **Execution Roadmap** (Days 1-500)

When instructions here conflict with `AGENTS.md`, `AGENTS.md` wins.

## Project Layout

The Next.js app lives in `my-app/`. The repo root holds deployment config, logos, and docs.

## Key Architecture

| Area | Detail |
|------|--------|
| **Auth** | Auth0 authentication with Supabase backend |
| **Styling** | Tailwind v4 with Liquid Glass aesthetic (`lg-surface` classes) |
| **Database** | Supabase via `@supabase/supabase-js` |
| **API Routes** | Serverless functions in `my-app/src/app/api/` |
| **Server Actions** | `"use server"` functions in `my-app/src/lib/actions/` |

## Security Headers

Defined in `my-app/next.config.ts` (lines 14-53). CSP allows GA4, Vercel Analytics, and Axiom. HSTS preload on. `X-Frame-Options: DENY`.

## Deployment

Vercel auto-deploys `main`. Config in `vercel.json`.
