# Static marketing site on Cloudflare

> How the marketing site is built as a fully static site and served from Cloudflare Pages (Free plan) at www.butwalhacks.com, while the app stays on Vercel at app.butwalhacks.com. Covers the route split, the build, the rebuild workflow, DNS, what it costs, and rollback. Owned by the core maintainers. Security contact: tech@butwalhacks.com.

## Contents

- [The split](#the-split)
- [App maintenance mode](#app-maintenance-mode)
- [How the static build works](#how-the-static-build-works)
- [Keeping data pages fresh](#keeping-data-pages-fresh)
- [Free-plan impact](#free-plan-impact)
- [Preview](#preview)
- [Domains and DNS](#domains-and-dns)
- [Rollback](#rollback)
- [Changing the split](#changing-the-split)
- [Troubleshooting](#troubleshooting)

## The split

| Host | Serves | Runs on |
|------|--------|---------|
| `www.butwalhacks.com` (canonical); `butwalhacks.com` forwards to it at the registrar | Marketing pages: home, events and event pages, gallery and photo pages, about, blog, chapters, policies, legal, learn, docs, explore, projects list, support | Cloudflare **Pages** project `butwal-hacks-site` (direct upload, `butwal-hacks-site.pages.dev`). Static files only: no per-request code and no CPU time |
| `app.butwalhacks.com` | Auth, dashboards, portal, every `/api/*` route, certificates and verification, profiles (`/p`), widgets, `/teams`, `/transparency`, project detail pages, sponsor pages, claim and sign-in | Vercel project `butwal-hacks` |

The single source of truth is [`my-app/src/lib/static-site.ts`](../my-app/src/lib/static-site.ts):

- `APP_PREFIXES` and `APP_DETAIL_PARENTS` list the paths the app owns.
- `STATIC_EXCLUDED_ROUTE_DIRS` lists the route directories the static build leaves out.
- `staticRedirectsFile()` and `staticHeadersFile()` generate the static site's `_redirects` and `_headers`.
- `src/proxy.ts` calls `isAppPath()` so the app host keeps serving those paths instead of bouncing them back to the marketing host.

A request for an app path on the static site gets a redirect to `app.butwalhacks.com`: 307 for `/api/*` (so a POST stays a POST), 302 for everything else, query strings kept.

The few things a marketing page does in the browser go to the app with `fetch(appUrl(...), { credentials: APP_CREDENTIALS })` ([`lib/app-origin.ts`](../my-app/src/lib/app-origin.ts)): the session probe, chat, search, live stats, event registration, gallery paging (`GET /api/gallery`), homepage copy (`GET /api/site-content`), feedback (`POST /api/feedback`), testimonials (`POST /api/testimonials`) and project likes (`POST /api/projects/like`). On Vercel `NEXT_PUBLIC_APP_ORIGIN` is unset, so these stay same-origin and nothing changes. The session cookie is scoped to `butwalhacks.com` ([`lib/cookie-domain.ts`](../my-app/src/lib/cookie-domain.ts)), and the app answers CORS only for the marketing origins ([`lib/cors.ts`](../my-app/src/lib/cors.ts)).

**No server actions on marketing pages.** A static export fails if any `"use server"` module is in a marketing page's import graph. Public reads live in [`lib/public-reads/`](../my-app/src/lib/public-reads/) (plain server modules guarded by `server-only`, each keeping its public filter: published, active or approved). Writes from a marketing page go through an API route.

## App maintenance mode

`app.butwalhacks.com` is paused on Vercel until **26 December 2026**. While `APP_MAINTENANCE` in [`my-app/src/lib/app-maintenance.ts`](../my-app/src/lib/app-maintenance.ts) is set:

- every app path (`APP_PREFIXES` and `APP_DETAIL_PARENTS`, including `/sign-in`, `/dashboard`, `/portal`, `/p/*`, `/teams`, `/transparency`, `/api/*`) serves the "Under maintenance" page in place. It is a 200 rewrite in `_redirects`, so nothing redirects to the app;
- every page shows a site-wide banner linking to `/maintenance`;
- browser calls a marketing page makes to the app (session probe, search, chat, gallery paging past the first page, event registration, likes, feedback) fail quietly, and the page falls back to its signed-out or static state.

Only the static export is affected; Vercel builds never render the banner, and `/maintenance` is a 404 there.

**To end maintenance:** set `APP_MAINTENANCE` to `null`, merge to `main` and let the workflow redeploy. App paths then 302 to `app.butwalhacks.com` again (307 for `/api`). Check sign-in end to end before announcing it.

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
5. Writes `_redirects` and `_headers` into `.static-build/out` and checks them against the Pages limits: 20,000 files, and 2,000 static plus 100 dynamic redirect rules (the site uses about 50).

The output is about 1,000 pages and 6,000 to 7,000 files. Server-only values are never inlined into client bundles. Before any manual deploy, scan the output for the service-role key, secret key and JWT secret values and do not deploy on a match.

Pages serves `/about` from `about.html`, redirects `/about/` to `/about`, and serves the exported `404.html` with a 404 status for unknown paths. There is no wrangler config file; the deploy passes everything on the command line:

```bash
npx wrangler pages deploy ../.static-build/out --project-name butwal-hacks-site --branch main
```

## Keeping data pages fresh

[`.github/workflows/static-site.yml`](../.github/workflows/static-site.yml) builds and deploys with `wrangler pages deploy`:

- on every push to `main`;
- on demand: Actions → Static site → Run workflow.

There is no scheduled rebuild. Events, photos and posts created in the app appear on the static site after the next push to `main` or a manual run. While the app is paused, nothing new is created there anyway.

It never runs on `pull_request`, because the build reads Supabase with the service-role key and the repository is public. With `STATIC_SITE_TARGET=production` it deploys the Pages production branch (`main`, served at `www.butwalhacks.com`); otherwise it deploys the noindexed `preview` branch.

What it needs (set in the repository):

| Name | Kind | Value |
|------|------|-------|
| `CLOUDFLARE_API_TOKEN` | Secret | Account API token scoped to **Cloudflare Pages: Edit** only |
| `STATIC_SUPABASE_URL`, `STATIC_SUPABASE_ANON_KEY` | Secrets | The **production** Supabase project's URL and anon key (the project Vercel production uses) |
| `STATIC_SUPABASE_SERVICE_ROLE_KEY` | Secret | That project's service-role key, used only for build-time reads; never shipped to the browser |
| `STATIC_CLOUDINARY_CLOUD_NAME`, `STATIC_CLOUDINARY_UPLOAD_PRESET` | Secrets | Public Cloudinary values (falls back to `NEXT_PUBLIC_CLOUDINARY_*`) |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | The Cloudflare account ID |
| `STATIC_SITE_TARGET` | Variable | `production` to deploy `www`; anything else deploys the preview |
| `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Variables | Optional; analytics on the static site |

The `STATIC_*` Supabase secrets are separate on purpose: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` point CI and the tests at a non-production database, and a build against that database fails (missing tables and columns). Without the token, the account ID or any `STATIC_SUPABASE_*` secret, the workflow skips itself. A failed build never deploys, so the last good deployment keeps serving.

## Free-plan impact

| Item | Cost |
|------|------|
| Cloudflare Pages requests and bandwidth | Free and unlimited for static files |
| Cloudflare Pages builds | None used: the build runs in GitHub Actions and is uploaded directly (Free allows 500 builds a month, which direct uploads do not count against) |
| Cloudflare Pages files | About 6,200 files per deployment, under the 20,000-file Free limit; each file well under 25 MiB |
| GitHub Actions | About 5 minutes per run, only on pushes to `main` and manual runs; free on a public repository |
| Vercel Hobby | Every marketing page view, ISR render, image optimisation and proxy run for butwalhacks.com leaves Vercel. What remains is the app host, plus small cached API reads from marketing pages (`/api/site-content` is ISR; `/api/metrics` is cached for a day) |

## Preview

The `preview` branch of the Pages project, at `https://preview.butwal-hacks-site.pages.dev` (noindexed). Every deployment also gets its own `https://<hash>.butwal-hacks-site.pages.dev` URL.

```bash
cd my-app
npm run static:deploy:preview   # build with --noindex, then wrangler pages deploy --branch preview
```

Known preview limits: browser calls to the app from `pages.dev` are cross-site. The session cookie is not sent, so the page shows signed-out, and CORS is refused unless `CORS_EXTRA_ORIGINS` on Vercel lists the preview origin. Pages, redirects and headers are fully testable.

## Domains and DNS

DNS for `butwalhacks.com` is managed at **Porkbun** only. Nothing in this repository or in Cloudflare changes it.

| Name | Record at Porkbun | Serves |
|------|-------------------|--------|
| `www` | CNAME `butwal-hacks-site.pages.dev` | The static site (custom domain `www.butwalhacks.com` on the Pages project; Cloudflare issues its certificate once the CNAME resolves) |
| `@` (apex) | Porkbun URL forwarding, permanent (301) to `https://www.butwalhacks.com`, with **Include the requested URI path** turned on, so `butwalhacks.com/events/x` lands on `www.butwalhacks.com/events/x` | Redirect only; the apex is not added to Pages |
| `app` | CNAME to Vercel (unchanged) | The app |

Mail (MX, SPF, DKIM, DMARC for Zoho, Resend and SES) and every other record stay as they are.

To check the custom domain: Cloudflare dashboard → Workers & Pages → `butwal-hacks-site` → Custom domains, or `GET /accounts/{account_id}/pages/projects/butwal-hacks-site/domains`. Its status moves from `pending` to `active` once the `www` CNAME resolves.

## Rollback

- **A bad deploy:** Workers & Pages → `butwal-hacks-site` → Deployments → pick the last good production deployment → Rollback. Rollbacks are instant.
- **Back to Vercel for the marketing site:** at Porkbun, point `www` back at Vercel (CNAME `cname.vercel-dns.com`) and set the apex forward or A record to Vercel, then re-add both domains to the Vercel project. The Vercel build still contains every marketing page. This only helps once the Vercel account is unpaused.

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
| `www.butwalhacks.com` shows a certificate or 522 error | The Pages custom domain is still `pending` | Check the `www` CNAME at Porkbun points at `butwal-hacks-site.pages.dev`, then wait for the domain to turn `active` |
| `wrangler pages deploy` fails with an authentication error | The token lacks Pages: Edit, or `CLOUDFLARE_ACCOUNT_ID` is wrong | Fix the secret or variable and run the workflow again |
| Browser console shows CORS errors from the static site | Origin not in `lib/cors.ts` | Production origins are built in; add previews through `CORS_EXTRA_ORIGINS` on Vercel |
