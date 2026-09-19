/**
 * Nepali (Bikram Sambat) date conversion utilities.
 *
 * BS months have variable lengths (29-32 days) that change yearly,
 * determined by astronomical solar transits. Simple math formulas
 * are inaccurate — a lookup table is the only reliable method.
 *
 * Dataset: month-length table for BS 2000–2090, adapted from the
 * Medic Mobile `bikram-sambat` dataset (test-data/daysInMonth.json,
 * Apache-2.0, battle-tested in production health deployments).
 * Anchor: BS 2000-01-01 = AD 1943-04-14 (classic reference epoch,
 * consistent with the table's cumulative day counts).
 *
 * Supported range: BS 2000-01-01 … BS 2090-12-31
 * (AD 1943-04-14 … AD 2033-04-13). Out-of-range inputs throw RangeError.
 */

// ─── BS Month Data (days per month, 1-indexed months) ──────────────
// Format: { year: [Baisakh, Jeth, Asar, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra] }
const BS_DATA: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
}

// ─── Range: BS 2000-01-01 … BS 2090-12-31 ─────────────────────────
const MIN_BS_YEAR = 2000
const MAX_BS_YEAR = 2090
// Classic anchor: BS 2000-01-01 = AD 1943-04-14
const ANCHOR_AD = new Date(Date.UTC(1943, 3, 14))
const ANCHOR_BS = { year: 2000, month: 1, day: 1 }

function bsYearLength(y: number): number {
  return (BS_DATA[y] ?? []).reduce((a, b) => a + b, 0)
}

// Inclusive last supported AD day, derived from the table:
// BS 2090-12-31 = anchor + (total days 2000…2090) - 1
const MAX_AD_MS = (() => {
  let total = 0
  for (let y = MIN_BS_YEAR; y <= MAX_BS_YEAR; y++) total += bsYearLength(y)
  return ANCHOR_AD.getTime() + (total - 1) * 86400000
})()

function bsDaysInMonth(y: number, m: number): number {
  const dim = BS_DATA[y]?.[m - 1]
  if (dim === undefined) throw new RangeError(`BS date out of supported range (2000–2090): ${y}-${m}`)
  return dim
}

function adToMsUTC(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

// ─── AD → BS ───────────────────────────────────────────────────────
export interface BsDate {
  year: number
  month: number // 1-12
  day: number   // 1-32
}

export function adToBs(adDate: Date): BsDate {
  const adMs = adToMsUTC(adDate)
  const anchorMs = ANCHOR_AD.getTime()
  if (adMs < anchorMs || adMs > MAX_AD_MS) {
    throw new RangeError("AD date out of supported range (1943-04-14 … 2033-04-13)")
  }
  let diffDays = Math.floor((adMs - anchorMs) / 86400000)

  let year = ANCHOR_BS.year
  let month = ANCHOR_BS.month
  let day = ANCHOR_BS.day

  // Forward only — anchor is the range minimum
  while (diffDays > 0) {
    const dim = bsDaysInMonth(year, month)
    const remaining = dim - day
    if (diffDays <= remaining) {
      day += diffDays
      diffDays = 0
    } else {
      diffDays -= remaining + 1
      month++
      day = 1
      if (month > 12) { month = 1; year++ }
    }
  }

  return { year, month, day }
}

// ─── BS → AD ───────────────────────────────────────────────────────
export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date {
  if (!Number.isInteger(bsYear) || bsYear < MIN_BS_YEAR || bsYear > MAX_BS_YEAR) {
    throw new RangeError("BS year out of supported range (2000–2090)")
  }
  if (!Number.isInteger(bsMonth) || bsMonth < 1 || bsMonth > 12) {
    throw new RangeError("BS month must be 1–12")
  }
  const dim = bsDaysInMonth(bsYear, bsMonth)
  if (!Number.isInteger(bsDay) || bsDay < 1 || bsDay > dim) {
    throw new RangeError(`BS day out of range for ${bsYear}-${bsMonth} (1–${dim})`)
  }

  // Count days from anchor to target BS date
  let totalDays = 0
  for (let y = ANCHOR_BS.year; y < bsYear; y++) {
    totalDays += bsYearLength(y)
  }
  for (let m = ANCHOR_BS.month; m < bsMonth; m++) {
    totalDays += bsDaysInMonth(bsYear, m)
  }
  totalDays += bsDay - ANCHOR_BS.day

  const result = new Date(ANCHOR_AD.getTime() + totalDays * 86400000)
  return new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth(), result.getUTCDate()))
}

// ─── Formatting helpers ────────────────────────────────────────────
const BS_MONTH_NAMES = [
  "Baisakh", "Jeth", "Asar", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
]

export function formatBsDate(date: Date): string {
  const bs = adToBs(date)
  return `${BS_MONTH_NAMES[bs.month - 1]} ${bs.day}, ${bs.year} BS`
}

/** Format as "Mon DD, YYYY (BS Month DD, YYYY BS)" */
export function formatDualDate(date: Date): string {
  const ad = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const bs = adToBs(date)
  const bsMonth = BS_MONTH_NAMES[bs.month - 1]
  return `${ad} (${bsMonth} ${bs.day}, ${bs.year} BS)`
}

/** Format as "YYYY-MM-DD" in BS */
export function formatBsDateIso(date: Date): string {
  const bs = adToBs(date)
  return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`
}

export { BS_MONTH_NAMES }
