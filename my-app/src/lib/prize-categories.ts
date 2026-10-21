/**
 * Prize categories a project can opt into.
 *
 * A project opts into the categories it wants to be considered for. Opting
 * into none is valid — a project is still eligible for the overall awards.
 *
 * These are global for now. The events table has no prize configuration, so
 * an organizer cannot yet define a per-event list; when that column lands,
 * this becomes the fallback set rather than the only one.
 */
export const PRIZE_CATEGORIES = [
  "Overall Winner",
  "Best Design",
  "Best Technical Implementation",
  "Best Use of AI",
  "Best Social Impact",
  "Community Choice",
  "Sponsor Prize",
] as const;

export type PrizeCategory = (typeof PRIZE_CATEGORIES)[number];

export const isPrizeCategory = (value: string): value is PrizeCategory =>
  (PRIZE_CATEGORIES as readonly string[]).includes(value);
