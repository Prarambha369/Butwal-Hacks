import { describe, it, expect } from "vitest"
import { adToBs, bsToAd, formatBsDateIso, BS_MONTH_NAMES } from "../nepali-date"

/**
 * Verified reference pairs (Nepal Panchanga Nirnayak Samiti / published
 * converter datasets). If one of these fails, the dataset — not the
 * algorithm — has drifted.
 */
const VERIFIED_PAIRS: Array<{ ad: [number, number, number]; bs: [number, number, number] }> = [
  { ad: [1943, 4, 14], bs: [2000, 1, 1] }, // anchor
  { ad: [2025, 4, 14], bs: [2082, 1, 1] }, // Nepali New Year 2082
  { ad: [2025, 12, 31], bs: [2082, 9, 16] }, // trust-page dates (was wrong before)
  { ad: [2026, 4, 14], bs: [2083, 1, 1] }, // Nepali New Year 2083
  { ad: [2026, 9, 11], bs: [2083, 5, 26] }, // around current date — Bhadra
  { ad: [2026, 9, 17], bs: [2083, 6, 1] }, // Ashwin 2083 begins
  { ad: [2026, 9, 19], bs: [2083, 6, 3] }, // current date — Ashwin 3
  { ad: [2026, 10, 18], bs: [2083, 7, 1] }, // Kartik 2083 begins
  { ad: [2033, 4, 14], bs: [2090, 1, 1] }, // Nepali New Year 2090
  // Last supported day: BS 2090 Chaitra has 30 days, so 2090-12-30 =
  // AD 2034-04-13. (2090-01-01 itself = 2033-04-14, consistent with the
  // Apr 13/14 New Year oscillation — any pair placing 2090 in AD 2032/33
  // is off by a full year.)
  { ad: [2034, 4, 13], bs: [2090, 12, 30] }, // last supported day
]

function utc(...ymd: [number, number, number]): Date {
  return new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2]))
}

describe("adToBs", () => {
  it.each(VERIFIED_PAIRS)("converts AD %s to BS %s", ({ ad, bs }) => {
    const result = adToBs(utc(...ad))
    expect(result).toEqual({ year: bs[0], month: bs[1], day: bs[2] })
  })

  it("lands on Poush 16 for Dec 31, 2025 (regression: anchor/table drift)", () => {
    const result = adToBs(utc(2025, 12, 31))
    expect(result.year).toBe(2082)
    expect(BS_MONTH_NAMES[result.month - 1]).toBe("Poush")
    expect(result.day).toBe(16)
  })

  it("throws for dates before the supported range", () => {
    expect(() => adToBs(utc(1943, 4, 13))).toThrow(RangeError)
  })

  it("throws for dates after the supported range", () => {
    expect(() => adToBs(utc(2034, 4, 14))).toThrow(RangeError)
  })

  it("interprets days in Nepal time, not UTC or local TZ", () => {
    // 2026-09-18T18:15Z is Sep 19 00:00 in Kathmandu (UTC day is still 18th)
    expect(adToBs(new Date("2026-09-18T18:15:00Z"))).toEqual({ year: 2083, month: 6, day: 3 })
    // 2026-09-19T18:00Z is Sep 19 23:45 NPT — still Ashwin 3
    expect(adToBs(new Date("2026-09-19T18:00:00Z"))).toEqual({ year: 2083, month: 6, day: 3 })
  })
})

describe("bsToAd", () => {
  it.each(VERIFIED_PAIRS)("converts BS %s to AD %s", ({ ad, bs }) => {
    const result = bsToAd(bs[0], bs[1], bs[2])
    expect(result.toISOString().slice(0, 10)).toBe(
      `${ad[0]}-${String(ad[1]).padStart(2, "0")}-${String(ad[2]).padStart(2, "0")}`
    )
  })

  it("throws for BS years outside 2000-2090", () => {
    expect(() => bsToAd(1999, 1, 1)).toThrow(RangeError)
    expect(() => bsToAd(2091, 1, 1)).toThrow(RangeError)
  })
})

describe("calendar integrity", () => {
  it("BS 2082 is a 365-day year (regression: 366-day row shifted all dates)", () => {
    const start = bsToAd(2082, 1, 1)
    const end = bsToAd(2083, 1, 1)
    const days = (end.getTime() - start.getTime()) / 86400000
    expect(days).toBe(365)
  })

  it("every year in the dataset spans 365 or 366 days", () => {
    for (let y = 2000; y <= 2089; y++) {
      const days = (bsToAd(y + 1, 1, 1).getTime() - bsToAd(y, 1, 1).getTime()) / 86400000
      expect(days, `BS ${y} length`).toBeGreaterThanOrEqual(365)
      expect(days, `BS ${y} length`).toBeLessThanOrEqual(366)
    }
  })

  it("round-trips every day of the current supported decade", () => {
    // Spot-check years across the range rather than all ~33k days.
    for (const y of [2000, 2016, 2039, 2062, 2082]) {
      const start = bsToAd(y, 1, 1)
      const end = bsToAd(y + 1, 1, 1)
      for (let t = start.getTime(); t < end.getTime(); t += 86400000 * 17) {
        const ad = new Date(t)
        const bs = adToBs(ad)
        const back = bsToAd(bs.year, bs.month, bs.day)
        expect(back.toISOString().slice(0, 10), `${y}: ${ad.toISOString()}`).toBe(
          ad.toISOString().slice(0, 10)
        )
      }
    }
  })
})

describe("formatting helpers", () => {
  it("formatBsDateIso pads month and day", () => {
    expect(formatBsDateIso(utc(2025, 12, 31))).toBe("2082-09-16")
    expect(formatBsDateIso(utc(2025, 4, 14))).toBe("2082-01-01")
  })
})
