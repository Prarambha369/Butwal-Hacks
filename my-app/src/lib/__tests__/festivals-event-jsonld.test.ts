import { describe, expect, it } from "vitest";
import { ALL_FESTIVALS, festivalEventJsonLd } from "@/lib/festivals";
import { siteUrl } from "@/lib/seo";

/**
 * Regression guard for the largest SEO/AEO gap on the site.
 *
 * 191 of the 222 sitemap URLs are festival pages, and before this every one of
 * them emitted a single JSON-LD block of `@type: NGO` (from the root layout)
 * and no Event markup whatsoever. Google therefore had nothing to surface in
 * the Events experience, and Search Console's Events report could only report
 * generic missing-field noise.
 *
 * These assertions cover Google's documented event requirements — name,
 * startDate, location, and a price-0 `offers` block for free events — across
 * the whole dataset rather than a hand-picked festival, so a new entry added
 * to festivals-2081/2082/2083 cannot ship without markup.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("festivalEventJsonLd", () => {
  it("covers every festival in the dataset", () => {
    // Guards the premise: if this drops, the 191-URL claim stops holding.
    expect(ALL_FESTIVALS.length).toBeGreaterThan(100);
    for (const f of ALL_FESTIVALS) {
      expect(festivalEventJsonLd(f), f.slug).toBeDefined();
    }
  });

  it("emits valid Event JSON that survives a round trip", () => {
    for (const f of ALL_FESTIVALS) {
      const json = JSON.stringify(festivalEventJsonLd(f));
      expect(() => JSON.parse(json), f.slug).not.toThrow();
      expect(json, f.slug).not.toContain("</script");
    }
  });

  it("satisfies Google's required event fields for every festival", () => {
    for (const f of ALL_FESTIVALS) {
      const ld = festivalEventJsonLd(f);
      const where = f.slug;

      expect(ld["@type"], where).toBe("Event");
      expect(ld["@context"], where).toBe("https://schema.org");
      expect(typeof ld.name, where).toBe("string");
      expect((ld.name as string).length, where).toBeGreaterThan(0);
      expect(ld.description, where).toBeTruthy();
      expect(ld.startDate as string, where).toMatch(ISO_DATE);
      expect(ld.endDate as string, where).toMatch(ISO_DATE);
      expect(ld.url, where).toBe(`${siteUrl}/festivals/${f.slug}`);
      expect(Array.isArray(ld.image), where).toBe(true);
      expect((ld.image as string[])[0], where).toMatch(/^https?:\/\//);
      expect(ld.eventStatus, where).toContain("schema.org/Event");
      expect(ld.eventAttendanceMode, where).toContain("schema.org/");

      // location is required
      expect(ld.location, where).toBeTruthy();
      const loc = ld.location as Record<string, unknown>;
      expect(loc["@type"], where).toBe("Place");
      const addr = loc.address as Record<string, unknown>;
      expect(addr["@type"], where).toBe("PostalAddress");
      expect(addr.addressLocality, where).toBe("Butwal");

      // organizer is the correct property here, not performer
      expect((ld.organizer as Record<string, unknown>)["@type"], where).toBe(
        "Organization",
      );
    }
  });

  it("marks free events with a price-0 offer, as Google requires", () => {
    for (const f of ALL_FESTIVALS) {
      const ld = festivalEventJsonLd(f);
      const offers = ld.offers as Record<string, unknown>;
      expect(offers["@type"], f.slug).toBe("Offer");
      expect(offers.price, f.slug).toBe("0");
      expect(offers.priceCurrency, f.slug).toBe("NPR");
      expect(offers.availability as string, f.slug).toContain("schema.org/");
      expect(ld.isAccessibleForFree, f.slug).toBe(true);
    }
  });

  it("derives startDate from the authoritative AD date", () => {
    for (const f of ALL_FESTIVALS) {
      const [y, m, d] = f.ad;
      const expected = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      expect(festivalEventJsonLd(f).startDate, f.slug).toBe(expected);
    }
  });

  it("never invents a performer for a festival", () => {
    // Search Console flags a missing `performer`, but a festival has none.
    // Documenting that choice so nobody "fixes" the metric later.
    for (const f of ALL_FESTIVALS) {
      expect(festivalEventJsonLd(f), f.slug).not.toHaveProperty("performer");
    }
  });
});
