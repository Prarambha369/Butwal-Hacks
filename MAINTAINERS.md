# Maintainer Handbook

> Operational procedures for maintainers: secrets, CI, deploy, release, rollback, and on-call. Assumes access to the Vercel project, Auth0 tenant, Supabase project, and GitHub repository.

## Contents

- [What this is](#what-this-is)
- [Who it's for](#who-its-for)
- [Quick actions](#quick-actions)
- [Reference](#reference)
  - [Repository layout](#repository-layout)
  - [Secrets inventory](#secrets-inventory)
  - [CI pipeline](#ci-pipeline)
  - [Deploy flow](#deploy-flow)
  - [Release checklist](#release-checklist)
  - [Rollback](#rollback)
  - [On-call runbook](#on-call-runbook)
  - [Ownership](#ownership)
  - [Cleanup policy](#cleanup-policy)
- [Troubleshooting](#troubleshooting)
- [See also](#see-also)

## What this is

The runbook for operating this platform in production. It covers what to set, what runs, how to ship, and what to do when something breaks at three in the morning.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| Maintainers on call | Diagnosing a production incident |
| Maintainers shipping a change | The release checklist |
| New maintainers | Where secrets live and who owns what |

## Quick actions

**Ship a change:**

```bash
# 1. Apply pending migrations
supabase db push --db-url "$SUPABASE_DB_URL"

# 2. Merge to main; Vercel deploys automatically
git push origin main

# 3. Verify
curl -s -o /dev/null -w '%{http_code}\n' https://butwalhacks.com/
```

**Rotate an exposed credential:** follow [docs/SECRET_ROTATION_RUNBOOK.md](docs/SECRET_ROTATION_RUNBOOK.md) end to end. Do not skip step 0.

**Add a new environment variable:** add it to `.env.example`, to the table below, and to the MAINTAINERS secrets table in the same PR.

## Reference

### Repository layout

```text
Butwal-Hacks/
  my-app/                # Next.js 16 application source
    src/                 # app, components, lib, hooks, utils
    e2e/                 # Playwright E2E tests
  supabase/
    migrations/          # 91 database migrations, canonical schema
  scripts/               # Operational scripts
  docs/                  # Engineering documentation
  .github/workflows/     # CI, deploy, keep-alive
```

The root `package.json` is an npm workspace that delegates every script into `my-app/`.

### Secrets inventory

Where each variable is set:

- **Vercel** — all `NEXT_PUBLIC_*` and runtime variables, in the project dashboard under Environment Variables.
- **GitHub** — all build-time and CI variables, under Settings, Secrets and variables, Actions.
- **Local** — copied from `.env.example` into `my-app/.env.local`.

#### Auth0

| Variable | Required | Source |
|----------|----------|--------|
| `AUTH0_DOMAIN` | Build, runtime | Tenant settings |
| `AUTH0_CLIENT_ID` | Build, runtime | Application settings |
| `AUTH0_CLIENT_SECRET` | Build, runtime | Application settings |
| `AUTH0_SECRET` | Build, runtime | `openssl rand -hex 32` |
| `AUTH0_BASE_URL` | Build | The Vercel deployment URL |
| `AUTH0_WEBHOOK_SECRET` | Runtime | `openssl rand -hex 32` |
| `AUTH0_M2M_CLIENT_ID` | Build, CI | Machine-to-Machine app |
| `AUTH0_M2M_CLIENT_SECRET` | Build, CI | Machine-to-Machine app |

#### Supabase

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build, runtime | Project settings, API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build, runtime | Project settings, API, anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime | Project settings, API, service_role secret |
| `SUPABASE_DB_URL` | Deploy only | Project settings, Database, connection string. Must be direct or session-pooler, not transaction-pooler |

#### Cloudinary

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Build, runtime | Cloudinary dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Build, runtime | Upload presets |
| `CLOUDINARY_API_KEY` | Runtime | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Runtime | Cloudinary dashboard |

#### External APIs

| Variable | Required | Source |
|----------|----------|--------|
| `GROQ_API_KEY` | Runtime | Groq console |
| `RESEND_API_KEY` | Runtime | Resend dashboard |
| `OC_WEBHOOK_SECRET` | Runtime | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Build, CI | Canonical site URL |
| `APP_BASE_URL` | CI | The deployment URL; `http://localhost:3000` locally |

#### Infrastructure

| Variable | Required | Source |
|----------|----------|--------|
| `UPSTASH_REDIS_REST_URL` | Runtime | Upstash console, REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Runtime | Upstash console, REST API |

#### Observability

| Variable | Required | Source |
|----------|----------|--------|
| `SENTRY_DSN` | Runtime | Sentry project settings |
| `SENTRY_ORG` | Build | Sentry org slug |
| `SENTRY_PROJECT` | Build | Sentry project name |
| `SENTRY_AUTH_TOKEN` | Build | Sentry auth token, for source map uploads |
| `NEXT_PUBLIC_POSTHOG_KEY` | Runtime | PostHog project settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | Runtime | PostHog instance URL |
| `AXIOM_TOKEN` | Runtime | Axiom ingest token |
| `AXIOM_DATASET` | Runtime | Axiom dataset name |

#### CI only

| Variable | Required | Source |
|----------|----------|--------|
| `ANTHROPIC_API_KEY` | CI | Anthropic console, for AI code review |
| `GITHUB_TOKEN` | CI | Provided automatically by GitHub Actions |

### CI pipeline

`.github/workflows/ci.yml` runs on every push and pull request to `main`. Jobs run in parallel unless a dependency is listed.

| Job | Trigger | Depends on | What it does |
|-----|---------|------------|--------------|
| `lint` | push, PR | none | ESLint |
| `typecheck` | push, PR | none | `tsc --noEmit` |
| `test` | push, PR | none | Vitest, unit and smoke |
| `security-audit` | push, PR | none | `npm audit --audit-level=high` |
| `secrets-audit` | PR only | none | Scans the diff for leaked secrets |
| `auth0-m2m-verify` | push, PR | none | Verifies Auth0 M2M API access |
| `ai-review` | PR only | none | Claude-based review of the diff |
| `ponytail-audit` | PR only | none | Dead code detection |
| `build` | push, PR | `typecheck` | Production build with env vars |

### Deploy flow

#### Vercel, automatic

Every push to `main` triggers a deployment through the GitHub integration, which reads `vercel.json` from the repo root. Preview deployments are created per PR branch.

| Setting | Value |
|---------|-------|
| Build command | `npm run build`, which runs `cd my-app && npm run build` |
| Framework | Next.js |
| Install command | `npm ci` |

#### Database migrations

`.github/workflows/deploy.yml` applies Supabase migrations on push to `main` using `supabase db push --db-url "$SUPABASE_DB_URL"`.

**`SUPABASE_DB_URL` must be set as a GitHub secret.** It is a `postgresql://` connection string carrying the service role, using a direct or session-pooler port. A transaction-pooler URL cannot run DDL and will fail the step.

A migration failure can leave the Vercel deploy green while the app hits schema errors. Check the deploy workflow logs whenever a route starts erroring on a fresh deploy.

### Release checklist

**Before merge**

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npm run test` passing
- [ ] `npm run build` succeeding
- [ ] New mutation routes wrapped in `withRateLimit()`
- [ ] New `POST` routes returning `{ status: 201 }` for resource creation
- [ ] New env vars added to `.env.example` and to the secrets inventory above
- [ ] New migration numbered sequentially and additive
- [ ] Table-wide checks use `NOT VALID` plus a separate `VALIDATE CONSTRAINT`
- [ ] No secrets in the diff

**Before deploy**

- [ ] All migrations applied with `supabase db push --db-url "$SUPABASE_DB_URL"`
- [ ] Deploy triggered from `main`
- [ ] Production build logs checked for errors

**After deploy**

- [ ] Homepage loads at `https://butwalhacks.com`
- [ ] Sign-in flow works
- [ ] At least one dashboard loads after sign-in
- [ ] Sentry shows no new errors in the first five minutes
- [ ] Axiom shows no anomalous log patterns
- [ ] PostHog session count matches expected traffic

### Rollback

#### Application

1. Open the Vercel project dashboard, then Deployments.
2. Find the last known-good deployment.
3. Use the three-dot menu and Promote to Production.
4. Verify at `https://butwalhacks.com`.

#### Database

Migrations are designed to be additive only. To reverse one, write the inverse DDL and run it in the Supabase SQL editor:

```sql
DROP FUNCTION IF EXISTS get_next_task_position(UUID, TEXT);
```

For destructive changes such as column or table drops, write the rollback migration before deploying the forward migration, not after.

#### Both

1. Revert the merge commit with `git revert <commit-hash>`.
2. Push to `main`, which triggers a Vercel deploy.
3. Apply the database rollback SQL in the Supabase SQL editor.
4. Verify at `https://butwalhacks.com`.

### On-call runbook

#### Sign-in is broken

1. Check `https://status.auth0.com`.
2. Verify `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET` are set in Vercel.
3. Check the Auth0 application's callback and logout URLs.
4. Verify the Post-Login Action is enabled. Without it, profiles are never created and new users loop after login.

#### Database errors in production

1. Read the SQL error in the Vercel function logs.
2. Check whether Supabase is at its connection pool limit with `SELECT count(*) FROM pg_stat_activity;`.
3. If the pool is exhausted, enable PgBouncer or raise the Supabase plan.

#### Emails are not sending

1. Check the Resend dashboard for API errors or rate limits.
2. Verify `RESEND_API_KEY` is set in Vercel.
3. Check the daily quota; the free tier is 100 per day.

#### Rate limiting appears disabled

1. Verify `UPSTASH_REDIS_REST_URL` is set in Vercel.
2. Check the Upstash dashboard for remaining monthly commands; the free tier is 500,000.
3. Remember the limiter fails open, so a Redis outage looks exactly like rate limiting being switched off.

#### CI is failing

| Failing job | First move |
|-------------|------------|
| `lint` | Run `npm run lint` locally and fix it |
| `typecheck` | Run `npx tsc --noEmit` locally |
| `build` | Check for env vars missing from GitHub secrets; they must mirror Vercel |
| `test` | Run `npm run test` locally |
| `secrets-audit` | Remove the leaked secret from the diff and rotate it |
| `auth0-m2m-verify` | Confirm the M2M app exists and holds `read:users` and `update:users` |

### Ownership

| Area | Owner | Review required for |
|------|-------|---------------------|
| Auth0 configuration | Maintainer | Callback URLs, roles, Actions |
| Supabase schema | Maintainer | New migrations or RPC functions |
| API routes | Author | Rate limiting, Zod validation, status codes |
| UI components | Author | Design system compliance, accessibility |
| Documentation | Author | Alignment with the current codebase |
| CI/CD pipeline | Maintainer | Any change to workflow files |
| Dependencies | Author | `npm audit` must pass; no `--force` |

### Cleanup policy

These artifacts must never be committed:

| Category | Examples |
|----------|----------|
| Build output | `.next/`, `out/` |
| Local logs | `dev_log.txt`, `lint_output.txt`, any `.log` |
| Browser downloads | `chrome/`; use Playwright-managed browsers |
| History rewrite artifacts | `.git-rewrite/` |
| Temporary audit output | `tmp/` |
| Editor config | `.vscode/`, `.idea/` |
| OS files | `.DS_Store`, `Thumbs.db` |

Add new patterns to `.gitignore` at the repo root.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Deploy fails at the migration step | `SUPABASE_DB_URL` is a transaction-pooler URL | Switch to a direct or session-pooler connection string |
| New env var missing in production | Added to code but not to Vercel or GitHub secrets | Add it to both, and to `.env.example` |
| Secrets audit flags a diff | A credential-shaped string was committed | Remove it and rotate the credential immediately |
| Vercel 401 on Supabase calls in production only | A manual env drifted from the Supabase-managed value | Delete the manual entries; the integration re-injects them |
| Rollback does not fix a schema error | The migration was destructive | Apply the inverse DDL in the Supabase SQL editor |

## See also

- [AGENTS.md](AGENTS.md) — the checks a change must pass
- [docs/SECRET_ROTATION_RUNBOOK.md](docs/SECRET_ROTATION_RUNBOOK.md) — rotating exposed credentials
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — engineering reference
- [SECURITY.md](SECURITY.md) — vulnerability reporting
- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor workflow
