import { blogPosts, chapters, initiatives, programs } from "@/lib/content";

/**
 * Static search index for content that lives in code rather than the database.
 *
 * The database-backed sources (profiles, projects, events) are queried with
 * PostgREST `ilike` in the route. Everything else — blog posts and their full
 * body text, chapters, initiatives — is a plain array in `content.ts`, so it
 * is indexed here in memory. The corpus is a few hundred short documents, so
 * a linear scan per keystroke is well under a millisecond and avoids shipping
 * a search service for it.
 */

export type StaticSearchType = "blog" | "initiative" | "chapter";

export interface StaticSearchDoc {
  type: StaticSearchType;
  id: string;
  title: string;
  /** One-line context shown under the title in the result row. */
  subtitle: string;
  href: string;
  tags: string[];
  summary: string;
  /** Long-form text: blog body, chapter description, initiative details. */
  body: string;
}

// Field weights. A hit in the title is worth far more than one in the body,
// so a post titled "HackDay" outranks a post that merely mentions it.
const W = { title: 8, tags: 5, summary: 3, body: 1 } as const;

function buildIndex(): StaticSearchDoc[] {
  const docs: StaticSearchDoc[] = [];

  for (const post of blogPosts) {
    docs.push({
      type: "blog",
      id: post.slug,
      title: post.title,
      subtitle: post.excerpt,
      href: `/blog/${post.slug}`,
      tags: post.tags,
      summary: post.excerpt,
      body: post.body.join(" "),
    });
  }

  for (const chapter of chapters) {
    docs.push({
      type: "chapter",
      id: chapter.slug,
      title: chapter.name,
      subtitle: [chapter.school, chapter.city].filter(Boolean).join(" · "),
      href: `/chapters/${chapter.slug}`,
      tags: chapter.tags,
      summary: chapter.description,
      body: [
        chapter.description,
        chapter.school,
        chapter.city,
        chapter.district,
        chapter.province,
        chapter.leadName,
        ...chapter.highlights,
      ].join(" "),
    });
  }

  for (const initiative of initiatives) {
    // Programs have no page of their own — /programs redirects away — so their
    // distinguishing text (audience, price, format) is folded into the
    // initiative they belong to instead of becoming dead search results.
    const linked = programs.filter((p) => p.initiativeSlug === initiative.slug);
    const linkedText = linked
      .flatMap((p) => [p.tagline, p.type, p.location, p.price, ...p.whoCanParticipate])
      .filter(Boolean)
      .join(" ");

    docs.push({
      type: "initiative",
      id: initiative.slug,
      title: initiative.name,
      subtitle: initiative.summary,
      href: `/initiatives/${initiative.slug}`,
      tags: initiative.tags,
      summary: initiative.summary,
      body: [...initiative.details, linkedText].join(" "),
    });
  }

  return docs;
}

let cached: StaticSearchDoc[] | null = null;

function index(): StaticSearchDoc[] {
  if (!cached) cached = buildIndex();
  return cached;
}

// ─── Tokenization ───────────────────────────────────────────────────

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9ऀ-ॿ]+/u)
    .filter((t) => t.length > 1);
}

/** Bounded Levenshtein — returns `max + 1` as soon as it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a === b) return 0;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Short tokens tolerate one typo; longer ones tolerate two. */
function tolerance(token: string): number {
  return token.length <= 4 ? 1 : 2;
}

// ─── Scoring ────────────────────────────────────────────────────────

/** Best score a single query token can earn within one field, else 0. */
function scoreToken(token: string, fieldText: string): number {
  const fieldTokens = tokenize(fieldText);
  let best = 0;

  for (const candidate of fieldTokens) {
    if (candidate === token) return 1;
    // Prefix match beats fuzzy: "hack" should find "hackathon" outright.
    if (candidate.startsWith(token)) best = Math.max(best, 0.75);
    else if (token.startsWith(candidate) && candidate.length >= 3) {
      best = Math.max(best, 0.6);
    } else if (editDistance(candidate, token, tolerance(token)) <= tolerance(token)) {
      best = Math.max(best, 0.45);
    }
  }
  return best;
}

/**
 * Score one document. Every query token must match somewhere (AND), so
 * narrowing a search actually narrows results; the total ranks them.
 */
function scoreDoc(doc: StaticSearchDoc, queryTokens: string[]): number {
  const fields: Array<[string, string, number]> = [
    [doc.title, "title", W.title],
    [doc.tags.join(" "), "tags", W.tags],
    [doc.summary, "summary", W.summary],
    [doc.body, "body", W.body],
  ];

  let total = 0;
  for (const token of queryTokens) {
    let tokenBest = 0;
    for (const [text, , weight] of fields) {
      tokenBest = Math.max(tokenBest, scoreToken(token, text) * weight);
    }
    if (tokenBest === 0) return 0; // AND: one unmatched token disqualifies
    total += tokenBest;
  }
  return total;
}

/**
 * Score free text against a query, using the same field weights as the
 * static index. Lets the route rank database-backed hits alongside static
 * ones so both sources compete in a single relevance-ordered list.
 */
export function scoreText(query: string, text: string, weight: number = W.title): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;

  let total = 0;
  for (const token of queryTokens) {
    const score = scoreToken(token, text) * weight;
    if (score === 0) return 0; // AND
    total += score;
  }
  return total;
}

export function searchStatic(query: string, limit = 8): StaticSearchDoc[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  return index()
    .map((doc) => ({ doc, score: scoreDoc(doc, queryTokens) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((hit) => hit.doc);
}

// ─── Near-miss suggestions ──────────────────────────────────────────

let vocabCache: Map<string, number> | null = null;

/** Every index token, mapped to how often it appears. */
function vocabulary(): Map<string, number> {
  if (vocabCache) return vocabCache;
  const freq = new Map<string, number>();
  for (const doc of index()) {
    for (const field of [doc.title, doc.tags.join(" "), doc.summary, doc.body]) {
      for (const token of tokenize(field)) {
        freq.set(token, (freq.get(token) ?? 0) + 1);
      }
    }
  }
  vocabCache = freq;
  return freq;
}

/**
 * Did-you-mean suggestions for a query that matched nothing.
 *
 * Suggests whole index tokens rather than editing the query, because a token
 * the corpus actually contains is always a better next click than a
 * speculatively-corrected word.
 */
export function suggestNearMisses(query: string, limit = 3): string[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const suggestions = new Map<string, number>();

  for (const token of queryTokens) {
    const max = tolerance(token);
    for (const [candidate, freq] of vocabulary()) {
      if (candidate === token) continue;
      const distance = editDistance(candidate, token, max);
      if (distance > max) continue;
      // Closer wins; on a tie the more common token wins.
      const score = (max + 1 - distance) * Math.log2(1 + freq);
      if (!suggestions.has(candidate) || suggestions.get(candidate)! < score) {
        suggestions.set(candidate, score);
      }
    }
  }

  return [...suggestions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}
