import { describe, it, expect } from "vitest";
import { buildIcsCalendar, escapeIcsText, foldIcsLine, googleCalendarUrl } from "../event-ics";

const EVENT = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "HackDay Butwal, 2026; Day 1",
  description: "Line one\nLine two",
  location: "Butwal, Nepal",
  slug: "hackday-butwal",
  start_date: "2026-01-17T02:15:00Z",
  end_date: "2026-01-17T12:45:00Z",
};

describe("escapeIcsText", () => {
  it("escapes backslashes, semicolons, commas and newlines", () => {
    expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("foldIcsLine", () => {
  it("leaves short lines alone and folds long ones at 75 octets", () => {
    expect(foldIcsLine("SUMMARY:short")).toBe("SUMMARY:short");
    const folded = foldIcsLine("DESCRIPTION:" + "x".repeat(200));
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(2);
    expect(parts.every((p) => new TextEncoder().encode(p).length <= 75)).toBe(true);
    expect(parts.slice(1).every((p) => p.startsWith(" "))).toBe(true);
  });
  it("never splits a multi-byte character", () => {
    const folded = foldIcsLine("SUMMARY:" + "नेपाल".repeat(20));
    expect(folded.split("\r\n ").join("")).toBe("SUMMARY:" + "नेपाल".repeat(20));
  });
});

describe("buildIcsCalendar", () => {
  it("produces one VEVENT with UTC times, escaped text and the event URL", () => {
    const ics = buildIcsCalendar([EVENT], "https://butwalhacks.com", ["X-WR-CALNAME:HackDay"], new Date("2026-01-01T00:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20260117T021500Z");
    expect(ics).toContain("DTEND:20260117T124500Z");
    expect(ics).toContain("SUMMARY:HackDay Butwal\\, 2026\\; Day 1");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
    expect(ics).toContain("URL:https://butwalhacks.com/events/hackday-butwal");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
  it("skips an event whose start cannot be read", () => {
    const ics = buildIcsCalendar([{ ...EVENT, start_date: "nope" }], "https://butwalhacks.com", []);
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});

describe("googleCalendarUrl", () => {
  it("builds a template link with the event dates and page", () => {
    const url = new URL(googleCalendarUrl(EVENT, "https://butwalhacks.com"));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20260117T021500Z/20260117T124500Z");
    expect(url.searchParams.get("details")).toContain("https://butwalhacks.com/events/hackday-butwal");
  });
});
