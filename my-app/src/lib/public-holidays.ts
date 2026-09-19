/**
 * Lumbini public holidays — type + rollup over the per-year files.
 *
 * Layer 3 of the calendar, next to BH events (dashboard DB) and Samiti
 * festivals (festivals-2083.ts). The three layers are independent: this
 * file never reads the events table and never changes festival dates.
 */
import { PUBLIC_HOLIDAYS_2026 } from "./public-holidays-2026";
import { PUBLIC_HOLIDAYS_2027 } from "./public-holidays-2027";

export interface PublicHolidayEntry {
  slug: string;
  nameEn: string;
  nameNe: string;
  kind: "holiday" | "observance";
  /** [BS year, month, day] — engine conversion, asserted in tests. */
  bs: [number, number, number];
  /** [AD year, month, day] — verbatim from the OfficeHolidays feed. */
  ad: [number, number, number];
}

export const PUBLIC_HOLIDAYS: PublicHolidayEntry[] = [
  ...PUBLIC_HOLIDAYS_2026,
  ...PUBLIC_HOLIDAYS_2027,
];

export function getPublicHolidays(year?: number): PublicHolidayEntry[] {
  if (year === undefined) return PUBLIC_HOLIDAYS;
  return PUBLIC_HOLIDAYS.filter((h) => h.ad[0] === year);
}
