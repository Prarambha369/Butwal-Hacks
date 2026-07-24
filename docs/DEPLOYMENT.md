# Deployment — Butwal Hacks

Production deployment guide for the Butwal Hacks platform. Vercel hosts the Next.js application. Subdomain routing separates marketing (`butwalhacks.com`) from the app (`app.butwalhacks.com`) via `proxy.ts`.

---

## 1. Vercel Project Configuration

### Import Project

1. Go to [vercel.com/new](https://vercel.com/new) and import the `Prarambha369/Butwal-Hacks` repository.
2. The root directory is the repo root (`/`). The app lives in `my-app/`.

### Project Settings

| Setting | Value | Source |
|---------|-------|--------|
| **Framework Preset** | `Next.js` | Auto-detected |
| **Root Directory** | `my-app/` | `vercel.json` (`buildCommand` runs in `my-app/`) |
| **Build Command** | `npm run build` | `vercel.json` |
| **Install Command** | `npm install` | `vercel.json` |
| **Output Directory** | `.next` | Next.js default |
| **Node.js Version** | 20.x | `.github/workflows/ci.yml` |

### Domains

Configured via Vercel Dashboard -> Project -> Settings -> Domains:

| Domain | Type | Purpose |
|--------|------|---------|
| `butwalhacks.com` | Primary | Zone 1 — Public marketing site |
| `app.butwalhacks.com` | Subdomain | Zones 2-9 — Dashboards, profiles, APIs |
| `www.butwalhacks.com` | Redirect to `butwalhacks.com` | Canonical redirect |

After adding these domains in Vercel, proceed to DNS configuration (Section 2).

### Environment Variables

All variables must be set in Vercel Dashboard -> Project -> Settings -> Environment Variables.

**Production values** are used when deploying from the `main` branch. Development/Preview values can differ.

See `my-app/.env.example` for the full list with descriptions. Key variables:

```
# Required for build
AUTH0_SECRET=<openssl rand -hex 32>
AUTH0_DOMAIN=<auth0 tenant domain>
AUTH0_CLIENT_ID=<auth0 regular web app client id>
AUTH0_CLIENT_SECRET=<auth0 regular web app client secret>
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>

# Required for runtime
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>
CLOUDINARY_API_SECRET=<cloudinary api secret>
UPSTASH_REDIS_REST_URL=<upstash redis url>
UPSTASH_REDIS_REST_TOKEN=<upstash redis token>
RESEND_API_KEY=<resend api key>

# Optional but recommended
SENTRY_DSN=<sentry dsn>
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=<posthog token>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
GROQ_API_KEY=<groq api key for AI features>
```

---

## 2. DNS Configuration

### Using Vercel DNS (recommended)

Delegate DNS to Vercel by setting the domain's nameservers to Vercel's:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Then in Vercel Dashboard -> Project -> Settings -> Domains, add `butwalhacks.com` and follow the prompts to configure DNS records automatically.

### Using an External DNS Provider

If you use Cloudflare, Namecheap, or another DNS provider, add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `CNAME` | `@` (or `butwalhacks.com`) | `cname.vercel-dns.com` | 300 |
| `CNAME` | `app` | `cname.vercel-dns.com` | 300 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 300 |

For email (MX) records, configure separately (use a service like Google Workspace or Zoho):

| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| `MX` | `@` | `mx.zoho.com` | 10 | 300 |
| `TXT` | `@` | `v=spf1 include:zoho.com ~all` | — | 300 |

### Subdomain Routing (proxy.ts)

The `src/proxy.ts` middleware enforces subdomain routing:

- `butwalhacks.com` — serves Zone 1 marketing pages (landing, blog, events, community, etc.)
- `app.butwalhacks.com` — serves Zones 2-9 app routes (dashboards, profiles, APIs, portal, teams)
- Shared routes (`/auth/*`, `/_next/*`) work on both domains

If a user lands on the wrong subdomain, `proxy.ts` issues a 308 redirect to the correct one. On `localhost`, subdomain enforcement is skipped.

### Verifying DNS

```bash
# Check that both domains resolve
dig butwalhacks.com +short
dig app.butwalhacks.com +short
# Both should return Vercel's IP or CNAME

# Check propagation (can take 5-60 minutes)
curl -s -o /dev/null -w "%{http_code}" https://butwalhacks.com
curl -s -o /dev/null -w "%{http_code}" https://app.butwalhacks.com
# Both should return 200
```

---

## 3. CI/CD Pipeline

### Workflows

| Workflow | Trigger | File |
|----------|---------|------|
| **CI** | Every PR to `main` | `.github/workflows/ci.yml` |
| **Deploy** | Push to `main` | `.github/workflows/deploy.yml` |

### CI Pipeline (per PR)

Runs in order:
1. **Lint** — `npm run lint` (0 warnings required)
2. **Security Audit** — `npm audit --audit-level=high`
3. **Typecheck** — `npx tsc --noEmit` (0 errors required)
4. **Build** — `npm run build` (skipped if secrets missing, e.g., fork PRs)
5. **Tests** — `npx vitest run` (876+ tests)
6. **Secrets Audit** — Scans diff for hardcoded credentials
7. **E2E Tests** — Playwright (requires Auth0 test credentials)
8. **AI Review** — Claude-based code review

### Deploy Pipeline (push to main)

Sequential jobs:
1. **migrate** — Applies Supabase migrations (`supabase db push`)
2. **seed-embeddings** — Seeds knowledge base embeddings (only if content changed)
3. **vercel-deploy** — Calls Vercel Deploy Hook URL

The deploy hook URL is set as `VERCEL_DEPLOY_HOOK_URL` in GitHub Secrets.

### Preview Deployments

Every PR automatically gets a preview deployment on Vercel at `{project}-git-{branch}.{user}.vercel.app`. This deployment has its own URL and environment variables (can differ from production).

---

## 4. Auth0 Configuration

### Application

1. Create a **Regular Web Application** at [manage.auth0.com](https://manage.auth0.com).
2. Set callback URLs:
   ```
   Production:  https://butwalhacks.com/auth/callback
   Dev:         http://localhost:3000/auth/callback
   ```
3. Set logout URLs:
   ```
   Production:  https://butwalhacks.com
   Dev:         http://localhost:3000
   ```
4. Set web origins:
   ```
   Production:  https://butwalhacks.com, https://app.butwalhacks.com
   Dev:         http://localhost:3000, http://app.localhost:3000
   ```

### M2M Application (for CI)

1. Create a **Machine-to-Machine Application**.
2. Authorize for **Auth0 Management API** with scopes:
   - `read:users`, `update:users`, `delete:users`, `create:users`
   - `read:actions`, `update:actions`, `delete:actions`, `create:actions`
3. Set `AUTH0_M2M_CLIENT_ID` and `AUTH0_M2M_CLIENT_SECRET` in GitHub Secrets.

### Post-Login Action

1. Go to Auth0 -> Actions -> Flows -> Login.
2. Create and deploy the action from `scripts/deploy-auth0-action.mjs`.
3. This syncs user profiles to Supabase on every login (creates profile rows with `BH-YY-NNN` IDs).

---

## 5. Supabase Setup

### Project

1. Create a project at [supabase.com](https://supabase.com).
2. Note the **Project URL**, **Anon Key**, and **Service Role Key**.
3. Disable built-in auth providers (Auth0 handles authentication)

### Migrations

```bash
# From the repo root
cd my-app
node scripts/apply-migrations.mjs
```

This applies all migration files from `supabase/migrations/` (60+ migrations covering profiles, events, teams, projects, trust markers, etc.).

### Realtime

Enable Realtime on these tables via Supabase Dashboard -> Database -> Replication:
- `tasks` — live Kanban board updates
- `audit_logs` — live audit feed (maintainer dashboard)

---

## 6. Third-Party Services

| Service | Setup | Key Variables |
|---------|-------|---------------|
| **Cloudinary** | Create account, note cloud name + API key/secret, create upload preset `butwal_hacks_upload` | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_SECRET` |
| **Upstash Redis** | Create Redis database (free tier), note REST URL + token | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Resend** | Create account, generate API key, set sender domain if using custom email | `RESEND_API_KEY` |
| **PostHog** | Create project, note project token + host URL | `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` |
| **Sentry** | Create project, note DSN. Set `SENTRY_AUTH_TOKEN` for source map uploads in CI | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |
| **Axiom** | Create dataset, generate API token for structured logging | `AXIOM_TOKEN`, `AXIOM_DATASET` |

---

## 7. Security Headers

Configured in two places:

### vercel.json (CDN-level)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    },
    {
      "source": "/widget/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "frame-ancestors *" }
      ]
    }
  ]
}
```

### next.config.ts (application-level)

CSP enforcement with per-route `frame-ancestors`:
- `/*` — `frame-ancestors 'none'` (blocks all framing)
- `/widget/*` — `frame-ancestors *` (embeddable verification widget)
- CSP violations reported to `/api/csp-violation`

---

## 8. Rollback Procedure

### Immediate Rollback (Vercel)

1. Go to Vercel Dashboard -> Project -> Deployments.
2. Find the last known-good deployment (green checkmark).
3. Click the overflow menu (three dots) -> **Promote to Production**.
4. This instantly re-deploys the previous version. No build time needed.
5. Monitor the health check endpoint: `GET /api/health`

### Git Revert (for code fixes)

```bash
# Revert the most recent commit
git revert HEAD
git push origin main

# Or revert a specific bad deployment
git revert <bad-commit-hash>
git push origin main
```

The CI pipeline will re-run and deploy the reverted code.

### Database Rollback (Supabase)

Supabase migrations are designed to be forward-only. To undo a migration:

```bash
# 1. Identify the migration to roll back
ls supabase/migrations/

# 2. Write a reverse migration
cat > supabase/migrations/100_reverse_099.sql << 'EOF'
-- Reverse of 099_add_mentor_fields.sql
ALTER TABLE profiles DROP COLUMN IF EXISTS mentoring_topics;
ALTER TABLE profiles DROP COLUMN IF EXISTS mentee_capacity;
EOF

# 3. Apply the reverse migration
psql $SUPABASE_DB_URL -f supabase/migrations/100_reverse_099.sql
```

### Rollback Checklist

1. Revert the deployment via Vercel dashboard (instant).
2. If DB changes were involved, apply a reverse migration.
3. If the deploy hook was triggered, the production URL is already updated — Vercel reverts this.
4. Verify: check `GET /api/health` returns 200, navigate to key pages (login, events, dashboard).
5. Post-mortem: document the root cause, add tests, and open a fix PR.

---

## 9. Monitoring

| Tool | Monitors | URL |
|------|----------|-----|
| **Vercel Analytics** | Traffic, page views, geolocation | Vercel Dashboard -> Analytics |
| **PostHog** | Funnels, user behavior, feature adoption | PostHog Dashboard |
| **Sentry** | Error tracking with source maps | Sentry Dashboard |
| **Axiom** | Structured server-side logs | Axiom Dashboard |
| **Cron Health** | `/api/health` runs every 5 minutes (vercel.json crons) | Vercel Dashboard -> Cron Jobs |

### Health Check

```
GET /api/health

Response: { "ok": true, "timestamp": "..." }
```

Failed health checks indicate a deployment issue. Check Vercel Dashboard -> Deployments for build errors or Sentry for runtime errors.

---

## 10. Production Readiness Checklist

Before deploying to production:

- [ ] DNS records propagated (both `butwalhacks.com` and `app.butwalhacks.com`)
- [ ] SSL certificates issued by Vercel (automatic with custom domains)
- [ ] Environment variables set in Vercel production
- [ ] GitHub Secrets configured for CI/CD
- [ ] Vercel Deploy Hook created and added to GitHub Secrets
- [ ] Supabase migrations applied
- [ ] Auth0 applications configured with production URLs
- [ ] Branch protection enabled on `main` (requires passing CI checks)
- [ ] Security headers verified (curl -I https://butwalhacks.com)
- [ ] CSP violation endpoint monitored
- [ ] Rollback plan documented and accessible to the team
