<p align="center">
  <img src="my-app/public/icon-512.png" alt="Butwal Hacks" width="96" height="96">
</p>

<h1 align="center">Butwal Hacks</h1>

<p align="center">
  <a href="https://github.com/Prarambha369/Butwal-Hacks/actions/workflows/ci.yml/badge.svg"><img src="https://github.com/Prarambha369/Butwal-Hacks/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Prarambha369/Butwal-Hacks/actions/workflows/deploy.yml/badge.svg"><img src="https://github.com/Prarambha369/Butwal-Hacks/actions/workflows/deploy.yml/badge.svg" alt="Deploy"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-FE0000?style=flat-square&labelColor=1a1a1a" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-5FA04E?style=flat-square&labelColor=1a1a1a" alt="Node 20 or newer">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&labelColor=1a1a1a" alt="TypeScript strict">
  <a href="https://opencollective.com/butwal-hacks"><img src="https://img.shields.io/badge/funding-Open%20Collective-7C3AED?style=flat-square&labelColor=1a1a1a" alt="Open Collective"></a>
</p>

<p align="center"><strong>Verified credentials and hackathon management for young builders in Nepal.</strong></p>

---

## Contents

- [What this is](#what-this-is)
- [Choose your path](#choose-your-path)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Verification](#verification)
- [Reference](#reference)
  - [Tech stack](#tech-stack)
  - [By the numbers](#by-the-numbers)
  - [Repository layout](#repository-layout)
- [Troubleshooting](#troubleshooting)
- [See also](#see-also)
- [Credits](#credits)
- [License](#license)

## What this is

Butwal Hacks gives young builders in Nepal an ORCID-style public identity, a place to run hackathons, and a record of work they can prove. This repository holds the Next.js application, the database schema, and the automation around both.

The live platform runs at [butwalhacks.com](https://butwalhacks.com), with the application on [app.butwalhacks.com](https://app.butwalhacks.com).

## Choose your path

This repository serves several different audiences. Jump to the one that matches you.

| If you are | Start here | Then read |
|------------|-----------|-----------|
| A **new contributor** | [Quick start](#quick-start) below | [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for the PR workflow, [AGENTS.md](AGENTS.md) for conventions |
| A **returning contributor** | [Verification](#verification) | [AGENTS.md](AGENTS.md#reference) for access control, API routes, and database rules |
| A **maintainer** | [MAINTAINERS.md](MAINTAINERS.md) | Deploy and rollback runbook, environment variables |
| Looking for **product context** | [PRODUCT.md](PRODUCT.md) | Mission, the nine route zones, roles, roadmap |
| A **designer or frontend dev** | [DESIGN.md](DESIGN.md) | The `--bh-*` tokens and `bh-*` utility classes |
| **Reporting a vulnerability** | [.github/SECURITY.md](.github/SECURITY.md) | Private disclosure, never a public issue |
| **Looking for the legal terms** | `/legal/terms` and `/legal/privacy` | Terms of service, privacy, safeguarding, event rules |
| A **sponsor or partner** | [PRODUCT.md](PRODUCT.md#product-identity) | How sponsorship and bounties work via Open Collective |

New to the codebase? Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) once. It explains the decisions that are expensive to reverse.

## Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | **20 or newer** | `my-app/package.json` enforces `>=20.0.0`; Vercel deploys on 22.x |
| Package manager | **npm only** | pnpm and yarn are not supported. The root `package.json` is an npm workspace |
| Git | any recent version | Pre-commit hooks run through `.husky/` |

You also need accounts for [Auth0](https://auth0.com), [Supabase](https://supabase.com), and [Cloudinary](https://cloudinary.com) before the app will start cleanly. Everything else degrades gracefully.

## Quick start

```bash
git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks
npm install
cp my-app/.env.example my-app/.env.local   # then fill in your keys
git config core.hooksPath .husky/          # enables pre-commit lint + secrets audit
npm run dev                                # → http://localhost:3000
```

Every script delegates from the repo root into `my-app/`, so `npm run lint` works from either directory.

`git config core.hooksPath .husky/` is also run automatically by `npm install` via the root `prepare` script. The explicit call above is only needed on a fresh clone that skipped install.

## Configuration

All configuration lives in `my-app/.env.local`. The template documents every variable inline, marked `Required` (the app breaks without it), `Optional` (the feature degrades gracefully), or `CI Only`.

```bash
cp my-app/.env.example my-app/.env.local
```

To generate a signing secret:

```bash
openssl rand -hex 32    # AUTH0_SECRET
```

The **16 required variables** are listed in [my-app/.env.example](my-app/.env.example); the full set including the optional and CI-only ones is documented there too. In production, values live in Vercel and GitHub repository secrets and never in the repo itself.

| Group | Variables |
|-------|-----------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Auth0 | `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_BASE_URL`, `AUTH0_WEBHOOK_SECRET`, `AUTH0_M2M_CLIENT_ID`, `AUTH0_M2M_CLIENT_SECRET` |
| Cloudinary | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

**One setup step is easy to miss.** The Auth0 Post-Login Action must be enabled. It syncs each new user into the Supabase `profiles` table. Without it, every new user loops after login because no profile row is ever created.

Values live in Vercel and GitHub repository secrets in production; see [MAINTAINERS.md](MAINTAINERS.md#environment-variables) for the operational picture and [docs/SECRET_ROTATION_RUNBOOK.md](docs/SECRET_ROTATION_RUNBOOK.md) for rotating a credential.

## Architecture

![Butwal Hacks system architecture: the browser reaches the Next.js app on Vercel, which passes through proxy.ts for Auth0 session and subdomain routing, then fans out to Auth0, Supabase, Cloudinary, Upstash Redis, Resend, Groq, and Open Collective. An Auth0 Post-Login Action webhook upserts the profile into Supabase.](docs/images/architecture.png)

Auth0 owns identity. Supabase stores relational data through the Service Role Key, which bypasses RLS and is server-side only. Cloudinary handles media through pre-signed upload signatures. Every mutation route validates with Zod, checks the Auth0 session, and passes through Upstash rate limiting.

`my-app/src/proxy.ts` is the single entry point for both Auth0 session enforcement and subdomain routing.

![Login and profile sync sequence diagram: the browser signs in through Auth0, proxy.ts validates the session and reads the profile from Supabase, and the Auth0 Post-Login Action fires a webhook that upserts the profile row.](docs/images/auth-flow.png)

The Post-Login Action is the single most common cause of a broken local setup. See [Configuration](#configuration) above.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run audit:ui   # after `npm run build && npm run start`
```

All five must pass before a PR is opened. See [AGENTS.md](AGENTS.md) for the full gate definitions. `audit:ui` loads 30 public routes at 390/768/1440px in light and dark.

## Reference

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Authentication | Auth0, Regular Web App, Post-Login Action syncs to Supabase |
| Database | Supabase PostgreSQL via Service Role Key; Supabase Auth is not used |
| Media | Cloudinary |
| Rate limiting | Upstash Redis |
| Email | Resend |
| Analytics | PostHog and Vercel Analytics |
| Error tracking | Sentry |
| Payments | Open Collective |
| AI | Groq (team matching, chatbot, certificate OCR) |
| Hosting | Vercel |

### By the numbers

Counts as of the commit that last touched this table.

| Measure | Count |
|---------|-------|
| API route files | 60 |
| API handlers | 70 |
| Pages and layouts | 112 |
| React components | 168 |
| Files in `src/lib` | 171 |
| Database migrations | 101 |
| Unit and integration test files | 117 |
| End-to-end specs | 6 |
| Tests | 1767 |
| Roles | 5 |
| Design tokens | 35 |

### Repository layout

```text
Butwal-Hacks/
  my-app/         # Next.js app (app/, components/, lib/, e2e/)
  supabase/       # 101 SQL migrations, sequentially numbered
  scripts/        # Operational scripts
  docs/           # Architecture, runbooks, audits in reports/, diagrams
  .github/        # Workflows, issue templates, PR template, CONTRIBUTING, SECURITY, CoC
  vercel.json     # Deploy config and cron schedules
```

Full map: [AGENTS.md → Repository layout](AGENTS.md#repository-layout).

## Troubleshooting

The common failures (Auth0 redirect loop, Supabase env drift, migration pooler, Redis fail-open, dark-mode token bypass) and their fixes are documented once, in [AGENTS.md → Troubleshooting](AGENTS.md#troubleshooting). Deploy-specific checks live in [MAINTAINERS.md → If something breaks](MAINTAINERS.md#if-something-breaks-in-production).

## See also

| Document | Covers |
|----------|--------|
| [AGENTS.md](AGENTS.md) | Setup, verification gates, conventions, access control |
| [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) | Contributor workflow and local development |
| [PRODUCT.md](PRODUCT.md) | Mission, users, route zones, roadmap |
| [DESIGN.md](DESIGN.md) | Colors, typography, utility classes, accessibility |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | ADRs, security model, testing, error handling |
| [MAINTAINERS.md](MAINTAINERS.md) | Deploy, CI, rollback, environment variables |
| [.github/SECURITY.md](.github/SECURITY.md) | Vulnerability reporting |
| [.github/CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md) | Community standards |
| [`/legal/terms` and `/legal/privacy`](https://butwalhacks.com) | Terms of service and privacy, served by the app |
| [docs/SECRET_ROTATION_RUNBOOK.md](docs/SECRET_ROTATION_RUNBOOK.md) | Rotating an exposed credential, end to end |
| [docs/reports/2026-10-seo-aeo-geo-audit.md](docs/reports/2026-10-seo-aeo-geo-audit.md) | Historical: search and AI-answer visibility audit |
| [my-app/.env.example](my-app/.env.example) | Every environment variable, annotated |
| [my-app/public/llms.txt](my-app/public/llms.txt) | Machine-readable site summary for AI crawlers |

## Credits

Built and maintained by the Butwal Hacks core team in Butwal, Nepal — a youth-led nonprofit running hackathons, mentorship, and open projects.

- **Contributors** — see the [full contributor graph](https://github.com/Prarambha369/Butwal-Hacks/graphs/contributors). Commits are authored by [@Prarambha369](https://github.com/Prarambha369).
- **Built with** — Next.js, TypeScript, Tailwind CSS, Auth0, Supabase, Cloudinary, Upstash Redis, Resend, Groq, PostHog, Sentry, Open Collective, Vitest, and Playwright.

## License

MIT. See [LICENSE](LICENSE).