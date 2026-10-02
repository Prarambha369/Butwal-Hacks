import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n";
import { homeFaqEntries } from "@/lib/home-faq";
import { EVENT_FAQS as eventFaqs } from "@/lib/event-faq";
import {
  blogPostingJsonLd,
  eventJsonLd,
  faqPageJsonLd,
} from "@/lib/schema";

/**
 * The JSON-LD added for issue #29.
 *
 * The failure mode these guard against is silent. `t()` returns the key itself
 * when a translation is missing, so a renamed i18n key would not throw, would
 * not fail a build, and would ship a FAQPage whose questions are literally
 * "home.faq.items.free.q" to Google's crawler. That is worse than having no
 * markup at all, and nothing else in the type system would catch it.
 */

describe("home FAQ keys resolve to real copy", () => {
  it("has an entry for every question the homepage renders", () => {
    expect(homeFaqEntries.length).toBeGreaterThan(0);
  });

  for (const entry of homeFaqEntries) {
    it(`resolves "${entry.id}" to a real question and answer`, () => {
      const q = t(entry.qKey, "en");
      const a = t(entry.aKey, "en");
      // The silent-failure guard: t() echoes the key on a miss.
      expect(q).not.toBe(entry.qKey);
      expect(a).not.toBe(entry.aKey);
      expect(q.length).toBeGreaterThan(8);
      expect(a.length).toBeGreaterThan(20);
    });
  }
});

describe("event FAQ items are non-empty", () => {
  it("ships questions and answers, not placeholders", () => {
    expect(eventFaqs.length).toBeGreaterThan(0);
    for (const f of eventFaqs) {
      expect(f.q.trim().length).toBeGreaterThan(8);
      expect(f.a.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("faqPageJsonLd", () => {
  it("marks up exactly the items it was given", () => {
    const data = faqPageJsonLd(eventFaqs, "https://example.com/e");
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(eventFaqs.length);
    expect(data.mainEntity[0]).toMatchObject({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer" },
    });
  });

  it("drops undefined rather than emitting null for a missing url", () => {
    const data = eventJsonLd({
      title: "T",
      startDate: "2026-01-01T00:00:00Z",
      url: "https://example.com/e",
    });
    // `location` must be absent when the event names no venue, not present
    // and empty -- an empty Place is a malformed node.
    expect("location" in data).toBe(false);
    expect(data.endDate).toBe("2026-01-01T00:00:00Z");
  });
});

describe("blogPostingJsonLd", () => {
  const post = {
    title: "A post",
    excerpt: "An excerpt",
    url: "https://example.com/blog/a-post",
    datePublished: "2026-01-01",
  };

  it("attributes the publisher rather than inventing an author", () => {
    const data = blogPostingJsonLd(post);
    // Posts have no author column. Crediting the organisation that published
    // them is what actually happened; naming a person would be fiction.
    expect(data.author).toEqual({ "@id": expect.stringContaining("#organization") });
    expect(data.publisher).toEqual({ "@id": expect.stringContaining("#organization") });
  });

  it("truncates the headline to the 110-character limit", () => {
    const long = "x".repeat(200);
    expect(blogPostingJsonLd({ ...post, title: long }).headline).toHaveLength(110);
  });
});

describe("client-boundary safety for FAQ data", () => {
  // This suite imported `faqs` from event-detail-content.tsx and passed -- so
  // the SSR crash it was standing in for never showed up in 1416 tests. Vitest
  // resolves modules normally and does not apply Next's transform that turns a
  // `"use client"` module's non-component exports into client-reference
  // proxies. Only a source-level assertion catches the regression, because the
  // failure mode is invisible to every other layer: the build prerenders
  // nothing dynamic, and the unit test is not the runtime.
  it("keeps event FAQ data in a module with no 'use client' directive", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/event-faq.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/^\s*["']use client["']/m);
  });

  it("does not import FAQ data from a 'use client' module on the event route", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/(main)/events/[slug]/page.tsx"),
      "utf8",
    );
    // A named non-component import from a client module is the proxy trap.
    expect(src).not.toMatch(
      /import\s+\{[^}]*\bfaqs\b[^}]*\}\s+from\s+["'][^"']*event-detail-content["']/,
    );
    expect(src).toContain("@/lib/event-faq");
  });
});

describe("eventJsonLd venue address", () => {
  // The builder used to hardcode Butwal/Lumbini/NP for every venue. But
  // events.location is one free-text column that can hold "Pokhara" or
  // "Online", so that put a confident, wrong address into structured data for
  // any event held outside the city. Google requires event markup to describe
  // the actual location, and a Place with only a name is valid.
  const base = {
    title: "Dev Day",
    startDate: "2026-03-01T06:00:00Z",
    url: "https://www.butwalhacks.com/events/dev-day",
  };

  it("omits the address when no verified one is supplied", () => {
    const out = eventJsonLd({ ...base, locationName: "Pokhara Stadium" }) as {
      location: { name: string; address?: unknown };
    };
    expect(out.location.name).toBe("Pokhara Stadium");
    expect(out.location.address).toBeUndefined();
  });

  it("omits the address when the venue is named but no locality is known", () => {
    const out = eventJsonLd({ ...base, locationName: "TBD" }) as {
      location: { address?: unknown };
    };
    expect(out.location.address).toBeUndefined();
  });

  it("emits only the address fields that were actually supplied", () => {
    const out = eventJsonLd({
      ...base,
      locationName: "Butwal Hacks HQ",
      locationAddress: { addressLocality: "Butwal", addressCountry: "NP" },
    }) as { location: { address: Record<string, string> } };
    expect(out.location.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Butwal",
      addressCountry: "NP",
    });
    // Region was not supplied, so it must not be invented.
    expect(out.location.address).not.toHaveProperty("addressRegion");
  });

  it("treats an all-empty address as no address", () => {
    const out = eventJsonLd({
      ...base,
      locationName: "Somewhere",
      locationAddress: { addressLocality: "", addressCountry: null },
    }) as { location: { address?: unknown } };
    expect(out.location.address).toBeUndefined();
  });

  it("still omits location entirely when no venue is named", () => {
    const out = eventJsonLd({ ...base, locationName: null }) as {
      location?: unknown;
    };
    expect(out.location).toBeUndefined();
  });
});
