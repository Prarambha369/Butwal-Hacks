import { adToBs, BS_MONTH_NAMES } from "@/lib/nepali-date";

/**
 * Event timing, derived from dates only.
 *
 * There is no capacity, waitlist or registration deadline in the schema
 * (events has start_date/end_date; event_registrations has no limit), and
 * /api/events/register enforces none. So the only states the UI can truthfully
 * show come from the clock:
 *
 *   open          registration open, more than CLOSING_SOON_MS before start
 *   closing-soon  the event starts within CLOSING_SOON_MS; the public pages
 *                 stop offering registration at the start time, so this is
 *                 the last window to sign up
 *   live          started and not yet ended
 *   past          ended
 *
 * "Full" and "Join waitlist" are deliberately absent: there is no data behind
 * them, and inventing them would be a new backend rule.
 */

export type EventPhase = "open" | "closing-soon" | "live" | "past";

export const CLOSING_SOON_MS = 72 * 60 * 60 * 1000;

/** Nepal Standard Time. Every event is run from Butwal. */
export const EVENT_TIME_ZONE = "Asia/Kathmandu";

interface Timed {
  start_date: string;
  end_date: string;
}

export function eventPhase(event: Timed, now: number): EventPhase {
  const start = Date.parse(event.start_date);
  const end = Date.parse(event.end_date);
  // An unparseable end falls back to the start, so a broken row reads as past
  // once it has started instead of "live forever".
  const endsAt = Number.isNaN(end) ? start : end;
  if (now > endsAt) return "past";
  if (now >= start) return "live";
  if (start - now <= CLOSING_SOON_MS) return "closing-soon";
  return "open";
}

/** Registration is offered on the public pages until the event starts. */
export function registrationOpen(phase: EventPhase): boolean {
  return phase === "open" || phase === "closing-soon";
}

export const PHASE_LABEL: Record<EventPhase, string> = {
  open: "Registration open",
  "closing-soon": "Closing soon",
  live: "Happening now",
  past: "Past event",
};

/**
 * Split published events into the list page's sections.
 *
 * Live events count as upcoming (they are still the thing to show first).
 * The featured event is the soonest one that is live or still open; the rest
 * of the upcoming list follows in date order, past events newest first.
 */
export function partitionEvents<T extends Timed>(
  events: readonly T[],
  now: number,
): { featured: T | null; upcoming: T[]; past: T[] } {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const e of events) {
    if (eventPhase(e, now) === "past") past.push(e);
    else upcoming.push(e);
  }
  upcoming.sort((a, b) => Date.parse(a.start_date) - Date.parse(b.start_date));
  past.sort((a, b) => Date.parse(b.start_date) - Date.parse(a.start_date));
  const [featured = null, ...rest] = upcoming;
  return { featured, upcoming: rest, past };
}

const dayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const shortDayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  month: "short",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});
const yearFmt = new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIME_ZONE, year: "numeric" });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * "Sat, Jan 17, 2026" or "Fri, Jan 15 – Jan 17, 2027", in Nepal time.
 * Computed with an explicit time zone so server and client render the same
 * string (no hydration mismatch between a UTC server and a +05:45 browser).
 */
export function formatEventDateRange(event: Timed): string {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  if (Number.isNaN(start.getTime())) return "";
  if (Number.isNaN(end.getTime()) || dayKeyFmt.format(start) === dayKeyFmt.format(end)) {
    return dayFmt.format(start);
  }
  // "Fri, Jan 15, 2027" → drop the year from the first half when both share it.
  const endYear = yearFmt.format(end);
  const sameYear = yearFmt.format(start) === endYear;
  const first = sameYear ? dayFmt.format(start).replace(/, \d{4}$/, "") : dayFmt.format(start);
  return `${first} – ${sameYear ? `${shortDayFmt.format(end)}, ${endYear}` : dayFmt.format(end)}`;
}

/** "9:00 AM – 6:30 PM NPT" — the zone is named once, not per time. */
export function formatEventTimeRange(event: Timed): string {
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  if (Number.isNaN(start.getTime())) return "";
  if (Number.isNaN(end.getTime())) return `${timeFmt.format(start)} NPT`;
  return `${timeFmt.format(start)} – ${timeFmt.format(end)} NPT`;
}

/**
 * The start date in Bikram Sambat ("Magh 1, 2083 BS"). adToBs works on the
 * Nepal calendar day, so server and browser agree. Empty outside the
 * converter's supported range.
 */
export function formatEventBsDate(event: Pick<Timed, "start_date">): string {
  const start = new Date(event.start_date);
  if (Number.isNaN(start.getTime())) return "";
  try {
    const bs = adToBs(start);
    return `${BS_MONTH_NAMES[bs.month - 1]} ${bs.day}, ${bs.year} BS`;
  } catch {
    return "";
  }
}

/**
 * Online-only venues: the location *starts* with an online word or names a
 * platform ("Online", "Virtual", "Online via Zoom", "Discord"). A physical
 * venue that merely mentions a stream ("Butwal campus (online stream
 * available)") stays physical, so directions and the offline JSON-LD mode
 * remain.
 */
export function isOnlineLocation(location: string | null | undefined): boolean {
  if (!location) return false;
  return /^\s*(online|virtual|remote|zoom|discord|google meet|microsoft teams)\b/i.test(location);
}

/** Google Maps search link for a venue. No API key, no embed, no cost. */
export function mapSearchUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
