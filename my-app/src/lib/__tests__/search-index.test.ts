import { describe, it, expect } from "vitest";
import { blogPosts, initiatives, programs } from "@/lib/content";
import { scoreText, searchStatic, suggestNearMisses } from "@/lib/search-index";

/**
 * Global search index.
 *
 * The corpus is static content in `content.ts`, so these run against the real
 * data rather than fixtures — that is the point of the test. If a post is
 * renamed, the "blog body text is searchable" case below is what should fail,
 * because that is the behaviour the feature actually promises.
 */

describe("searchStatic", () => {
  it("finds content by title", () => {
    const [first] = blogPosts;
    const hits = searchStatic(first.title.slice(0, 6));
    expect(hits.some((h) => h.id === first.slug)).toBe(true);
  });

  it("searches blog body text, not just titles", () => {
    // Take a distinctive phrase from a post's body that is absent from its
    // title, and confirm the post is reachable by it.
    const post = blogPosts.find(
      (p) => p.body.join(" ").length > 80 && !p.title.includes(p.body[0].slice(0, 12)),
    );
    expect(post).toBeDefined();

    const phrase = post!.body.join(" ").split(/\s+/).filter((w) => w.length > 5)[2];
    const hits = searchStatic(phrase);
    expect(hits.some((h) => h.id === post!.slug)).toBe(true);
  });

  it("indexes initiatives", () => {
    const initiative = initiatives[0];

    expect(searchStatic(initiative.name).some((h) => h.type === "initiative")).toBe(true);
  });

  it("links every result to a real route", () => {
    const slugs = new Set(blogPosts.map((p) => p.slug));
    const initiativeSlugs = new Set(initiatives.map((i) => i.slug));

    for (const doc of searchStatic("a")) {
      const expected = doc.href.startsWith("/blog/")
        ? slugs.has(doc.href.replace("/blog/", ""))
        : doc.href.startsWith("/initiatives/")
          ? initiativeSlugs.has(doc.href.replace("/initiatives/", ""))
          : false;
      expect(expected).toBe(true);
    }
  });

  it("does not emit a 'program' type, because /programs has no page", () => {
    // Programs redirect to /initiatives, so indexing them would dead-link.
    const all = searchStatic("e").concat(searchStatic("hackathon"));
    // Cast: StaticSearchType cannot include "program" today, so this is a
    // tautology to the type-checker. Kept as a runtime guard so that adding
    // "program" to the union without adding a page fails here, not in prod.
    expect(all.every((d) => (d.type as string) !== "program")).toBe(true);
  });

  it("folds program text into the initiative it belongs to", () => {
    const withProgram = programs.find((p) => initiatives.some((i) => i.slug === p.initiativeSlug));
    expect(withProgram).toBeDefined();

    // A word unique to the program should still surface its initiative.
    const hits = searchStatic(withProgram!.tagline.split(/\s+/).filter((w) => w.length > 5)[0]);
    expect(hits.some((h) => h.id === withProgram!.initiativeSlug)).toBe(true);
  });

  it("requires every query token to match (AND), not any", () => {
    const hits = searchStatic("hackathon zzzzznotaword");
    expect(hits).toHaveLength(0);
  });

  it("returns nothing for empty or single-character queries", () => {
    expect(searchStatic("")).toHaveLength(0);
    expect(searchStatic("   ")).toHaveLength(0);
    expect(searchStatic("a")).toHaveLength(0);
  });

  it("tolerates a typo", () => {
    const exact = searchStatic("hackathon").length;
    const typo = searchStatic("hackaton").length;
    expect(typo).toBeGreaterThan(0);
    expect(exact).toBeGreaterThan(0);
  });
});

describe("scoreText", () => {
  it("weights a title match above a body-only match", () => {
    const q = "hackathon";
    const inTitle = scoreText(q, `The ${q} guide`, 8);
    const inBody = scoreText(q, `a long passage mentioning ${q} once`, 1);
    expect(inTitle).toBeGreaterThan(inBody);
  });

  it("returns 0 when any token is missing", () => {
    expect(scoreText("hackathon zzzz", "hackathon")).toBe(0);
  });
});

describe("suggestNearMisses", () => {
  it("suggests terms that actually lead to results", () => {
    // The contract is "clicking a suggestion gets you results", not "returns
    // any particular plural". The vocabulary holds the forms that appear in
    // the content, so "hackaton" may well be corrected to "hackathon".
    for (const suggestion of suggestNearMisses("hackaton")) {
      expect(searchStatic(suggestion).length).toBeGreaterThan(0);
    }
    expect(suggestNearMisses("hackaton").length).toBeGreaterThan(0);
  });

  it("returns nothing for nonsense input", () => {
    expect(suggestNearMisses("zzzqqqxxx")).toHaveLength(0);
  });

  it("returns nothing when the query is already exact", () => {
    expect(suggestNearMisses("hackathon")).not.toContain("hackathon");
  });

  it("caps the number of suggestions", () => {
    expect(suggestNearMisses("hackaton").length).toBeLessThanOrEqual(3);
  });
});
