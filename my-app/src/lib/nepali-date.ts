/**
 * Nepali (Bikram Sambat) date conversion utilities.
 *
 * BS months have variable lengths (29-32 days) that change yearly,
 * determined by astronomical solar transits. Simple math formulas
 * are inaccurate — a lookup table from the Nepal Panchanga Nirnayak
 * Samiti is the only reliable method.
 *
 * ponytail: lookup table approach. No npm packages needed.
 * Upgrade: extend the table as new years are published.
 */

// ─── BS Month Data (days per month, 1-indexed months) ──────────────
// Source: Nepal Panchanga / official government calendar data.
// Format: { year: [Baisakh, Jeth, Asar, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra] }
const BS_DATA: Record<number, number[]> = {
  2076: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2077: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2078: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2079: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2080: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
}

// ─── Anchor: BS 2082-09-17 = AD 2025-12-31 ────────────────────────
const ANCHOR_AD = new Date(Date.UTC(2025, 11, 31)) // Dec 31, 2025
const ANCHOR_BS = { year: 2082, month: 9, day: 17 }

function bsDaysInMonth(y: number, m: number): number {
  return BS_DATA[y]?.[m - 1] ?? 30 // fallback: most common length
}

// ─── AD → BS ───────────────────────────────────────────────────────
export interface BsDate {
  year: number
  month: number // 1-12
  day: number   // 1-32
}

export function adToBs(adDate: Date): BsDate {
  // Count days from anchor
  const adMs = Date.UTC(adDate.getFullYear(), adDate.getMonth(), adDate.getDate())
  const anchorMs = ANCHOR_AD.getTime()
  let diffDays = Math.floor((adMs - anchorMs) / 86400000)

  let { year, month, day } = ANCHOR_BS

  if (diffDays >= 0) {
    // Forward from anchor
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
  } else {
    // Backward from anchor
    diffDays = -diffDays
    while (diffDays > 0) {
      if (day > diffDays) {
        day -= diffDays
        diffDays = 0
      } else {
        diffDays -= day
        month--
        if (month < 1) { month = 12; year-- }
        day = bsDaysInMonth(year, month)
      }
    }
  }

  return { year, month, day }
}

// ─── BS → AD ───────────────────────────────────────────────────────
export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date {
  // Count days from anchor to target BS date
  let totalDays = 0

  // Days from anchor year to target year
  if (bsYear >= ANCHOR_BS.year) {
    for (let y = ANCHOR_BS.year; y < bsYear; y++) {
      for (let m = 1; m <= 12; m++) totalDays += bsDaysInMonth(y, m)
    }
  } else {
    for (let y = bsYear; y < ANCHOR_BS.year; y++) {
      for (let m = 1; m <= 12; m++) totalDays -= bsDaysInMonth(y, m)
    }
  }

  // Days from anchor month/day to target month/day
  // Direction depends on full date, not just year
  const targetAfterAnchor =
    bsYear > ANCHOR_BS.year ||
    (bsYear === ANCHOR_BS.year && (
      bsMonth > ANCHOR_BS.month ||
      (bsMonth === ANCHOR_BS.month && bsDay >= ANCHOR_BS.day)
    ))

  if (targetAfterAnchor) {
    for (let m = ANCHOR_BS.month; m < bsMonth; m++) {
      totalDays += bsDaysInMonth(bsYear, m)
    }
    totalDays += bsDay - ANCHOR_BS.day
  } else {
    for (let m = bsMonth; m < ANCHOR_BS.month; m++) {
      totalDays -= bsDaysInMonth(bsYear, m)
    }
    totalDays -= ANCHOR_BS.day - bsDay
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

export { BS_MONTH_NAMES }
