# Contributing to Butwal Hacks

> How to get a working environment and get a change merged. Read alongside [AGENTS.md](AGENTS.md), which holds the technical conventions.

## What this is

Butwal Hacks is an open-source credential verification system and hackathon management platform for youth tech talent in Nepal. Contributions of code, documentation, design, and operations are all welcome.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| First-time contributors | Getting a working local environment |
| Returning contributors | The checklist before opening a PR |
| Documentation contributors | Which file to edit for which kind of change |

## Quick actions

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20 or newer |
| Package manager | npm only; pnpm and yarn are not supported |
| Git | any recent version |

### Local development

```bash
git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks
npm install
cp my-app/.env.example my-app/.env.local
# Edit my-app/.env.local with your Auth0, Supabase, and third-party keys
npm run dev
# → http://localhost:3000
```

### Enable the pre-commit hooks

```bash
git config core.hooksPath .husky/
```

Run this once after cloning. The hook runs ESLint on staged TypeScript files and a secrets audit on the diff. Without it, neither check runs locally.

### Before you open a PR

```bash
npx tsc --noEmit
npm run lint
npm run test
npm run build
```

All four must pass. If you cannot run one locally, say so in the PR rather than claiming it passed.

## Reference

### Which document to edit

| Change | Edit |
|--------|------|
| Setup steps, contribution workflow | This file |
| Conventions, gates, access control | [AGENTS.md](AGENTS.md) |
| Mission, users, roadmap, route zones | [PRODUCT.md](PRODUCT.md) |
| Tokens, typography, UI rules | [DESIGN.md](DESIGN.md) |
| ADRs, security model, testing strategy | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Secrets, deploy, rollback, on-call | [MAINTAINERS.md](MAINTAINERS.md) |

### Architecture in one diagram

```text
butwalhacks.com     →  Zone 1: public marketing
app.butwalhacks.com →  Zones 2-9: auth, profiles, dashboards, portal, API
```

| Zone | Routes | Purpose |
|------|--------|---------|
| 1 | `/`, `/blog`, `/about` | Public marketing site |
| 2 | `/auth/*` | Authentication, handled by Auth0 |
| 3 | `/p/[slug_id]`, `/verify/[markerId]` | Public credential profiles |
| 4 | `/dashboard/hacker/*` | Hacker dashboard |
| 5 | `/dashboard/organizer/*` | Organizer dashboard |
| 6 | `/dashboard/maintainer/*` | Maintainer dashboard |
| 7 | `/orgs/[slug]/*`, `/portal/*` | Organizations and sponsor portal |
| 8 | `/teams/*` | Teams |
| 9 | `/api/*` | REST API endpoints |

### Local Supabase and Redis with Docker

Optional. Useful if you do not want cloud accounts during development.

```bash
# From the repo root
docker compose up -d

# Brings up:
# - Supabase Studio at http://localhost:54321
# - Redis at localhost:6379
```

Then point `my-app/.env.local` at them:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from docker logs>
UPSTASH_REDIS_REST_URL=http://localhost:6379
```

This setup is for local development only. Production uses hosted Supabase and Upstash Redis.

### Code style

| Rule | Detail |
|------|--------|
| Types | Strict mode. No `any` in new code; use `unknown` with a type guard. If an `any` is unavoidable, leave a `// ponytail:` comment explaining why |
| Components | Server components by default. Add `"use client"` only for hooks, state, or browser APIs |
| Colors | Design tokens only, never literals. See [DESIGN.md](DESIGN.md) |
| Unused params | Prefix with `_` |
| Commits | Conventional Commits |

### Rate-limited mutation routes

```ts
import { withRateLimit } from "@/lib/rate-limiter";

export const POST = withRateLimit(handler);                  // 5 requests / 60s
export const POST = withRateLimit(handler, "sensitive");     // 3 requests / 60s
```

Wrap every `POST`, `PUT`, `PATCH`, and `DELETE` handler.

### Commits

```text
feat: add bento grid to homepage
fix: auth0 callback loop on logout
docs: update environment setup guide
chore: upgrade next.js to 16.3
refactor: extract rate limiter into lib/
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `npm install` fails on peer dependencies | Do not add `--legacy-peer-deps`; CI will fail too. Resolve the actual conflict |
| Port 3000 in use | `PORT=3001 npm run dev` |
| Hooks do not run | `git config core.hooksPath .husky/` |
| Tests fail only in CI | Auth-dependent E2E tests need `skipInCI()`; unit tests must not depend on env vars |
| Lint warns about an unused var | Prefix with `_` rather than deleting |

## Reporting issues

Use GitHub Issues for bugs and features, and include reproduction steps, expected behavior, and actual behavior.

For security vulnerabilities, do not open a public issue. See [SECURITY.md](SECURITY.md).

## See also

- [AGENTS.md](AGENTS.md) — technical conventions and verification gates
- [MAINTAINERS.md](MAINTAINERS.md) — operational procedures
- [SECURITY.md](SECURITY.md) — vulnerability reporting
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — community standards
- [README.md](README.md) — project overview

## License

By contributing you agree that your contributions are licensed under the same license as the project: MIT.
