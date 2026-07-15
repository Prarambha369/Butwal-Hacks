# Butwal Hacks — Maintainer Guide

## 🚀 Deployment

### Vercel
- **Project**: Connected to GitHub `Prarambha369/Butwal-Hacks`
- **Build command**: `cd my-app && npm run build` (defined in `vercel.json`)
- **Output directory**: `my-app/.next`
- **Install command**: `cd my-app && npm install` (defined in `vercel.json`)
- **Cron jobs** (defined in `vercel.json`):
  - `/api/cron/daily-stats` — daily at midnight UTC
  - `/api/cron/cleanup-expired` — every hour

### Required Environment Variables (Production)

Set these in **Vercel Dashboard → Settings → Environment Variables (Production)**:

#### Auth0
| Variable | Source |
|---|---|
| `AUTH0_SECRET` | `openssl rand -hex 32` |
| `AUTH0_DOMAIN` | `auth.butwalhacks.com` |
| `AUTH0_ISSUER_BASE_URL` | `https://auth.butwalhacks.com` |
| `AUTH0_CLIENT_ID` | Auth0 Dashboard → Applications |
| `AUTH0_CLIENT_SECRET` | Auth0 Dashboard → Applications |
| `AUTH0_BASE_URL` | `https://butwalhacks.com` |

#### Supabase
| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |

#### Cloudinary
| Variable | Source |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Dashboard → Settings → Upload |

#### Cloudflare R2 (optional — video)
| Variable | Source |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare Dashboard → R2 |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → API Tokens |
| `R2_SECRET_ACCESS_KEY` | Cloudflare → R2 → API Tokens |
| `R2_BUCKET_NAME` | `butwal-hacks-media` |

#### Upstash Redis
| Variable | Source |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Console → Redis Database |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Redis Database |

#### Email
| Variable | Source |
|---|---|
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `CONTACT_EMAIL` | `hello@butwalhacks.com` |

#### Analytics & Logging
| Variable | Source |
|---|---|
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog → Project Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` |
| `AXIOM_TOKEN` | Axiom → Settings → API Tokens |
| `AXIOM_DATASET` | `butwal-hacks` |

#### AI
| Variable | Source |
|---|---|
| `GROQ_API_KEY` | Groq Console → API Keys |

#### Site
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://butwalhacks.com` |
| `CRON_SECRET` | Random string — protects cron endpoints |

---

## 🧪 CI Pipeline

Defined in `.github/workflows/ci.yml`. Runs on every PR and push to `main`:

| Step | What it does |
|---|---|
| `lint` | ESLint check |
| `typecheck` | `tsc --noEmit` |
| `build` | `next build` |
| `test` | Vitest unit tests |
| `secrets-audit` | Scans for hardcoded secrets |
| `ai-review` | AI-powered code review |

### CI Secrets

Set these in **GitHub → Settings → Secrets and Variables → Actions**:

| Secret | Source |
|---|---|
| `AUTH0_M2M_CLIENT_ID` | Auth0 → Applications → M2M App |
| `AUTH0_M2M_CLIENT_SECRET` | Auth0 → Applications → M2M App |

---

## 📦 Release Checklist

### Before Merge
- [ ] `npx tsc --noEmit` passes in `my-app/`
- [ ] `npm run lint` — no new errors
- [ ] `npm run test` — all tests pass
- [ ] `npm run build` — build succeeds
- [ ] PR reviewed by at least one maintainer
- [ ] API changes documented in `public/swagger.json` if public

### After Deploy
- [ ] Smoke test: visit `https://butwalhacks.com`
- [ ] Smoke test: sign-in flow works
- [ ] Smoke test: profile page loads (`/p/BH-26-001`)
- [ ] Check Auth0 Logs for login errors
- [ ] Check Vercel Deployment logs for build errors

### Rollback
- **Vercel**: Go to Vercel Dashboard → Deployments → click "..." on the last good deploy → "Promote to Production"
- **Database**: Migrations are forward-only. To roll back:
  1. Write a new migration reversing the change
  2. Apply it: `supabase migration up --linked`
  3. Do NOT edit or delete existing migration files

---

## 🔐 Auth0 Administration

### Post-Login Action
The **Sync User to Supabase** action must be deployed and active in the Login flow:
- **Action**: POST to `https://butwalhacks.com/api/webhooks/auth0`
- **Payload**: `{ sub, email, name }`
- **Without this action**: New users will not get a Supabase profile and will redirect in a loop

### Application Settings
| Setting | Value |
|---|---|
| Callback URLs | `https://butwalhacks.com/auth/callback` |
| Logout URLs | `https://butwalhacks.com` |
| Web Origins | `https://butwalhacks.com` |

---

## 🗄️ Database Migrations

- **Canonical location**: `supabase/migrations/` (repo root)
- **Naming**: `NNN_descriptive_name.sql` (zero-padded, sequential)
- **Apply**: `supabase migration up --linked` (requires Supabase CLI)
- **Idempotency**: Always use `IF NOT EXISTS` for tables/columns/indexes

> ⚠️ The `my-app/supabase/migrations/` directory was a duplicate and has been **deleted**. All migrations live in `supabase/migrations/` (repo root). New migrations go there only.

---

## 🎯 Key URLs

| Resource | URL |
|---|---|
| Production site | https://butwalhacks.com |
| Vercel Dashboard | https://vercel.com/... |
| Auth0 Dashboard | https://manage.auth0.com |
| Supabase Dashboard | https://supabase.com/dashboard |
| Cloudinary Dashboard | https://cloudinary.com/console |
| Upstash Console | https://console.upstash.com |
| Resend Dashboard | https://resend.com |
| PostHog | https://us.posthog.com |
| Axiom | https://app.axiom.co |
| Groq Console | https://console.groq.com |
| Open Collective | https://opencollective.com/butwal-hacks |
| GitHub | https://github.com/Prarambha369/Butwal-Hacks |
