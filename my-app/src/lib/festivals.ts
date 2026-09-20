/**
 * All festivals across BS years — one rollup for the calendar, festival
 * pages, and sitemap.
 *
 * - 2083 is Samiti-seeded (authoritative, human writeups).
 * - Other years are Hamro Patro-feed imports (major observances only)
 *   with human one-line writeups.
 */
import { FESTIVALS_2081 } from "./festivals-2081";
import { FESTIVALS_2082 } from "./festivals-2082";
import { FESTIVALS_2083, TRADITION_META, type FestivalEntry, type FestivalTradition } from "./festivals-2083";

export type { FestivalEntry, FestivalTradition };
export { TRADITION_META };

export const ALL_FESTIVALS: FestivalEntry[] = [
  ...FESTIVALS_2081,
  ...FESTIVALS_2082,
  ...FESTIVALS_2083,
];

export function getFestivalAll(slug: string) {
  return ALL_FESTIVALS.find((f) => f.slug === slug) ?? null;
}

export function getFestivalsByGroupAll(group: string, year: number) {
  return ALL_FESTIVALS.filter((f) => f.bs[0] === year && f.group === group);
}
