# Maintainer Handbook - Butwal Hacks

This document covers operational tasks for maintainers: deploy, CI, secrets, release, and rollback. It assumes you have maintainer access to the Vercel project, Auth0 tenant, Supabase project, and GitHub repository.

## Repository Layout

```
Butwal-Hacks/
  my-app/              # Next.js 16 application source
    src/               # App source (app, components, lib, utils)
    e2e/               # Playwright E2E tests
  supabase/
    migrations/        # Database migrations (canonical)
  docs/                # Engineering documentation
  .github/workflows/   # CI and deploy pipelines
```

Root `package.json` delegates to `my-app/`. All commands run from `my-app/`.

## Secrets Inventory

### Auth0 (Authentication)

| Variable | Required | Source |
|----------|----------|--------|
| `AUTH0_DOMAIN` | Build, runtime | Auth0 tenant settings |
| `AUTH0_CLIENT_ID` | Build, runtime | Auth0 application settings |
| `AUTH0_CLIENT_SECRET` | Build, runtime | Auth0 application settings |
| `AUTH0_SECRET` | Build, runtime | Generate via `openssl rand -hex 32` |
| `AUTH0_BASE_URL` | Build | Vercel deployment URL |
| `AUTH0_WEBHOOK_SECRET` | Runtime | Generate via `openssl rand -hex 32` |
| `AUTH0_M2M_CLIENT_ID` | Build, CI | Auth0 Machine-to-Machine app |
| `AUTH0_M2M_CLIENT_SECRET` | Build, CI | Auth0 Machine-to-Machine app |

### Supabase (Database)

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build, runtime | Supabase project settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build, runtime | Supabase project settings > API (anon public key) |
| `SUPABASE_DB_URL` | Deploy only | Supabase project settings > Database > Connection string (with service_role) |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime | Supabase project settings > API (service_role secret) |

### Cloudinary (Media)

| Variable | Required | Source |
|----------|----------|--------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Build, runtime | Cloudinary dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Build, runtime | Cloudinary settings > Upload presets |
| `CLOUDINARY_API_KEY` | Runtime | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Runtime | Cloudinary dashboard |

### External APIs

| Variable | Required | Source |
|----------|----------|--------|
| `GROQ_API_KEY` | Runtime | Groq console |
| `RESEND_API_KEY` | Runtime | Resend dashboard |
| `OC_WEBHOOK_SECRET` | Runtime | Generate via `openssl rand -hex 32` |
| `APP_BASE_URL` | CI | Set to deployment URL (e.g., `http://localhost:3000` in CI) |
| `NEXT_PUBLIC_SITE_URL` | Build, CI | Canonical site URL (`https://butwalhacks.com`) |

### Infrastructure

| Variable | Required | Source |
|----------|----------|--------|
| `UPSTASH_REDIS_REST_URL` | Runtime | Upstash console > REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Runtime | Upstash console > REST API |

### Observability

| Variable | Required | Source |
|----------|----------|--------|
| `AXIOM_TOKEN` | Runtime | Axiom ingest token |
| `AXIOM_DATASET` | Runtime | Axiom dataset name |
| `SENTRY_DSN` | Runtime | Sentry project settings |
| `SENTRY_ORG` | Build | Sentry org slug |
| `SENTRY_PROJECT` | Build | Sentry project name |
| `SENTRY_AUTH_TOKEN` | Build | Sentry auth token (source map uploads) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Runtime | PostHog project settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | Runtime | PostHog instance URL |

### CI-Only

| Variable | Required | Source |
|----------|----------|--------|
| `ANTHROPIC_API_KEY` | CI | Anthropic console (for AI code review) |
| `GITHUB_TOKEN` | CI | Auto-provided by GitHub Actions |

### Where to set them

- **Vercel**: All `NEXT_PUBLIC_*` and runtime env vars in Vercel project dashboard > Environment Variables.
- **GitHub**: All build-time and CI vars in Settings > Secrets and Variables > Actions.
- **Local**: Copy `.env.example` to `my-app/.env.local` and fill in development values.

## CI Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and PR to `main`. Jobs run in parallel unless noted:

| Job | Trigger | Depends on | Description |
|-----|---------|------------|-------------|
| `lint` | push, PR | none | ESLint check |
| `security-audit` | push, PR | none | `npm audit --audit-level=high` |
| `typecheck` | push, PR | none | `tsc --noEmit` |
| `build` | push, PR | `typecheck` | `npm run build` with env vars |
| `test` | push, PR | none | `vitest run` (unit + smoke tests) |
| `secrets-audit` | PR only | none | Scan for leaked secrets in diff |
| `auth0-m2m-verify` | push, PR | none | Verify Auth0 M2M API access |
| `ai-review` | PR only | none | Claude-based code review on diff |
| `ponytail-audit` | PR only | none | Dead code detection |

### Current known CI issues

- **Lint**: Fails with 3 errors and ~65 warnings. Errors are hook rules and `prefer-const`. Warnings are tracked but non-blocking for deployment.
- **All other jobs pass**: Typecheck, build, tests (323), secrets audit, M2M verify, and audits are green.

## Deploy Flow

### Vercel (automatic)

Every push to `main` triggers an automatic Vercel deployment via the GitHub integration. Vercel reads `vercel.json` from the repo root.

Key Vercel settings:
- **Root Directory**: `my-app/`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci --legacy-peer-deps`
- **Framework**: Next.js

Preview deployments are created for each PR branch with a unique URL.

### Database Migrations (manual via deploy.yml)

The deploy workflow (`.github/workflows/deploy.yml`) applies Supabase migrations on push to `main`:

```yaml
jobs:
  migrate:
    - Install Supabase CLI (via `supabase/setup-cli`)
    - Run `supabase db push --db-url "$SUPABASE_DB_URL"`
```

**The migration step requires `SUPABASE_DB_URL` to be set as a GitHub secret.** This is a `postgresql://` connection string with the service role.

If the migration step fails, the Vercel deployment may still succeed but the app could hit schema errors. Check the deploy workflow logs.

### Manual deploy

```bash
# 1. Apply any pending migrations
supabase db push --db-url "$SUPABASE_DB_URL"

# 2. Push to main (triggers Vercel auto-deploy)
git push origin main

# 3. Verify deployment at https://butwalhacks.com
```

## Release Checklist

### Before Merge

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Tests pass: `npx vitest run`
- [ ] Lint is clean (or known warnings documented in issue tracker)
- [ ] New API routes have `withRateLimit` wrapper
- [ ] New POST routes return `{ status: 201 }` for resource creation
- [ ] New env vars added to `.env.example` and documented in secrets table
- [ ] Database migration created in `supabase/migrations/` with sequential number
- [ ] Migration uses `NOT VALID` + separate `VALIDATE CONSTRAINT` for table-wide checks
- [ ] PR review completed (human or AI)
- [ ] No secrets or hardcoded credentials in the diff

### Before Deploy

- [ ] All migrations applied: `supabase db push --db-url "$SUPABASE_DB_URL"`
- [ ] Vercel deploy triggered from `main`
- [ ] Production build logs checked for errors (watch Vercel deploy logs)

### After Deploy

- [ ] Homepage loads at https://butwalhacks.com
- [ ] Sign-in flow works at https://butwalhacks.com/sign-in
- [ ] At least one dashboard loads after sign-in
- [ ] Check Sentry for new errors in the first 5 minutes
- [ ] Check Axiom for anomalous log patterns
- [ ] Verify the release in PostHog (session count matches expected traffic)

## Rollback

### Vercel

1. Go to Vercel project dashboard > Deployments
2. Find the last known-good deployment
3. Click the three dots menu > Promote to Production
4. Verify rollback at https://butwalhacks.com

### Database

Supabase migrations are designed to be additive only. To roll back:

```sql
-- Reverse migration 090 (example)
DROP FUNCTION IF EXISTS get_next_task_position(UUID, TEXT);
```

For destructive changes (column drops, table drops), create a rollback migration script before deploying the forward migration.

### Full rollback

If both code and database need rollback:
1. Revert the PR in git: `git revert <commit-hash>`
2. Push to main (triggers Vercel deploy)
3. Apply the database rollback SQL manually via Supabase SQL editor
4. Verify at https://butwalhacks.com

## On-Call Runbook

### Sign-in is broken

1. Check Auth0 tenant health at https://status.auth0.com
2. Verify `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` are set in Vercel env vars
3. Check Auth0 application settings for correct callback/logout URLs
4. Verify Auth0 Post-Login Action is enabled (syncs user to Supabase)

### Database errors in production

1. Check Vercel function logs for SQL error messages
2. Verify Supabase project is not at connection pool limit
3. Run `SELECT count(*) FROM pg_stat_activity;` to check active connections
4. If pool exhausted, enable PgBouncer or upgrade Supabase plan

### Emails not sending

1. Check Resend dashboard for API errors or rate limits
2. Verify `RESEND_API_KEY` is set in Vercel env vars
3. Check daily email quota (free tier: 100/day)

### Rate limiting is disabled

1. Check `UPSTASH_REDIS_REST_URL` is set in Vercel env vars
2. Check Upstash dashboard for remaining monthly commands (free tier: 500,000/month)
3. The rate limiter fails open (allows requests) when Redis is unreachable

### CI is failing

Check which job is failing in the GitHub Actions dashboard:

- **Lint fails**: Run `npm run lint` locally, fix errors
- **Typecheck fails**: Run `tsc --noEmit` locally, fix type errors
- **Build fails**: Check for missing env vars in CI secrets (mirror Vercel env)
- **Tests fail**: Run `npx vitest run` locally, fix failing tests
- **Secrets audit fails**: Remove leaked secrets from the diff

## Ownership

| Area | Owner | Review Required |
|------|-------|----------------|
| Auth0 configuration | Maintainer | Any change to callback URLs, roles, or Actions |
| Supabase schema | Maintainer | Any new migration or RPC function |
| API routes | Author | Rate limiting, Zod validation, status codes |
| UI components | Author | Design system compliance, accessibility |
| Documentation | Author | Aligned with current codebase |
| CI/CD pipeline | Maintainer | Any change to workflow files |
| Dependencies | Author | `npm audit` must pass; no `--force` flag |

## Cleanup Policy

The following artifacts should never be committed to the repository:

- Build output: `.next/`, `out/`
- Local logs: `dev_log.txt`, `lint_output.txt`, any `.log` files
- Browser downloads: `chrome/` directory (use Playwright-managed browsers)
- History rewrite artifacts: `.git-rewrite/`
- Temporary audit output: `.audit.json`, `tmp/`
- Editor config: `.vscode/`, `.idea/`
- OS files: `.DS_Store`, `Thumbs.db`

Add new patterns to `.gitignore` at the repo root.
