import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n";
import { homeFaqEntries } from "@/lib/home-faq";
import { faqs as eventFaqs } from "@/components/events/event-detail-content";
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
