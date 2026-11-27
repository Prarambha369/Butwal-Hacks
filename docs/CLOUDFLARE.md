# Cloudflare Workers hosting

> How Butwal Hacks builds, deploys and runs on Cloudflare Workers (Free plan) with the OpenNext adapter, what each piece costs against the free allowances, and how to cut over from Vercel or roll back. Owned by the core maintainers. Security contact: tech@butwalhacks.com.

## Contents

- [Why](#why)
- [Files](#files)
- [Commands](#commands)
- [Environment variables](#environment-variables)
- [Free-plan budget](#free-plan-budget)
- [Images](#images)
- [Caching and ISR](#caching-and-isr)
- [Cron jobs](#cron-jobs)
- [Known gaps](#known-gaps)
- [Cutover from Vercel](#cutover-from-vercel)
- [Rollback to Vercel](#rollback-to-vercel)

## Why

The Vercel Hobby project was paused for Fluid Active CPU. Workers Free gives 100,000 requests a day and 10 ms of CPU per request at no cost, and static assets are served without running the Worker at all. The owner decided on 2026-11-26 to move permanently.

## Files

| File | Purpose |
|------|---------|
| `my-app/wrangler.jsonc` | Worker config: `nodejs_compat`, static assets binding, KV/D1 cache bindings, cron triggers, the `preview` environment |
| `my-app/open-next.config.ts` | OpenNext adapter config: KV incremental cache behind the Cache API, D1 tag cache, in-memory revalidation queue |
| `my-app/worker.ts` | Worker entry: the OpenNext handler plus a `scheduled()` handler for the two crons |
| `my-app/src/lib/image-loader.ts` | `next/image` loader used off Vercel (Cloudinary/Unsplash do the resizing) |
| `my-app/cloudflare/critters-stub/` | Empty `critters` package so the Node.js middleware bundler can resolve Next's optional import |

Generated and ignored by git: `my-app/.open-next/`, `my-app/.wrangler/`, `.dev.vars*`.

## Commands

Run from the repo root or `my-app/`.

| Command | What it does |
|---------|--------------|
| `npm run dev` | Unchanged `next dev` on http://localhost:3000 |
| `npm run cf:build` | `next build` + OpenNext bundle into `my-app/.open-next/` |
| `npm run cf:preview` | Build, then serve in local workerd (`wrangler dev`) |
| `npm run cf:deploy:preview` | Build and deploy the `butwal-hacks-preview` Worker |
| `npm run cf:deploy` | Build and deploy the production `butwal-hacks` Worker |
| `npm run cf:typegen` | Regenerate `cloudflare-env.d.ts` from the bindings |

Wrangler needs a login once per machine: `cd my-app && npx wrangler login` (or a `CLOUDFLARE_API_TOKEN` in CI).

## Environment variables

There are three kinds, and mixing them up either breaks the build or leaks a secret.

**1. Build-time public values (`NEXT_PUBLIC_*`).** Inlined into the client bundle by `next build`, so they must exist when you build, in `my-app/.env.production.local` (gitignored) or the CI build environment. Setting them as Worker secrets afterwards does nothing.

```text
NEXT_PUBLIC_SITE_URL                 # https://butwalhacks.com (preview: the workers.dev URL)
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_PROFILE_ROUTE            # optional
```

**2. Server secrets.** Never put these in a `.env*` file for a Cloudflare build: OpenNext copies every value from `.env*` files into the Worker bundle (`.open-next/cloudflare/next-env.mjs`). Load them as Worker secrets instead. Pages that are prerendered at build time also read Supabase, so pass the Supabase server keys to the build as plain process environment (shell or CI env), not a file.

Template for `wrangler secret bulk` (names only; fill in a file outside the repo, upload, then delete it):

```json
{
  "AUTH0_SECRET": "",
  "AUTH0_DOMAIN": "",
  "AUTH0_CLIENT_ID": "",
  "AUTH0_CLIENT_SECRET": "",
  "APP_BASE_URL": "",
  "AUTH0_M2M_CLIENT_ID": "",
  "AUTH0_M2M_CLIENT_SECRET": "",
  "AUTH0_MANAGEMENT_API_AUDIENCE": "",
  "AUTH0_WEBHOOK_SECRET": "",
  "SUPABASE_URL": "",
  "SUPABASE_SERVICE_ROLE_KEY": "",
  "SUPABASE_SECRET_KEY": "",
  "SUPABASE_ANON_KEY": "",
  "SUPABASE_PUBLISHABLE_KEY": "",
  "SUPABASE_JWT_SECRET": "",
  "UPSTASH_REDIS_REST_URL": "",
  "UPSTASH_REDIS_REST_TOKEN": "",
  "CLOUDINARY_API_KEY": "",
  "CLOUDINARY_API_SECRET": "",
  "RESEND_API_KEY": "",
  "GROQ_API_KEY": "",
  "GEMINI_API_KEY": "",
  "GOOGLE_API_KEY": "",
  "GOOGLE_CLIENT_ID": "",
  "GOOGLE_CLIENT_SECRET": "",
  "CRON_SECRET": "",
  "HEALTH_CHECK_TOKEN": "",
  "KEEP_ALIVE_SECRET": "",
  "OC_WEBHOOK_SECRET": "",
  "TRUST_MARKER_PRIVATE_KEY": "",
  "CONTACT_EMAIL": "",
  "SLACK_WEBHOOK_URL": "",
  "SLACK_EMAIL_CHANNEL": "",
  "DISCORD_WEBHOOK_URL": "",
  "SENTRY_DSN": ""
}
```

Drop any key you do not use (an empty string is still a value). Then:

```bash
cd my-app
npx wrangler secret bulk /path/outside/repo/secrets.json --env preview   # preview Worker
npx wrangler secret bulk /path/outside/repo/secrets.json                 # production Worker
rm /path/outside/repo/secrets.json
```

`APP_BASE_URL` must match the host the Worker answers on (the workers.dev URL for preview, `https://butwalhacks.com` in production) or Auth0 callbacks fail.

**3. Plain vars.** Non-secret runtime values live in `vars` in `wrangler.jsonc`. Today that is only `DEPLOY_ENV` (`production` / `preview`), which `isProduction()` in `src/lib/utils.ts` reads the way it reads `VERCEL_ENV` on Vercel.

Vercel stores most values as *Sensitive*, so `vercel env pull` cannot export them. Copy them from the original source (Auth0, Upstash, Cloudinary, Resend dashboards) or your password manager.

## Free-plan budget

| Resource | Free allowance | How we stay inside it |
|----------|----------------|-----------------------|
| Worker requests | 100,000/day | Static files (`/_next/static`, `/public`) are served by the assets binding and do not count as Worker invocations |
| CPU | 10 ms/request | Cache interception answers ISR/SSG hits before the Next.js server loads; only uncached dynamic routes render |
| Script size | 64 MiB uncompressed (no gzip limit since 2026-09-04) | About 16 MiB; `npm run cf:build` fails above 64 MiB. See [Script size](#script-size) |
| Startup | 1 s to parse and run global scope | Minified bundle; Sentry's workerd build instead of its Node build |
| KV | 100k reads, 1k writes/day | Incremental cache only; the Cache API regional cache absorbs repeat reads on a custom domain. **Risk:** each ISR regeneration is one write, and pages with `revalidate = 60` can regenerate up to 1,440 times a day per path. See [Caching and ISR](#caching-and-isr) |
| D1 | 5M reads, 100k writes/day | Tag cache for `revalidatePath`/`revalidateTag` |
| Cron triggers | 5/account | Two used (production only) |
| Images | — | No Cloudflare Images; Cloudinary resizes |

The Cache API is a no-op on `*.workers.dev`, so the preview Worker reads KV on every cached hit. That is fine at preview traffic. On the custom domain the regional cache takes over.

Pages marked `force-dynamic` (for example `/events`, `/gallery`, `/teams`, every dashboard route) render on each request and are the main CPU cost. Moving the public ones to ISR is the biggest lever if the 10 ms limit is hit.

## Script size

The only Worker size limit is 64 MiB **uncompressed**, on Free and Paid alike. Cloudflare removed the old 3 MiB (Free) / 10 MiB (Paid) gzip limits on 2026-09-04 ([changelog](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/)), so older guides that quote 3 MiB are out of date. `npm run cf:build` reads wrangler's dry-run `Total Upload` and fails above 64 MiB, warning above 32 MiB.

Size still affects cold starts (1 s budget to parse global scope). Measured on 2026-11-27, uncompressed / gzip:

| Build | Size |
|-------|------|
| Turbopack, Sentry Node build, not minified | 35.6 MiB / 7.24 MiB |
| Sentry swapped for its workerd build | 23.7 MiB / 4.59 MiB |
| + `minify: true` in wrangler.jsonc (shipped) | 16.4 MiB / 4.02 MiB |

A two-Worker split was tried and dropped: each Worker carries its own copy of the Next.js server runtime and the proxy, so the API/dashboard half alone was 3.4 MiB gzip, and the split added a second secret set and a cross-Worker hop for no size benefit.

`npx wrangler check startup --env preview` measured about 490 ms of local startup on 2026-11-27, almost all of it V8 parsing and compiling the 16 MiB script rather than app code. That is inside the 1 s budget, but bundle growth eats directly into it, so re-run the check after adding large dependencies. Levers, largest first: rewrite the Node `proxy.ts` as Edge `middleware.ts` (OpenNext bundles the Node proxy twice), keep recharts and posthog out of SSR, replace the Cloudinary SDK with Web Crypto signing, and move PDF generation out of the Worker.

## Images

Vercel's image optimiser is replaced by `src/lib/image-loader.ts` on non-Vercel builds:

- `res.cloudinary.com` URLs get `w_<width>,c_limit,f_auto,q_auto` appended as the last transformation, so Cloudinary resizes and serves AVIF/WebP. Existing crops in the URL still apply first.
- `images.unsplash.com` gets `w`, `q` and `auto=format`.
- Everything else (files in `/public`, avatars) is served as is.

Each distinct width Cloudinary generates counts as a transformation against the Cloudinary free plan's credits. `next/image` asks for a handful of widths per image, and derived images are cached by Cloudinary after the first request.

## Caching and ISR

`open-next.config.ts` wires:

- **Incremental cache:** KV (`NEXT_INC_CACHE_KV`) wrapped in the regional Cache API (`long-lived`). R2 is not used because it needs the R2 subscription.
- **Tag cache:** D1 (`NEXT_TAG_CACHE_D1`), so server actions that call `revalidatePath` invalidate pages.
- **Queue:** in-memory, with `WORKER_SELF_REFERENCE` for background revalidation.

`opennextjs-cloudflare deploy` seeds KV with the prerendered pages and creates the D1 table on each deploy. Seeding writes one key per prerendered page, so it also spends the daily 1,000-write KV budget.

**KV write budget.** Every ISR regeneration is a KV write. Pages with `revalidate = 60` (`/explore`, `/sponsors`, `/gallery/[id]`, `/p/[slug_id]`, and more after PR #70) can each regenerate up to 1,440 times a day per path once crawlers find them. When KV refuses a write, the page is still served but re-renders on the next request, which costs CPU instead. Before cutover, lengthen those intervals to an hour or more and rely on the `revalidatePath` calls the server actions already make for freshness.

## Cron jobs

`vercel.json` crons become Worker cron triggers in `wrangler.jsonc`. `worker.ts` maps each schedule to the same route and sends `Authorization: Bearer $CRON_SECRET` through the self-referencing service binding:

| Schedule (UTC) | Route |
|----------------|-------|
| `0 6 * * *` | `/api/health` |
| `17 7 * * *` | `/api/calendar/google/cron` |

The preview Worker has no crons.

## Known gaps

- **Node.js `proxy.ts`** runs through OpenNext's Node middleware support, which OpenNext marks experimental on Cloudflare.
- **Hostname routing:** `src/proxy.ts` routes by host (`butwalhacks.com`, `app.`, `calendar.`, chapter subdomains). On `*.workers.dev` none match, so the proxy falls through and pages rely on their own guards. `/portal/*` redirects to `app.butwalhacks.com`.
- **Sentry:** server-side `@sentry/nextjs` assumes Node and its HTTP instrumentation. See the PR for what runs on Workers.
- **`/api/health` version** reads `VERCEL_GIT_COMMIT_SHA` and shows `dev` on Cloudflare.

## Cutover from Vercel

Do these in order. Nothing here is automated.

1. **Secrets:** load every server secret on the production Worker (`wrangler secret bulk`, see above), with `APP_BASE_URL=https://butwalhacks.com`.
2. **Build env:** build with the production `NEXT_PUBLIC_*` values and the Supabase server keys in the process env, then `npm run cf:deploy`.
3. **Auth0 (dashboard):** add `https://butwalhacks.com/auth/callback`, `https://app.butwalhacks.com/auth/callback` and `https://calendar.butwalhacks.com/auth/callback` to Allowed Callback URLs if not already there (they are, while the hostnames stay the same). For the preview, add `https://butwal-hacks-preview.butwalhacks.workers.dev/auth/callback` to Allowed Callback URLs and the bare origin to Allowed Logout URLs and Allowed Web Origins.
4. **DNS:** move the `butwalhacks.com` nameservers to Cloudflare (or, if the zone is already on Cloudflare, remove the Vercel records). Then add Custom Domains on the `butwal-hacks` Worker for `butwalhacks.com`, `www`, `app`, `calendar` and the chapter subdomains. Custom Domains are free.
5. **Webhooks:** point Auth0 and Open Collective webhooks at the same paths (the hostname does not change, so usually nothing to do).
6. **Watch:** Workers dashboard → `butwal-hacks` → Observability for errors and CPU time for 24 hours.
7. **Vercel:** keep the project paused but not deleted for at least two weeks.

## Rollback to Vercel

1. Remove the Worker Custom Domains (or point DNS back at Vercel: `A 76.76.21.21`, `CNAME cname.vercel-dns.com`).
2. Unpause the Vercel project (Hobby pause lifts on its own at the next billing cycle) and redeploy `main`.
3. Nothing in the app needs reverting: on Vercel `VERCEL=1` is set at build, so Vercel Analytics, Speed Insights and the Vercel image optimiser come back automatically.
