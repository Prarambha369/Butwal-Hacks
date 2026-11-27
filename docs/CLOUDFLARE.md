# Static marketing site on Cloudflare

> How butwalhacks.com is built as a fully static site and served from Cloudflare Workers static assets (Free plan), while the app stays on Vercel at app.butwalhacks.com. Covers the route split, the build, the hourly rebuild, what it costs, and the cutover and rollback steps. Owned by the core maintainers. Security contact: tech@butwalhacks.com.

## Contents

- [The split](#the-split)
- [How the static build works](#how-the-static-build-works)
- [Keeping data pages fresh](#keeping-data-pages-fresh)
- [Free-plan impact](#free-plan-impact)
- [Preview](#preview)
- [Cutover](#cutover)
- [Rollback](#rollback)
- [Changing the split](#changing-the-split)
- [Troubleshooting](#troubleshooting)

## The split

| Host | Serves | Runs on |
|------|--------|---------|
| `butwalhacks.com`, `www.butwalhacks.com` | Marketing pages: home, events and event pages, gallery and photo pages, about, blog, chapters, policies, legal, learn, docs, explore, projects list, support | Cloudflare Workers **static assets** (Worker `butwal-hacks-site`). No Worker script, so no per-request code and no CPU time |
| `app.butwalhacks.com` | Auth, dashboards, portal, every `/api/*` route, certificates and verification, profiles (`/p`), widgets, `/teams`, `/transparency`, project detail pages, sponsor pages, claim and sign-in | Vercel project `butwal-hacks` |

The single source of truth is [`my-app/src/lib/static-site.ts`](../my-app/src/lib/static-site.ts):

- `APP_PREFIXES` and `APP_DETAIL_PARENTS` list the paths the app owns.
- `STATIC_EXCLUDED_ROUTE_DIRS` lists the route directories the static build leaves out.
- `staticRedirectsFile()` and `staticHeadersFile()` generate the static site's `_redirects` and `_headers`.
- `src/proxy.ts` calls `isAppPath()` so the app host keeps serving those paths instead of bouncing them back to the marketing host.

A request for an app path on the static site gets a redirect to `app.butwalhacks.com`: 307 for `/api/*` (so a POST stays a POST), 302 for everything else, query strings kept.

The few things a marketing page does in the browser go to the app with `fetch(appUrl(...), { credentials: APP_CREDENTIALS })` ([`lib/app-origin.ts`](../my-app/src/lib/app-origin.ts)): the session probe, chat, search, live stats, event registration, gallery paging (`GET /api/gallery`), homepage copy (`GET /api/site-content`), feedback (`POST /api/feedback`), testimonials (`POST /api/testimonials`) and project likes (`POST /api/projects/like`). On Vercel `NEXT_PUBLIC_APP_ORIGIN` is unset, so these stay same-origin and nothing changes. The session cookie is scoped to `butwalhacks.com` ([`lib/cookie-domain.ts`](../my-app/src/lib/cookie-domain.ts)), and the app answers CORS only for the marketing origins ([`lib/cors.ts`](../my-app/src/lib/cors.ts)).

**No server actions on marketing pages.** A static export fails if any `"use server"` module is in a marketing page's import graph. Public reads live in [`lib/public-reads/`](../my-app/src/lib/public-reads/) (plain server modules guarded by `server-only`, each keeping its public filter: published, active or approved). Writes from a marketing page go through an API route.

## How the static build works

```bash
cd my-app
# Supabase URL and service-role key must come from the process environment,
# never a .env file. The script refuses to run without them.
node scripts/build-static.mjs [--app-origin URL] [--site-url URL] [--noindex]
```

[`scripts/build-static.mjs`](../my-app/scripts/build-static.mjs):

1. Copies `my-app` to `<repo>/.static-build`, skipping `node_modules`, build output, tests and every `.env*` file.
2. Deletes the app-only route directories and `src/proxy.ts`.
3. Runs `next build` with `BUILD_TARGET=static`, which turns on `output: "export"` and the Cloudinary image loader in `next.config.ts`. Detail pages (events, chapters, gallery photos) list every public row in `generateStaticParams` ([`lib/static-params.ts`](../my-app/src/lib/static-params.ts)); on Vercel the same functions return `[]` and the pages stay ISR.
4. Fails the build if a page reports that Supabase is not configured, and `degradeOnReadError()` is off for this target, so a failed read fails the build instead of publishing an empty page. The last good deploy keeps serving.
5. Writes `_redirects` and `_headers` into `.static-build/out` and checks the file count against the Free limit.

The output is about 1,000 pages and 6,000 to 7,000 files. Server-only values are never inlined into client bundles. Before any manual deploy, scan the output for the service-role key, secret key and JWT secret values and do not deploy on a match.

`my-app/wrangler.static.jsonc` is assets-only (no `main`), with `html_handling: auto-trailing-slash` and `not_found_handling: 404-page`. It has no routes or custom domains; those are attached at cutover.

## Keeping data pages fresh

[`.github/workflows/static-site.yml`](../.github/workflows/static-site.yml) rebuilds and deploys:

- on every push to `main`;
- hourly (`17 * * * *`), for new events, photos and posts made in the app;
- on demand (Actions → Static site → Run workflow, or a `repository_dispatch` of type `static-site-rebuild`).

It never runs on `pull_request`, because the build reads Supabase with the service-role key and the repository is public. Until the repository variable `STATIC_SITE_TARGET` is `production`, it deploys the preview Worker.

Repository secrets it needs (owner action):

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | API token with **Account → Workers Scripts: Edit** on the Butwal Hacks account (nothing else) |
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account ID |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key, used only for build-time reads |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase values |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Public Cloudinary values |

Repository variables: `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, and `STATIC_SITE_TARGET` (set at cutover). Without the first two secrets the workflow skips itself.

Edits made in the app show on the static site at the next hourly rebuild, up to about an hour later. To publish sooner, run the workflow by hand.

## Free-plan impact

| Item | Cost |
|------|------|
| Cloudflare static asset requests | Free and unlimited on Workers Free; no Worker invocation, no CPU time |
| Cloudflare asset storage | About 7,000 files per version, under the 20,000-file Free limit; each file well under 25 MiB |
| GitHub Actions | About 4 minutes per run. Hourly plus pushes is about 3,000 minutes a month, free on a public repository |
| Vercel Hobby | Every marketing page view, ISR render, image optimisation and proxy run for butwalhacks.com leaves Vercel. What remains is the app host, plus small cached API reads from marketing pages (`/api/site-content` is ISR; `/api/metrics` is cached for a day) |

## Preview

`https://butwal-hacks-site-preview.butwalhacks.workers.dev` (Worker `butwal-hacks-site-preview`, `noindex`):

```bash
cd my-app
node scripts/build-static.mjs --noindex --site-url https://butwal-hacks-site-preview.butwalhacks.workers.dev
npx wrangler deploy -c wrangler.static.jsonc --env preview
```

Known preview limits: browser calls to the app from `workers.dev` are cross-site. The session cookie is not sent, so the page shows signed-out, and CORS is refused unless `CORS_EXTRA_ORIGINS` on Vercel lists the preview origin. Pages, redirects and headers are fully testable.

## Cutover

Owner's call. Nothing here is done automatically.

1. Merge the PR, so `app.butwalhacks.com` serves the CORS headers, `/api/gallery`, `/api/site-content`, `/api/feedback` and `/api/testimonials`, and keeps the app paths in `isAppPath()`.
2. Add the repository secrets and variables above, run the workflow once, and check the preview.
3. Confirm `app.butwalhacks.com` is a working domain on the Vercel project, and that Auth0's allowed callback, logout and web origin URLs include `https://app.butwalhacks.com`. Sign-in starts on the app host after cutover.
4. Set `STATIC_SITE_TARGET=production` and run the workflow, which deploys `butwal-hacks-site`.
5. DNS (zone on Cloudflare):
   - In Workers → `butwal-hacks-site` → Settings → Domains & Routes, add custom domains `butwalhacks.com` and `www.butwalhacks.com`. Cloudflare creates the records and certificates. First remove the existing apex and `www` records that point at Vercel, or the custom domain cannot be added.
   - Leave `app.butwalhacks.com` pointing at Vercel (CNAME `cname.vercel-dns.com`, DNS only).
   - Remove `butwalhacks.com` and `www` from the Vercel project's domains, so Vercel stops issuing certificates for them.
6. Check: `/`, an event page, `/gallery`, `/dashboard` (should redirect to the app), sign-in and sign-out, and the CSP and HSTS headers.

## Rollback

Point the apex and `www` back at Vercel: remove the custom domains from `butwal-hacks-site`, recreate the Vercel records (A `76.76.21.21` for the apex, CNAME `cname.vercel-dns.com` for `www`), and re-add both domains to the Vercel project. The Vercel build still contains every marketing page, so nothing else changes. Set `STATIC_SITE_TARGET` back to `preview`.

## Changing the split

- **Moving a page to the app:** add its prefix to `APP_PREFIXES` (or `APP_DETAIL_PARENTS`) and its route directory to `STATIC_EXCLUDED_ROUTE_DIRS`, and extend `src/lib/__tests__/static-site.test.ts`.
- **A new marketing page** must export statically: no `searchParams`, `cookies()`, `headers()` or session reads at render time; data reads from `lib/public-reads/`; a dynamic segment lists its params through `lib/static-params.ts`.
- **A new browser call to the app** uses `appUrl()` and `APP_CREDENTIALS`, and the route adds `withCors` plus `export const OPTIONS = corsPreflight` (or `withPublicCors` for public, uncredentialed reads). The CSP's `connect-src` already allows `https://app.butwalhacks.com`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Server Actions are not supported with static export` | A marketing page imports a `"use server"` module, directly or through a component | Move the read to `lib/public-reads/`, or send the write through an API route. Check `.next/server/server-reference-manifest.json` in `.static-build` to find every one at once |
| `Page with dynamic segment is missing generateStaticParams` | A new dynamic marketing route | Add it to `lib/static-params.ts`, or move it to the app |
| Build refuses to start | Supabase URL or service key missing from the environment | Export them in the shell or CI step; `.env` files are skipped on purpose |
| Marketing page shows signed-out on the real domain | Session cookie not on `Domain=butwalhacks.com` | Check `APP_BASE_URL` on Vercel is the `butwalhacks.com` app origin |
| Browser console shows CORS errors from the static site | Origin not in `lib/cors.ts` | Production origins are built in; add previews through `CORS_EXTRA_ORIGINS` on Vercel |
