import { describe, it, expect } from "vitest";
import { ALL_FESTIVALS, getFestivalAll, getFestivalsByGroupAll } from "@/lib/festivals";
import { FESTIVALS_2081 } from "@/lib/festivals-2081";
import { FESTIVALS_2082 } from "@/lib/festivals-2082";
import { FESTIVALS_2083 } from "@/lib/festivals-2083";
import { bsToAd, bsDaysInMonth } from "@/lib/nepali-date";

const pad = (n: number) => String(n).padStart(2, "0");

describe("festivals rollup", () => {
  it("covers 2081-2083 with unique slugs", () => {
    expect(FESTIVALS_2081.length).toBeGreaterThan(0);
    expect(FESTIVALS_2082.length).toBeGreaterThan(0);
    expect(ALL_FESTIVALS.length).toBe(
      FESTIVALS_2081.length + FESTIVALS_2082.length + FESTIVALS_2083.length,
    );
    const slugs = ALL_FESTIVALS.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("converts every imported BS date to its AD date via the engine", () => {
    for (const f of [...FESTIVALS_2081, ...FESTIVALS_2082]) {
      expect(f.bs[0]).not.toBe(2083);
      const iso = bsToAd(f.bs[0], f.bs[1], f.bs[2]).toISOString().slice(0, 10);
      expect(iso, f.slug).toBe(`${f.ad[0]}-${pad(f.ad[1])}-${pad(f.ad[2])}`);
      expect(f.bs[2]).toBeLessThanOrEqual(bsDaysInMonth(f.bs[0], f.bs[1]));
    }
  });

  it("resolves cross-year lookups for pages and sitemap", () => {
    expect(getFestivalAll("vijaya-dashami-2083")?.group).toBe("dashain");
    expect(getFestivalAll("bhai-tika-2082")?.group).toBe("tihar");
    expect(getFestivalAll("nope")).toBeNull();
    expect(getFestivalsByGroupAll("tihar", 2082).length).toBeGreaterThanOrEqual(5);
  });
});
