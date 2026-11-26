/**
 * iCalendar (RFC 5545) text for Butwal Hacks events.
 *
 * Shared by the all-events feed and the single-event download at
 * /api/events/ical?slug=<slug>, so both escape and fold the same way.
 * Served from a same-origin route rather than a `data:` URI: iOS Safari does
 * not reliably hand a data-URI .ics to Calendar, but it does open a
 * `text/calendar` response.
 */

export interface IcsEvent {
  id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  slug: string | null;
  start_date: string;
  end_date: string | null;
}

/** Escape text per RFC 5545 (backslashes, semicolons, commas, newlines). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function toIcsUtc(value: string | Date): string | null {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Fold a content line at 75 octets (RFC 5545 §3.1). Long descriptions are
 * otherwise rejected or truncated by stricter clients (Outlook).
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    // Continuation lines start with a space, which counts toward the 75.
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += ch;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** VEVENT lines for one event, or [] when its start date cannot be read. */
export function icsEventLines(event: IcsEvent, siteUrl: string, dtstamp: string): string[] {
  const start = toIcsUtc(event.start_date);
  if (!start) return [];
  const endRaw = event.end_date ? toIcsUtc(event.end_date) : null;
  // Fallback duration when no end date: 2 hours.
  const end =
    endRaw ?? toIcsUtc(new Date(new Date(event.start_date).getTime() + 2 * 3600 * 1000))!;
  const url = event.slug ? `${siteUrl}/events/${event.slug}` : siteUrl;
  return [
    "BEGIN:VEVENT",
    `UID:${event.id}@butwalhacks.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.title ?? "Butwal Hacks event")}`,
    `DESCRIPTION:${escapeIcsText(event.description ?? "")}`,
    `LOCATION:${escapeIcsText(event.location ?? "")}`,
    `URL:${url}`,
    "END:VEVENT",
  ];
}

export function buildIcsCalendar(
  events: readonly IcsEvent[],
  siteUrl: string,
  header: string[],
  now: Date = new Date(),
): string {
  const dtstamp = toIcsUtc(now)!;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Butwal Hacks//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...header,
    ...events.flatMap((e) => icsEventLines(e, siteUrl, dtstamp)),
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

/** Google Calendar "add event" template link. No API, no cost. */
export function googleCalendarUrl(event: IcsEvent, siteUrl: string): string {
  const start = toIcsUtc(event.start_date) ?? "";
  const end = (event.end_date && toIcsUtc(event.end_date)) || start;
  const url = event.slug ? `${siteUrl}/events/${event.slug}` : siteUrl;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title ?? "Butwal Hacks event",
    dates: `${start}/${end}`,
    details: `Details and registration: ${url}`,
    location: event.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
