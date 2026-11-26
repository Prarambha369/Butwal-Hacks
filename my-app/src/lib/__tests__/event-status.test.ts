import { describe, it, expect } from "vitest";
import {
  CLOSING_SOON_MS,
  eventPhase,
  formatEventDateRange,
  formatEventTimeRange,
  isOnlineLocation,
  mapSearchUrl,
  partitionEvents,
  registrationOpen,
} from "../event-status";

const HOUR = 3600_000;
const ev = (start: string, end: string, id = start) => ({ id, start_date: start, end_date: end });

describe("eventPhase", () => {
  const start = Date.parse("2027-01-15T03:15:00Z");
  const e = ev("2027-01-15T03:15:00Z", "2027-01-17T12:15:00Z");

  it("is open well before the start", () => {
    expect(eventPhase(e, start - CLOSING_SOON_MS - HOUR)).toBe("open");
  });
  it("is closing soon in the last 72 hours before the start", () => {
    expect(eventPhase(e, start - CLOSING_SOON_MS + HOUR)).toBe("closing-soon");
  });
  it("is live between start and end", () => {
    expect(eventPhase(e, start + HOUR)).toBe("live");
  });
  it("is past after the end", () => {
    expect(eventPhase(e, Date.parse("2027-01-17T12:16:00Z"))).toBe("past");
  });
  it("treats an unreadable end as the start, never live forever", () => {
    expect(eventPhase(ev("2027-01-15T03:15:00Z", "nope"), start + HOUR)).toBe("past");
  });
  it("offers registration only before the start", () => {
    expect(registrationOpen("open")).toBe(true);
    expect(registrationOpen("closing-soon")).toBe(true);
    expect(registrationOpen("live")).toBe(false);
    expect(registrationOpen("past")).toBe(false);
  });
});

describe("partitionEvents", () => {
  const now = Date.parse("2026-11-26T00:00:00Z");
  const past1 = ev("2025-10-10T10:00:00Z", "2025-10-11T18:35:00Z", "daydream");
  const past2 = ev("2026-01-17T02:15:00Z", "2026-01-17T12:45:00Z", "hackday");
  const soon = ev("2026-12-01T03:00:00Z", "2026-12-01T12:00:00Z", "soon");
  const later = ev("2027-01-15T03:15:00Z", "2027-01-17T12:15:00Z", "later");
  const live = ev("2026-11-25T03:00:00Z", "2026-11-27T12:00:00Z", "live");

  it("features the soonest live-or-upcoming event, then upcoming by date, past newest first", () => {
    const { featured, upcoming, past } = partitionEvents([later, past1, soon, past2], now);
    expect(featured?.id).toBe("soon");
    expect(upcoming.map((e) => e.id)).toEqual(["later"]);
    expect(past.map((e) => e.id)).toEqual(["hackday", "daydream"]);
  });
  it("counts a live event as the featured one", () => {
    expect(partitionEvents([later, live], now).featured?.id).toBe("live");
  });
  it("has no featured event when everything is past", () => {
    const result = partitionEvents([past1, past2], now);
    expect(result.featured).toBeNull();
    expect(result.upcoming).toEqual([]);
  });
});

describe("formatting (Nepal time, identical on server and client)", () => {
  it("formats a same-day event once, with the zone named once", () => {
    const e = ev("2026-01-17T02:15:00Z", "2026-01-17T12:45:00Z");
    expect(formatEventDateRange(e)).toBe("Sat, Jan 17, 2026");
    expect(formatEventTimeRange(e)).toBe("8:00 AM – 6:30 PM NPT");
  });
  it("formats a multi-day range without repeating the year", () => {
    expect(formatEventDateRange(ev("2027-01-15T03:15:00Z", "2027-01-17T12:15:00Z"))).toBe(
      "Fri, Jan 15 – Jan 17, 2027",
    );
  });
  it("uses the Nepal date, not the UTC date, near midnight", () => {
    // 20:00 UTC is 01:45 the next day in Kathmandu.
    expect(formatEventDateRange(ev("2026-03-01T20:00:00Z", "2026-03-01T21:00:00Z"))).toBe("Mon, Mar 2, 2026");
  });
});

describe("location helpers", () => {
  it("recognises online-only venues, not physical venues that mention a stream", () => {
    expect(isOnlineLocation("Online (Discord)")).toBe(true);
    expect(isOnlineLocation("Online via Zoom")).toBe(true);
    expect(isOnlineLocation("Virtual")).toBe(true);
    expect(isOnlineLocation("Butwal campus (online stream available)")).toBe(false);
    expect(isOnlineLocation("Online via Zoom and in person at Butwal campus")).toBe(false);
    expect(isOnlineLocation("Hybrid: online + Lumbini World School")).toBe(false);
    expect(isOnlineLocation("Arambha Resort, Butwal, Nepal")).toBe(false);
    expect(isOnlineLocation(null)).toBe(false);
  });
  it("builds a keyless Google Maps search link", () => {
    expect(mapSearchUrl("Butwal, Nepal")).toBe("https://www.google.com/maps/search/?api=1&query=Butwal%2C%20Nepal");
  });
});
