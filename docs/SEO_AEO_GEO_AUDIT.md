# Butwal Hacks — SEO / AEO / GEO Audit Report

**Date:** 2026-10-16
**Repository:** Butwal-Hacks (main branch)
**Scope:** Public-facing Next.js 16 App Router application
**Baseline:** All four verification gates pass (typecheck, lint, test @ 1618/110 files, build)

> **Historical counts.** The test totals in this report are a point-in-time record of the
> session described below, not the current suite. For live numbers see the
> [README](../README.md#by-the-numbers).

---

## A. Executive Summary

The site has a strong SEO foundation: the Next.js Metadata API is used consistently, `buildPageMetadata()` centralizes canonical URL / Open Graph / Twitter generation, `robots.ts` allows AI crawlers explicitly, `sitemap.ts` discovers DB-backed URLs, JSON-LD is present on homepage, event, blog, chapter, and festival pages, and `llms.txt` / `llms-full.txt` are shipped with a link-integrity test.

**The most serious finding is not a conventional SEO defect.** Every DB-backed query in `sitemap.ts` referenced a column that does not exist in the canonical schema — `events.status` and `updated_at` on all four tables. PostgREST rejects unknown columns, the error was swallowed by a bare `catch {}`, and the result was that **no database event, project, public profile, or team URL was ever advertised to crawlers**. The sitemap still returned valid XML built from static and content-derived entries, so the failure was invisible from the outside. All nine fixes below are code-verified against `supabase/migrations/` and covered by regression tests.

Confirmed defects, in priority order:

1. **Sitemap total data loss (P1)** — nonexistent `status`/`updated_at` columns aborted the DB query; all four DB-backed URL families were silently dropped.
2. **Silent degradation (P3)** — the `catch {}` that hid the above is itself a defect; schema drift now logs instead of vanishing.
3. **Draft-event exposure (P2)** — events index, event detail page, and the sitemap had no `is_published` filter, so unpublished events were publicly listed and viewable by slug.
4. **Metadata inconsistency (P2)** — mentors and `projects/[id]` did not use `buildPageMetadata()`; every project page shared identical metadata and a canonical pointing at `/projects`.
5. **Duplicate-content URL variant (P3)** — `/transparency?view=report` was listed alongside `/transparency`.
6. **Canonical host mismatch in JSON-LD (P3)** — explore page hardcoded the apex host instead of `SITE_URL`.

Verified as **not** defects: festival and chapter routes already generate correct dynamic metadata via `buildPageMetadata()`; blog routes already filter `is_published` and produce unique titles/descriptions/canonicals (the absent `keywords` field is not a ranking factor); `hreflang` is correctly `en` + `x-default` since no `/ne` route exists.

---

## B. File-by-File Findings

| ID | Priority | Category | File | Lines | Evidence | Impact | Recommended Change | Status |
|----|----------|----------|------|-------|----------|--------|-------------------|--------|
| SEO-01 | P2 | Metadata | `my-app/src/app/(main)/mentors/page.tsx` | 8-11 | Uses raw `Metadata` object instead of `buildPageMetadata()`. Missing `alternates.canonical`, `openGraph`, `twitter`, `robots`, `keywords`. Inconsistent with all other public pages. | Search engines may not associate correct canonical URL; social previews inconsistent. | Replaced raw object with `buildPageMetadata({...})` call. | Fixed |
| SEO-02 | P2 | Metadata | `my-app/src/app/(main)/projects/[id]/page.tsx` | 13-15 | `generateMetadata()` takes no `params`, returns static title/description with `path: "/projects"` instead of the project-specific path. Every project page shares identical metadata. | Duplicate metadata across all project detail pages; canonical URL always points to `/projects` not `/projects/[id]`. | `generateMetadata` now accepts `params`, fetches project, returns dynamic metadata with `path: "/projects/${id}"`. | Fixed |
| SEO-03 | P3 | Structured Data | `my-app/src/app/(main)/explore/page.tsx` | 43-54 | JSON-LD `@id`/`url` hardcoded as `https://butwalhacks.com/explore` (apex host) instead of `SITE_URL` constant (`www.butwalhacks.com`). | Canonical host mismatch in structured data; sitemap uses www but JSON-LD uses apex. | Replaced hardcoded URL with `` `${SITE_URL}/explore` ``. | Fixed |
| SEO-04 | P2 | Data Exposure | `my-app/src/app/(main)/events/page.tsx` | 28-31 | No `.eq("is_published", true)` filter. All events including drafts/unpublished are returned. | Unpublished events appear on public events page and in sitemap. | Added `.eq("is_published", true)` to the query. | Fixed |
| SEO-05 | P2 | Data Exposure | `my-app/src/app/(main)/events/[slug]/page.tsx` | 54-58 | No `.eq("is_published", true)` filter on detail page. | Anyone who knows a slug can view an unpublished/draft event. | Added `.eq("is_published", true)` to both `generateMetadata` and page component queries. | Fixed |
| SEO-06 | P3 | Sitemap | `my-app/src/app/sitemap.ts` | 40 | Lists `${siteUrl}/transparency?view=report` as a separate entry with `changeFrequency: 'yearly'`. | Query-param URL variant creates duplicate content; splits ranking signals. | Removed the `?view=report` entry; the base `/transparency` URL already covers it. | Fixed |
| SEO-07 | P1 | Sitemap / Correctness | `my-app/src/app/sitemap.ts` | 119-136 | The DB-backed events query filtered `.not('status', 'eq', 'archived')` and selected `updated_at`. **Neither column exists on `events` in any migration** — verified: `001` creates the table without either, `003` adds only `slug`, `050` adds only `chapter_id`. PostgREST rejects unknown columns with `42703`, which threw inside the surrounding `try`. The `catch {}` swallowed it silently. | **The entire DB-backed half of the sitemap was missing** — all DB events, projects, public profiles (`/p/[bh_id]`), and teams never entered the file, while it still emitted valid XML from static + content entries. No project, profile, team, or database event was being advertised to crawlers at all. | Removed the nonexistent `status` filter, switched to `created_at`, added `.eq('is_published', true)`, and logged the swallowed error. | Fixed |
| SEO-08 | P2 | Sitemap / Correctness | `my-app/src/app/sitemap.ts` | 139-184 | Projects, public profiles, and teams queries each selected `updated_at`. None of those three tables has an `updated_at` column in any migration — `001` creates all three with `created_at` only. Same `42703` abort, same silent `catch {}`. | Contributed to the same total loss of DB-backed sitemap entries as SEO-07. | Switched all three to `created_at`, used for both `lastModified` and ordering. | Fixed |
| SEO-09 | P3 | Observability | `my-app/src/app/sitemap.ts` | 185-199 | The DB failure path was `catch { /* Silently fall back */ }` — no log. This is the mechanism that let SEO-07/08 persist unnoticed: the sitemap kept producing plausible-looking XML, so nothing surfaced. | A schema/query mismatch degrades silently to a smaller sitemap with no signal. | Changed to `catch (err)` and added `logger.error('[sitemap] DB-backed URLs skipped', err)`. | Fixed |
| SEO-10 | P4 | Metadata | `my-app/src/app/(main)/blog/[slug]/page.tsx` | 24-28 | Uses `buildPageMetadata` correctly but does not pass `keywords` from the post. Verified `getPublishedPost`/`getPublishedPosts` already filter `.eq('is_published', true)`, and title/description/canonical are unique per post. | None material. `keywords` is not a ranking factor and the substantive fields are already correct. | None — deliberately not treated as a defect. | Not fixed (not a defect) |
| SEO-11 | P4 | Structured Data | `my-app/src/app/layout.tsx` | 38-49 | Organization JSON-LD uses `"@type": "NGO"`, valid but less common than `Organization`. `foundingDate: "2024"` is asserted. | None material. | None — `NGO` is valid schema.org. | Not fixed (not a defect) |
| SEO-12 | P3 | Crawl Directives | `my-app/src/app/robots.ts` | 13-28 | Blocks `/profile/` while the canonical public profile route is `/p/[slug_id]`; `/profile/:bh_id` 308s to `/p/:bh_id`. | None — correctly configured. | None. | Not applicable |
| SEO-13 | P3 | International | `my-app/src/app/layout.tsx` | 117-119 | `hreflang` is `en` + `x-default` only. No `/ne` route exists, confirmed against the route tree. | None — no Nepali-language routes, so no `hreflang` needed. | None. | Not applicable |

---

## C. Page-Level Audit Matrix

| Route | Metadata | Canonical | Indexable | Structured Data | Content | Issues |
|-------|----------|-----------|-----------|-----------------|---------|--------|
| `/` | ✅ buildPageMetadata | ✅ www.butwalhacks.com | ✅ Yes | ✅ Organization + FAQPage | Complete | None |
| `/about` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/events` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | SEO-04 fixed: now filters is_published |
| `/events/[slug]` | ✅ generateMetadata + buildPageMetadata | ✅ | ✅ Yes | ✅ Event + FAQPage | Complete | SEO-05 fixed: both queries filter is_published |
| `/blog` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/blog/[slug]` | ✅ generateMetadata | ✅ | ✅ Yes | ✅ BlogPosting | Complete | None — publication status and unique fields all correct |
| `/chapters` | ✅ buildPageMetadata | ✅ | ✅ Yes | ✅ ItemList | Complete | None |
| `/chapters/[slug]` | ✅ generateMetadata + buildPageMetadata | ✅ | ✅ Yes | None | Complete | None — audited, correct as-is |
| `/explore` | ✅ buildPageMetadata | ✅ | ✅ Yes | ✅ WebPage + NGO | Complete | SEO-03 fixed: now uses SITE_URL |
| `/mentors` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | SEO-01 fixed |
| `/projects` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/projects/[id]` | ✅ generateMetadata + buildPageMetadata | ✅ | ✅ Yes | None | Complete | SEO-02 fixed: dynamic per-project |
| `/teams` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/gallery` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/partners` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/support` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/contact` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/transparency` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | SEO-06 fixed: ?view=report removed from sitemap |
| `/governance` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/learn` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/festivals` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None — audited, correct as-is |
| `/festivals/[slug]` | ✅ generateMetadata + buildPageMetadata | ✅ | ✅ Yes | ✅ Event (festivalEventJsonLd) | Complete | None — audited, correct as-is; handles missing slug |
| `/sitemap` | ✅ buildPageMetadata | ✅ | ✅ Yes | None | Complete | None |
| `/legal/privacy` | (not inspected) | | | | | |
| `/legal/terms` | (not inspected) | | | | | |
| `/cookie-policy` | (not inspected) | | | | | |
| `/offline` | (not inspected) | | | | | |
| `/verify/*` | (not inspected) | | | | | |
| `/widget/*` | (not inspected) | | | | | |
| `/dashboard/*` | — | — | ❌ No (robots disallowed) | None | N/A | Correctly blocked |
| `/portal/*` | — | — | ❌ No (robots disallowed) | None | N/A | Correctly blocked |
| `/orgs/*` | — | — | ❌ No (robots disallowed) | None | N/A | Correctly blocked |
| `/api/*` | — | — | ❌ No (robots disallowed) | None | N/A | Correctly blocked |
| `/auth/*` | — | — | ❌ No (robots disallowed) | None | N/A | Correctly blocked |

---

## D. Keyword and Content Map

| Intent Group | Keywords (qualitative) | Target Page | Priority | Notes |
|--------------|----------------------|-------------|----------|-------|
| Local | hackathons in Butwal, coding events Butwal, tech events Lumbini Province | `/events`, `/` | High | Verified content exists |
| Local | student tech community Butwal, programming workshops Rupandehi | `/explore`, `/chapters` | High | Chapters page lists real schools |
| National | hackathons in Nepal, student hackathons Nepal, coding competitions Nepal | `/events`, `/blog` | High | Blog posts cover Nepal tech ecosystem |
| National | technology communities Nepal, student project showcases Nepal | `/projects`, `/explore` | Medium | Project showcase exists |
| International | Nepal student technology communities, mentoring student developers Nepal | `/mentors`, `/about` | Medium | Mentor directory exists |
| Brand | Butwal Hacks, BH-ID, Butwal Hacks Nepal | `/`, `/about` | High | Branded content present |

No keyword volumes available — prioritization is qualitative based on content completeness.

---

## E. Technical Checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Sitemap at /sitemap.xml | ✅ | `my-app/src/app/sitemap.ts`, build shows `/sitemap.xml` |
| Robots at /robots.txt | ✅ | `my-app/src/app/robots.ts`, build shows `/robots.txt` |
| AI crawlers allowed | ✅ | `robots.ts` explicitly allows GPTBot, ClaudeBot, etc. |
| Canonical URLs | ✅ (most) | `buildPageMetadata()` sets `alternates.canonical` |
| www canonical host | ✅ | `SITE_URL` defaults to `https://www.butwalhacks.com` |
| HSTS | ✅ | `next.config.ts` securityHeaders |
| X-Content-Type-Options | ✅ | `next.config.ts` securityHeaders |
| Referrer-Policy | ✅ | `next.config.ts` securityHeaders |
| CSP frame-ancestors | ✅ | `'none'` for catch-all, `*` for /widget |
| Powered-By header disabled | ✅ | `next.config.ts` `poweredByHeader: false` |
| JSON-LD validity | ✅ | `SafeJsonLd` escapes `</script>` |
| llms.txt | ✅ | `my-app/public/llms.txt` + `llms-full.txt` |
| hreflang | ✅ | en + x-default only (no /ne route) |
| Skip-to-content link | ✅ | `layout.tsx` line 127-132 |
| lang="en" | ✅ | `layout.tsx` line 104 |
| Redirects permanent (308) | ✅ | `next.config.ts` `redirects()`, `permanent: true` |
| Sitemap no redirect sources | ✅ | `redirects.test.ts` guards this |
| Metadata on all public pages | ✅ | All audited routes use `buildPageMetadata()` |
| Sitemap DB-backed families present | ✅ | events (published only), projects, profiles, teams — guarded by `sitemap-db-queries.test.ts` |
| Sitemap query columns match schema | ✅ | `references no column absent from the canonical schema` test |
| Sitemap DB failure is logged | ✅ | `logger.error('[sitemap] DB-backed URLs skipped', err)` |

---

## F. Changes Made

1. **`my-app/src/app/(main)/mentors/page.tsx`** — Replaced raw `Metadata` object with `buildPageMetadata()`, adding canonical URL, Open Graph, Twitter, robots, and keywords.

2. **`my-app/src/app/(main)/projects/[id]/page.tsx`** — `generateMetadata()` now accepts `params`, fetches the project, and returns dynamic metadata with the project-specific title, description, keywords, and canonical path `/projects/${id}`. Falls back to a "Project Not Found" metadata block when the row is absent.

3. **`my-app/src/app/(main)/explore/page.tsx`** — Replaced hardcoded `https://butwalhacks.com/explore` in JSON-LD with `` `${SITE_URL}/explore` `` using the `SITE_URL` constant.

4. **`my-app/src/app/(main)/events/page.tsx`** — Added `.eq("is_published", true)` so draft events are not publicly listed.

5. **`my-app/src/app/(main)/events/[slug]/page.tsx`** — Added `.eq("is_published", true)` to **both** the `generateMetadata` query and the page component query, so unpublished events cannot be viewed by slug or leak title/description.

6. **`my-app/src/app/sitemap.ts`**
   - Events query: dropped the nonexistent `.not('status', 'eq', 'archived')` filter, switched `updated_at` → `created_at`, added `.eq('is_published', true)`, added `.order('created_at', ...)`.
   - Projects, profiles, teams queries: switched `updated_at` → `created_at` for both `select` and `order`; teams gained an explicit ordering.
   - Removed the `/transparency?view=report` query-param variant, with a comment recording why.
   - Replaced `catch {}` with `catch (err)` + `logger.error(...)`.

7. **`my-app/src/__tests__/seo-regression.test.ts`** (new) — 8 tests: sitemap has no query-string URLs, events index/detail filter `is_published`, mentors metadata has canonical + OG + robots, explore uses `SITE_URL`.

8. **`my-app/src/__tests__/sitemap-db-queries.test.ts`** (new) — 6 behavioural tests against a mocked PostgREST chain: events filtered to published, no absent-schema columns referenced, `order` only by selected columns, all four DB families emitted on success, static entries survive a total DB failure, and the swallowed error is now logged.

---

## G. Verification Results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run typecheck` | PASS | Clean, no errors |
| `npm run lint` | PASS | Zero warnings |
| `npm run test` | PASS | **1632 tests / 112 files** (1618 baseline → +14 across 2 new files) |
| `npm run build` | PASS | Exit code 0 |

**Baseline before this session:** typecheck PASS, lint PASS, test PASS (1618 / 110), build PASS. **No pre-existing failures**; the two `Error fetching …` lines during build are pre-existing and explained in section H.

**Regression tests were verified to actually fail on the bug.** The sitemap suite was re-run against a temporarily reverted `sitemap.ts` (restoring `.not('status', …)` and `select('slug, updated_at')`): 2 of 6 tests failed as intended, then passed again once the fix was restored. A test that cannot fail is not a regression guard.

---

## H. Remaining Work

### Code-verified in this session (no further code change needed)

- **Sitemap `is_published` filtering** — previously listed as outstanding item #6. Now implemented and covered by a behavioural test (`filters events to published only`). **Closed.**
- **Festival and chapter metadata** — previously listed as un-audited. Both `/festivals`, `/festivals/[slug]`, and `/chapters/[slug]` were inspected: all route through `buildPageMetadata()` with unique per-record titles, descriptions, and canonical paths, and handle a missing record with a not-found metadata block. No defects found. **Closed, no change required.**
- **Blog metadata** — `getPublishedPost` and `getPublishedPosts` already filter `.eq('is_published', true)`; title, description, and canonical are unique per post. The missing `keywords` field was reassessed and **is not a meaningful SEO defect** (not a ranking factor; all substantive fields are already correct). **Closed, no change made deliberately.**

### Requires production access — NOT verified here

No production endpoint was fetched. The following must be checked by someone with network access:

1. `https://www.butwalhacks.com/robots.txt` — returns 200 and declares `Sitemap: https://www.butwalhacks.com/sitemap.xml`.
2. `https://www.butwalhacks.com/sitemap.xml` — returns 200 and valid XML.
3. **Confirm the sitemap now contains DB-backed URLs.** Before the fix, `/projects/[id]`, `/p/[bh_id]`, `/teams/[id]`, and database event URLs were absent. Verify they appear now. This is the single most important check arising from this audit.
4. Confirm no draft/unpublished event URL appears in `sitemap.xml`.
5. Submit the sitemap in Google Search Console and use URL Inspection on a representative project, event, blog post, chapter, and festival URL.
6. Re-submit affected URLs for indexing — discovery alone does not guarantee inclusion.

### Separate investigation — build-time schema drift (NOT fixed here)

Two non-fatal warnings appear during `next build`, both **pre-existing** and **not caused by these changes**:

```text
Error fetching chapters:  code 42703 — column chapters.school does not exist
Error fetching approved testimonials: code 42703 — ...
```

**Root cause: environment drift, not a code defect.** In both cases the code matches the canonical schema exactly:

- `chapters.school` — created by migration `093_add_chapter_school_columns.sql` (`ADD COLUMN IF NOT EXISTS school TEXT`) and again by `121_chapters.sql` (both in the `CREATE TABLE` and as an idempotent `ALTER`).
- `event_reviews` columns — table created by `055_grant_service_role_access.sql`; `status`, `is_featured`, `author_type`, `source` added by `109_testimonial_moderation.sql`; `event_id` made nullable by `111`; `guest_name`, `guest_title` added by `112_testimonial_guest_attribution.sql`. Every column `getApprovedTestimonials` selects is backed by a migration.

So the database being used at build time has not applied the full migration set. Both call sites already degrade gracefully to a static fallback (`PGRST205` branch and `error → staticFallback()`), which is why the build still exits 0.

**Safe remediation:** confirm the target environment's applied migration version and run `supabase db push` (or `supabase migration list`) against it. **No migration was written or altered by this audit** — adding columns the schema already defines would mask the drift rather than fix it.

### Suggested follow-up (not urgent)

- Consider a CI check that asserts every column referenced in a Supabase query exists in the canonical schema. The SEO-07/08 class of bug is a schema/query mismatch, and two occurrences in one file went undetected because the failure was silent.
