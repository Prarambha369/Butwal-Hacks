import { describe, it, expect } from "vitest";
import { FESTIVALS_2083, getFestival, getFestivalsByGroup, type FestivalTradition } from "@/lib/festivals-2083";
import { bsToAd, bsDaysInMonth } from "@/lib/nepali-date";

const TRADITIONS: FestivalTradition[] = ["hindu", "buddhist", "janajati", "civic", "christian"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

describe("festivals-2083 dataset", () => {
  it("converts every BS date to its listed AD date via the engine", () => {
    expect(FESTIVALS_2083.length).toBeGreaterThan(0);
    for (const f of FESTIVALS_2083) {
      const [by, bm, bd] = f.bs;
      const [ay, am, ad] = f.ad;
      const iso = bsToAd(by, bm, bd).toISOString().slice(0, 10);
      expect(iso, `${f.slug}: BS ${by}-${bm}-${bd}`).toBe(`${ay}-${pad(am)}-${pad(ad)}`);
    }
  });

  it("uses valid BS days that exist in their month", () => {
    for (const f of FESTIVALS_2083) {
      const [y, m, d] = f.bs;
      expect(m, `${f.slug} month`).toBeGreaterThanOrEqual(1);
      expect(m, `${f.slug} month`).toBeLessThanOrEqual(12);
      expect(d, `${f.slug} day`).toBeGreaterThanOrEqual(1);
      expect(d, `${f.slug} day`).toBeLessThanOrEqual(bsDaysInMonth(y, m));
    }
  });

  it("has unique slugs and valid traditions", () => {
    const slugs = FESTIVALS_2083.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const f of FESTIVALS_2083) {
      expect(TRADITIONS, f.slug).toContain(f.tradition);
      expect(f.nameEn.length, f.slug).toBeGreaterThan(0);
      expect(f.nameNe.length, f.slug).toBeGreaterThan(0);
      expect(f.contextEn.length, f.slug).toBeGreaterThan(0);
      expect(f.contextNe.length, f.slug).toBeGreaterThan(0);
    }
  });

  it("keeps every slug on the 2083 suffix so URLs stay permanent", () => {
    for (const f of FESTIVALS_2083) {
      expect(f.bs[0]).toBe(2083);
      expect(f.slug.endsWith("-2083"), f.slug).toBe(true);
    }
  });

  it("resolves lookups used by the festival pages", () => {
    expect(getFestival("vijaya-dashami-2083")?.nameEn).toContain("Vijaya Dashami");
    expect(getFestival("no-such-festival") ).toBeNull();
    const tihar = getFestivalsByGroup("tihar");
    expect(tihar.map((f) => f.slug)).toEqual([
      "kag-tihar-2083",
      "kukur-tihar-2083",
      "laxmi-puja-2083",
      "gai-tihar-mha-puja-2083",
      "bhai-tika-2083",
    ]);
  });
});
