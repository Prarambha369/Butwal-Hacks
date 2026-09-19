import { describe, it, expect } from "vitest";
import { PUBLIC_HOLIDAYS, getPublicHolidays } from "@/lib/public-holidays";
import { FESTIVALS_2083 } from "@/lib/festivals-2083";
import { bsToAd, bsDaysInMonth } from "@/lib/nepali-date";

const pad = (n: number) => String(n).padStart(2, "0");
const STOP = new Set("subha sri shree parva puja festival day dibas diwas jayanti tihar tika happy merry national public holiday".split(" "));
const tokens = (s: string) =>
  new Set(s.toLowerCase().split(/[^a-z]+/).filter((w) => w && !STOP.has(w)));

describe("public-holidays dataset", () => {
  it("converts every BS date to its listed AD date via the engine", () => {
    expect(PUBLIC_HOLIDAYS.length).toBeGreaterThan(0);
    for (const h of PUBLIC_HOLIDAYS) {
      const iso = bsToAd(h.bs[0], h.bs[1], h.bs[2]).toISOString().slice(0, 10);
      expect(iso, h.slug).toBe(`${h.ad[0]}-${pad(h.ad[1])}-${pad(h.ad[2])}`);
    }
  });

  it("uses valid BS days, unique slugs, and known kinds", () => {
    const slugs = PUBLIC_HOLIDAYS.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const h of PUBLIC_HOLIDAYS) {
      expect(h.bs[1]).toBeGreaterThanOrEqual(1);
      expect(h.bs[1]).toBeLessThanOrEqual(12);
      expect(h.bs[2]).toBeLessThanOrEqual(bsDaysInMonth(h.bs[0], h.bs[1]));
      expect(["holiday", "observance"]).toContain(h.kind);
      expect(h.nameEn.length).toBeGreaterThan(0);
      expect(h.nameNe.length).toBeGreaterThan(0);
      expect([2026, 2027]).toContain(h.ad[0]);
    }
  });

  it("never shadows a same-named Samiti festival on the same solar day", () => {
    const samitiByAd = new Map<string, string[]>();
    for (const f of FESTIVALS_2083) {
      const iso = `${f.ad[0]}-${pad(f.ad[1])}-${pad(f.ad[2])}`;
      samitiByAd.set(iso, [...(samitiByAd.get(iso) ?? []), f.nameEn]);
    }
    for (const h of PUBLIC_HOLIDAYS) {
      const iso = `${h.ad[0]}-${pad(h.ad[1])}-${pad(h.ad[2])}`;
      const rivals = samitiByAd.get(iso) ?? [];
      const mine = tokens(h.nameEn);
      for (const name of rivals) {
        const theirs = tokens(name);
        const clash = [...mine].some((w) => theirs.has(w));
        expect(clash, `${h.slug} vs samiti "${name}" on ${iso}`).toBe(false);
      }
    }
  });

  it("filters by AD year for the calendar", () => {
    expect(getPublicHolidays(2026).every((h) => h.ad[0] === 2026)).toBe(true);
    expect(getPublicHolidays(2027).every((h) => h.ad[0] === 2027)).toBe(true);
    expect(getPublicHolidays().length).toBe(
      getPublicHolidays(2026).length + getPublicHolidays(2027).length,
    );
  });
});
