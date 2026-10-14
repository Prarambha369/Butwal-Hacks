import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug, SLUG_MAX_LENGTH } from "@/lib/slug";

/**
 * `events.slug` is a public URL segment on seven surfaces, including the
 * sitemap. The regression these tests guard: `createEvent()` never wrote a
 * slug, so every event created since migration 003 had `slug = NULL` and
 * `/events/<slug>` resolved to `/events/null`, which is `notFound()`.
 *
 * These tests pin the output shape, because the shape is the contract --
 * `/events/[slug]` and the sitemap consume it verbatim.
 */
describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Daydream Butwal")).toBe("daydream-butwal");
  });

  it("collapses runs of separators into one hyphen", () => {
    expect(slugify("Hack   For   Nepal")).toBe("hack-for-nepal");
    expect(slugify("a - b")).toBe("a-b");
  });

  it("strips leading and trailing separators", () => {
    expect(slugify("  !!Butwal!!  ")).toBe("butwal");
    expect(slugify("--leading-and-trailing--")).toBe("leading-and-trailing");
  });

  it("keeps digits, including folded Devanagari digits", () => {
    expect(slugify("Hackathon 2083")).toBe("hackathon-2083");
    // Nepali event names commonly carry Devanagari numerals.
    expect(slugify("Hackathon २०८३")).toBe("hackathon-2083");
  });

  it("folds Latin diacritics instead of dropping the letter", () => {
    expect(slugify("Ramesh Thapa")).toBe("ramesh-thapa");
    expect(slugify("Café Nuit")).toBe("cafe-nuit");
    // ß has no NFD decomposition, so it needs an explicit fold -- and "ss" is
    // the correct expansion, not a dropped letter.
    expect(slugify("Straße")).toBe("strasse");
  });

  it("expands & and + to words so word order survives", () => {
    // "Research & Development" must not collapse to "research-development",
    // which reads as a different phrase.
    expect(slugify("Research & Development")).toBe("research-and-development");
    expect(slugify("C++")).toBe("c-plus-plus");
  });

  it("drops scripts it cannot transliterate rather than guessing", () => {
    // Percent-encoded Devanagari is unreadable in a URL; a dropped word is the
    // lesser evil.
    expect(slugify("नेपाल ह्याक")).toBe("");
    expect(slugify("Hackathon नेपाल")).toBe("hackathon");
  });

  it("returns empty for input with nothing slug-safe", () => {
    // Must be "" and not "null": an empty string would collide with every
    // other empty slug at the UNIQUE index.
    expect(slugify("")).toBe("");
    expect(slugify("🎉🎊")).toBe("");
    expect(slugify("!!!")).toBe("");
  });

  it("caps length without leaving a trailing hyphen", () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    const result = slugify(long);
    expect(result.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(result.endsWith("-")).toBe(false);
  });

  it("is idempotent, so a slug re-slugified is unchanged", () => {
    // The editor re-slugifies on every keystroke; double application must not
    // drift, or the previewed URL differs from the stored one.
    const once = slugify("Daydream Butwal 2026");
    expect(slugify(once)).toBe(once);
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it is free, costing one lookup", async () => {
    let calls = 0;
    const result = await uniqueSlug("Daydream Butwal", async () => {
      calls++;
      return false;
    });
    expect(result).toBe("daydream-butwal");
    expect(calls).toBe(1);
  });

  it("appends -2, -3 on collision, in chapter style", async () => {
    const taken = new Set(["daydream-butwal", "daydream-butwal-2"]);
    const result = await uniqueSlug("Daydream Butwal", async (c) => taken.has(c));
    expect(result).toBe("daydream-butwal-3");
  });

  it("keeps the readable head when the collision suffix is appended", async () => {
    // A 80-char slug plus "-12" must truncate the head, not the suffix.
    const base = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    const taken = new Set([slugify(base)]);
    const result = await uniqueSlug(base, async (c) => taken.has(c));
    expect(result.endsWith("-2")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(result.endsWith("-")).toBe(false);
  });

  it("returns empty when the input has no slug-safe characters", async () => {
    // Nothing to uniquify, and the caller must be able to detect the failure.
    const result = await uniqueSlug("🎉", async () => false);
    expect(result).toBe("");
  });

  it("falls back to a timestamp rather than looping forever", async () => {
    // Every variant taken is pathological; the bound prevents a public signup
    // path from hammering the database. The result must still be unique.
    const result = await uniqueSlug("popular", async () => true);
    expect(result).toMatch(/^popular-[a-z0-9]+$/);
    expect(result).not.toBe("popular");
  });
});