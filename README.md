# Butwal Hacks

> A credential verification system and hackathon management platform for student tech communities in Nepal. Maintained by the Butwal Hacks core team.

## What this is

Butwal Hacks gives young builders in Nepal an ORCID-style public identity, a place to run hackathons, and a record of work they can prove. This repository holds the Next.js application, the database schema, and the automation around both.

## Quick start

```bash
git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks
npm install
cp my-app/.env.example my-app/.env.local   # then fill in your keys
git config core.hooksPath .husky/    # enables pre-commit lint + secrets audit
npm run dev                          # → http://localhost:3000
```

Every script delegates from the repo root into `my-app/`, so `npm run lint` works from either directory.

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

### How it fits together

Auth0 owns identity. Supabase stores relational data through the Service Role Key, which bypasses RLS and is server-side only. Cloudinary handles media through pre-signed upload signatures. Every mutation route validates with Zod, checks the Auth0 session, and passes through Upstash rate limiting.

`my-app/src/proxy.ts` is the single entry point for both Auth0 session enforcement and subdomain routing.

### By the numbers

| Measure | Count |
|---------|-------|
| API route files | 58 |
| API handlers | 65 |
| Pages and layouts | 109 |
| React components | 159 |
| Files in `src/lib` | 150 |
| Database migrations | 91 |
| Roles | 5 |
| Design tokens | 58 |

### Repository layout

```text
Butwal-Hacks/
  my-app/                 # Next.js application
    src/
      app/                # App Router pages and API routes
      components/         # React components
      hooks/              # Custom hooks
      lib/                # Business logic, server actions, types
      utils/supabase/     # Supabase client factories
      proxy.ts            # Auth and subdomain routing
    e2e/                  # Playwright E2E tests
  supabase/migrations/    # 91 SQL migrations, sequentially numbered
  scripts/                # Operational scripts
  docs/                   # Architecture and runbooks
  .github/                # Workflows, issue templates, PR template
  vercel.json             # Deployment config and cron schedules
```

### Verification

```bash
npx tsc --noEmit
npm run lint
npm run test
npm run build
```

All four must pass before a PR is opened. See [AGENTS.md](AGENTS.md) for the full gate definitions.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Port 3000 already in use | `PORT=3001 npm run dev` |
| Auth0 redirect loop on login | Enable the Post-Login Action; it syncs the profile to Supabase |
| Empty dashboard after signing in | The webhook at `/api/webhooks/auth0` did not fire; check `AUTH0_WEBHOOK_SECRET` |
| Supabase queries return 401 in production only | A manual Vercel env drifted from the integration; see [MAINTAINERS.md](MAINTAINERS.md) |
| Colors wrong in dark mode | A literal hex bypassed a design token; see [DESIGN.md](DESIGN.md) |

## See also

| Document | Covers |
|----------|--------|
| [AGENTS.md](AGENTS.md) | Setup, verification gates, conventions, access control |
| [PRODUCT.md](PRODUCT.md) | Mission, users, route zones, roadmap |
| [DESIGN.md](DESIGN.md) | Colors, typography, utility classes, accessibility |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | ADRs, security model, testing, error handling |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributor workflow and local development |
| [MAINTAINERS.md](MAINTAINERS.md) | Secrets, deploy, CI, rollback, on-call |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |

## License

MIT. See [LICENSE](LICENSE).
