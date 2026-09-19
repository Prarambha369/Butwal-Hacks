/**
 * Nepali (Bikram Sambat) date conversion utilities.
 *
 * BS months have variable lengths (29-32 days) that change yearly,
 * determined by astronomical solar transits. Simple math formulas
 * are inaccurate — a lookup table is the only reliable method.
 *
 * Dataset: month-length table for BS 1970–2099, assembled from three
 * agreeing sources (all Apache-2.0/MIT/open):
 * - BS 2000–2090: Medic Mobile `bikram-sambat` dataset
 *   (test-data/daysInMonth.json, battle-tested in health deployments).
 * - BS 1976–1999, 2091–2092, 2099: OpenNP `nepali-dates` 1:1 daily
 *   mappings. Cross-checked month-by-month; splice boundaries verified
 *   exact (1999-12-31 = 1943-04-13 meets the 2000 anchor; adbs months
 *   1–8 + opennp months 9–12 meet at 1976-09-01 = 1919-12-16).
 * - BS 1970–1975, 2093–2098: dhiraj-var `adbs` yearly table (chain
 *   continuous, anchor 1970-01-01 = 1913-04-13 corroborated by two
 *   sources). Caveats: 1972/1974 per-month splits are the source's own
 *   best-effort pick; 2091+ are projections (no Samiti publication that
 *   far out) — verify before trusting.
 * Where opennp and adbs disagreed on a month split (10 years in
 * 1976–1999, always one borderline day), the daily-mapped source wins:
 * a month table derived from actual day mappings cannot misplace days.
 *
 * Anchor: BS 2000-01-01 = AD 1943-04-14 (classic reference epoch,
 * consistent with the table's cumulative day counts).
 *
 * Supported range: BS 1970-01-01 … BS 2099-12-30
 * (AD 1913-04-13 … AD 2043-04-13). Chaitra 2090/2099 have 30 days.
 * Out-of-range inputs throw RangeError.
 */

// ─── BS Month Data (days per month, 1-indexed months) ──────────────
// Format: { year: [Baisakh, Jeth, Asar, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra] }
const BS_DATA: Record<number, number[]> = {
  // 1970–1975: adbs yearly table (single source; 1972/1974 month splits
  // are the source's best-effort pick — see header).
  1970: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  1971: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  1972: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  1973: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  1974: [31, 31, 32, 30, 31, 31, 30, 29, 30, 29, 30, 31],
  1975: [31, 31, 32, 32, 30, 31, 30, 29, 30, 29, 30, 30],
  // 1976: adbs months 1–8 + opennp months 9–12 (splice verified exact).
  1976: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 1977–1999: opennp daily mappings ( win over adbs on 10 disputed years).
  1977: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  1978: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  1979: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  1980: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  1981: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  1982: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  1983: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  1984: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  1985: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  1986: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  1987: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  1988: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  1989: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  1990: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  1991: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  1992: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  1993: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  1994: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  1995: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  1996: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  1997: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  1998: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  1999: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
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
  // 2091+: projected — no Samiti publication this far out. 2091, 2092,
  // 2099 from opennp daily mappings; 2093–2098 single-source (adbs).
  // NOTE: 2096 sums to 364 days in the source (verify before trusting).
  2091: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2092: [30, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2093: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2094: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2095: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2096: [30, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2097: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2098: [31, 31, 32, 31, 31, 31, 29, 30, 29, 30, 29, 31],
  2099: [31, 31, 32, 31, 31, 31, 30, 29, 29, 30, 30, 30],
}

// ─── Range: BS 1970-01-01 … BS 2099-12-30 ─────────────────────────
const MIN_BS_YEAR = 1970
const MAX_BS_YEAR = 2099
// Classic anchor: BS 2000-01-01 = AD 1943-04-14. Walks run both
// directions from here (forward for modern dates, back for history).
const ANCHOR_AD = new Date(Date.UTC(1943, 3, 14))
const ANCHOR_BS = { year: 2000, month: 1, day: 1 }

function bsYearLength(y: number): number {
  return (BS_DATA[y] ?? []).reduce((a, b) => a + b, 0)
}

// Inclusive supported AD edges, derived from the table (sums must stay
// positive — every year in range is verified 364–366 days).
const MIN_AD_MS = (() => {
  let total = 0
  for (let y = MIN_BS_YEAR; y < ANCHOR_BS.year; y++) total += bsYearLength(y)
  return ANCHOR_AD.getTime() - total * 86400000
})()
const MAX_AD_MS = (() => {
  let total = 0
  for (let y = ANCHOR_BS.year; y <= MAX_BS_YEAR; y++) total += bsYearLength(y)
  return ANCHOR_AD.getTime() + (total - 1) * 86400000
})()

export function bsDaysInMonth(y: number, m: number): number {
  const dim = BS_DATA[y]?.[m - 1]
  if (dim === undefined) throw new RangeError(`BS date out of supported range (2000–2090): ${y}-${m}`)
  return dim
}

// Calendar days are Nepal days: derive Y/M/D in Asia/Kathmandu so a
// UTC-midnight event timestamp never shifts ±1 day for the viewer.
// (The old local-getter version broke in negative-offset timezones.)
const NPT_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kathmandu",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export function nptDayParts(d: Date): { y: number; m: number; day: number } {
  const parts: Record<string, string> = {}
  for (const p of NPT_DAY.formatToParts(d)) {
    if (p.type !== "literal") parts[p.type] = p.value
  }
  return { y: Number(parts.year), m: Number(parts.month), day: Number(parts.day) }
}

function adToMsUTC(d: Date): number {
  const { y, m, day } = nptDayParts(d)
  return Date.UTC(y, m - 1, day)
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
  if (adMs < MIN_AD_MS || adMs > MAX_AD_MS) {
    throw new RangeError("AD date out of supported range (1913-04-13 … 2043-04-13)")
  }
  let diffDays = Math.round((adMs - anchorMs) / 86400000)

  let year = ANCHOR_BS.year
  let month = ANCHOR_BS.month
  let day = ANCHOR_BS.day

  // Forward from the anchor (modern dates)
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

  // Backward from the anchor (history before BS 2000)
  while (diffDays < 0) {
    if (day + diffDays >= 1) {
      day += diffDays
      diffDays = 0
    } else {
      month--
      if (month < 1) { month = 12; year-- }
      const dim = bsDaysInMonth(year, month)
      diffDays += day
      day = dim
    }
  }

  return { year, month, day }
}

// ─── BS → AD ───────────────────────────────────────────────────────
export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date {
  if (!Number.isInteger(bsYear) || bsYear < MIN_BS_YEAR || bsYear > MAX_BS_YEAR) {
    throw new RangeError("BS year out of supported range (1970–2099)")
  }
  if (!Number.isInteger(bsMonth) || bsMonth < 1 || bsMonth > 12) {
    throw new RangeError("BS month must be 1–12")
  }
  const dim = bsDaysInMonth(bsYear, bsMonth)
  if (!Number.isInteger(bsDay) || bsDay < 1 || bsDay > dim) {
    throw new RangeError(`BS day out of range for ${bsYear}-${bsMonth} (1–${dim})`)
  }

  // Count days from the anchor to the target BS date, both directions.
  let totalDays = 0
  if (bsYear >= ANCHOR_BS.year) {
    for (let y = ANCHOR_BS.year; y < bsYear; y++) {
      totalDays += bsYearLength(y)
    }
  } else {
    for (let y = bsYear; y < ANCHOR_BS.year; y++) {
      totalDays -= bsYearLength(y)
    }
  }
  if (bsYear === ANCHOR_BS.year) {
    for (let m = ANCHOR_BS.month; m < bsMonth; m++) {
      totalDays += bsDaysInMonth(bsYear, m)
    }
    totalDays += bsDay - ANCHOR_BS.day
  } else if (bsYear > ANCHOR_BS.year) {
    for (let m = 1; m < bsMonth; m++) {
      totalDays += bsDaysInMonth(bsYear, m)
    }
    totalDays += bsDay - 1
  } else {
    for (let m = 1; m < bsMonth; m++) {
      totalDays += bsDaysInMonth(bsYear, m)
    }
    totalDays += bsDay - 1
  }

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

const BS_MONTH_NAMES_NE = [
  "बैशाख", "जेठ", "असार", "साउन",
  "भदौ", "असोज", "कात्तिक", "मंसिर",
  "पुष", "माघ", "फागुन", "चैत",
]

export { BS_MONTH_NAMES, BS_MONTH_NAMES_NE }
