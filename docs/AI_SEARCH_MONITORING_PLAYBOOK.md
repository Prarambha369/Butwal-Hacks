# Butwal Hacks — AI Search Monitoring Playbook

**Date:** 2026-10-29
**Audience:** Core maintainers and any volunteer running the weekly visibility check
**Purpose:** Manual weekly tracking of AI visibility for [Butwal Hacks](https://www.butwalhacks.com) — free student hackathons in Butwal, Lumbini Province, Nepal — across Google AI Overviews, ChatGPT Search, and Perplexity.

This is a process doc, not a technical audit. For what is already shipped (sitemap, JSON-LD, `llms.txt`, robots directives for AI crawlers), see [SEO_AEO_GEO_AUDIT.md](SEO_AEO_GEO_AUDIT.md). For product identity and positioning, see [PRODUCT.md](../PRODUCT.md). This doc does not repeat either.

---

## 1. The query list

Run these **verbatim** — the exercises only produce comparable rows if everyone types the same string.

**P0 — run every session (11 queries):**

| # | Query |
|---|-------|
| 1 | upcoming hackathon nepal |
| 2 | hackathons for students in nepal |
| 3 | free hackathon nepal |
| 4 | hackathon butwal |
| 5 | hackathon lumbini |
| 6 | how to join a hackathon in nepal |
| 7 | first hackathon nepal |
| 8 | hackathon for beginners nepal |
| 9 | student tech events nepal |
| 10 | coding events for students nepal |
| 11 | tech community butwal |

**P1 — spot-check when there is time (3 queries):**

| # | Query |
|---|-------|
| 12 | what to bring to a hackathon nepal |
| 13 | how to find a team for hackathon nepal |
| 14 | free tech events lumbini |

## 2. Cadence and how to run it

- **Cadence:** 2–3 times per week on the full P0 set. P1 is optional each session.
- Run each query on **all three platforms**: Google AI Overviews, ChatGPT Search, Perplexity.
- **Runs are non-deterministic.** The same query on the same platform can produce a different answer an hour later. Do not conclude anything from a single run — **3+ runs per platform per query** before logging a Cited/Not-cited verdict. Two runs contradicting each other is a finding, not noise to discard; log both.
- Use a logged-out browser profile or incognito for the check. Results for a signed-in account are not representative.

## 3. Tracking sheet

One row per query × platform × run:

| Column | What goes in it |
|--------|-----------------|
| Query | Verbatim from the list above |
| Platform | Google AIO / ChatGPT / Perplexity |
| Cited? | Y / N (did the answer name or link Butwal Hacks) |
| Who else | Other domains cited in the answer, comma-separated |
| URL cited | The specific butwalhacks.com URL cited, if any |
| Date | YYYY-MM-DD |

A shared sheet (Google Sheets or the Notion equivalent) is the tracker; this doc is only the operating manual. Nothing here is automated — no cron, no script.

## 4. Honest expectations

These numbers come from validated 2026 research; they are presented as cited context so nobody chases the wrong lever.

**Rank position dominates citation odds.** In the SSRN 2026 study from underneath.agency, the page at position 1 was cited in roughly **43%** of queries, and each position lower cut citation odds by about **24%**. On-page features (heading structure, formatting, phrasing) explained only about a **2.5 percentage point** difference.

**Schema markup alone moved citations ~0.** An Ahrefs study of 1,885 pages measured essentially no citation gain from adding schema by itself. The schema Butwal Hacks ships (Organization, Event, FAQPage, BlogPosting, ItemList) is correct and stays — but adding more markup is not the lever the monitoring data will point at.

**AI Overviews reduce clicks, not just add citations.** Measured organic CTR drops of **34–61%** when an AI Overview appears mean that being the *cited source* matters more than ranking under the answer box.

**Google retired FAQ/HowTo rich results (2023–2026)** and states that no special markup is needed for generative AI surfaces. Nothing we can tag will force an inclusion decision.

**Conclusion:** the levers that actually move AI citations are **content quality, machine-readable freshness (crawlable, current event data), and topical authority** — being the most credible page about student hackathons in Nepal. Schema already ships where it belongs; this playbook is how we find out whether the content side is working.

## 5. Reading the results: the easiest-win signal

The highest-value pattern in the sheet is **not** on the queries we get cited for. It is when the same 2–3 rival domains appear repeatedly in the answers for P0 queries where we are **not cited** — especially the locally targeted ones (queries 4, 5, 11).

That repeated "not cited + same rivals" pattern is the easiest-win signal. The next action it prescribes is:

1. Open the rival page being cited for that query.
2. Open our page that should answer the same query.
3. Improve our page's **answer block** — the direct, self-contained answer to the query in the first screen — to be at least as clear, current, and specific as the rival's.

The next action is **not** adding more markup, and **not** creating a new page. The audit established that the schema is already in place; the gap is the answer itself. Record the fix in the sheet's notes so we can check whether the citation flips in a later session.

## 6. Links

- [SEO_AEO_GEO_AUDIT.md](SEO_AEO_GEO_AUDIT.md) — what the site already ships and the code-level state
- [PRODUCT.md](../PRODUCT.md) — what Butwal Hacks is and who it serves
