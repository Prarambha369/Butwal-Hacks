/**
 * BH event categories, inferred from titles.
 *
 * The events table has no category column (adding one needs a migration +
 * dashboard form work), so the calendar derives a coarse category from the
 * event title. Keywords are deliberately specific — anything unmatched is
 * "Meetup", the honest default for a community gathering. When a real
 * `events.category` column lands, delete this file and filter on it.
 */
export type BhEventCategory =
  | "Hackathon"
  | "Workshop"
  | "Game Jam"
  | "Meetup";

const RULES: Array<{ category: BhEventCategory; match: RegExp }> = [
  { category: "Hackathon", match: /hackathon|hackday|hack day|build sprint|ideathon/i },
  { category: "Game Jam", match: /game jam|gamejam/i },
  { category: "Workshop", match: /workshop|bootcamp|training|tech session|masterclass|webinar|seminar|course|class/i },
];

export function categorizeEvent(title: string): BhEventCategory {
  for (const { category, match } of RULES) {
    if (match.test(title)) return category;
  }
  return "Meetup";
}
