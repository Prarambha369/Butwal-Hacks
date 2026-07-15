# Deployment

## Prerequisites

- **Vercel** account (free tier)
- **Auth0** account (free tier: 7,000 active users)
- **Supabase** project (free tier)
- **Cloudinary** account (free tier)
- **Upstash Redis** database (free tier)
- **Resend** account (free tier: 100 emails/day)

---

## 1. Vercel Deployment

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository.
2. Select the `Butwal-Hacks` repository.
3. Vercel will auto-detect Next.js and use the root `package.json`.

### Step 2: Configure Subdomains

1. In Vercel Dashboard → Project → Settings → Domains.
2. Add `butwalhacks.com` as a custom domain (primary).
3. Add `app.butwalhacks.com` as a subdomain.
4. Update your DNS: point both to Vercel's nameservers.

> **Note:** The `proxy.ts` middleware handles subdomain routing. When deployed, it reads the `VERCEL_URL` environment variable to determine the subdomain.

### Step 3: Set Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add all variables from `.env.example`.

### Step 4: Deploy

Push to `main` to trigger automatic deployment, or use Vercel's dashboard to trigger a manual deploy.

---

## 2. Auth0 Setup

### Step 1: Create Application

1. Go to [manage.auth0.com](https://manage.auth0.com).
2. Create a **Regular Web Application**.
3. Note the **Domain**, **Client ID**, and **Client Secret**.

### Step 2: Configure Callback URLs

```
Allowed Callback URLs: https://butwalhacks.com/auth/callback
Allowed Logout URLs:   https://butwalhacks.com
Allowed Web Origins:   https://butwalhacks.com
```

For local development, add:
```
http://localhost:3000/auth/callback
http://localhost:3000
```

### Step 3: Create M2M Application (CI)

1. Create a **Machine-to-Machine Application**.
2. Authorize it for **Auth0 Management API** with scopes:
   - `read:users`, `update:users`, `delete:users`, `create:users`
   - `read:actions`, `update:actions`, `delete:actions`, `create:actions`
3. Set `AUTH0_M2M_CLIENT_ID` and `AUTH0_M2M_CLIENT_SECRET` in CI secrets.

### Step 4: Deploy Post-Login Action

1. Go to Auth0 → Actions → Flows → Login.
2. Add the Post-Login Action from `scripts/deploy-auth0-action.mjs`.
3. This action syncs user profiles to Supabase on every login.

### Step 5: Configure Auth0 Webhook

1. Go to Auth0 → Actions → Flows → Post-User Registration.
2. Add a webhook to `https://butwalhacks.com/api/webhooks/auth0`.
3. Set `AUTH0_WEBHOOK_SECRET` in your environment.

---

## 3. Supabase Setup

### Step 1: Create Project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Note the **Project URL**, **Anon Key**, and **Service Role Key**.

### Step 2: Run Migrations

```bash
# From the repo root
cd my-app
node scripts/apply-migrations.mjs
```

This applies all 88+ migration files from `supabase/migrations/`.

### Step 3: Disable Supabase Auth

Since we use Auth0 for authentication:
1. Go to Supabase Dashboard → Authentication → Settings.
2. Disable all built-in auth providers.
3. The database is accessed via service role key only.

---

## 4. Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) and create an account.
2. Note the **Cloud Name**, **API Key**, and **API Secret**.
3. Create an upload preset called `butwal_hacks_upload`.

---

## 5. Upstash Redis Setup

1. Go to [upstash.com](https://upstash.com) and create a Redis database.
2. Note the **REST URL** and **REST Token**.
3. Used for rate limiting all public API endpoints.

---

## 6. Environment Variables Summary

| Variable | Source | Required |
|----------|--------|----------|
| `AUTH0_SECRET` | `openssl rand -hex 32` | Yes |
| `AUTH0_DOMAIN` | Auth0 Dashboard | Yes |
| `AUTH0_CLIENT_ID` | Auth0 Dashboard | Yes |
| `AUTH0_CLIENT_SECRET` | Auth0 Dashboard | Yes |
| `AUTH0_BASE_URL` | `https://your-domain.com` (dev: `http://localhost:3000`) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard | Yes |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Settings | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Dashboard | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Dashboard | Yes |
| `RESEND_API_KEY` | Resend Dashboard | Yes |
| `CONTACT_EMAIL` | `hello@butwalhacks.com` | Yes |
| `SENTRY_DSN` | Sentry Dashboard | Prod only |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog Dashboard | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog Dashboard | Optional |
| `GROQ_API_KEY` | Groq Console | Optional |
