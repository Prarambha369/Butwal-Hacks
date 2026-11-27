import { describe, expect, it } from "vitest";
import { externalRegistrationUrl } from "@/lib/external-registration";
import { cardAction } from "@/components/events/event-card";
import type { PublicEvent } from "@/components/events/event-types";

const event = (slug: string) =>
  ({ id: "e", title: "T", slug, description: null, start_date: "2027-01-15T03:15:00Z", end_date: "2027-01-17T12:15:00Z", location: null, banner_url: null }) satisfies PublicEvent;

describe("externalRegistrationUrl", () => {
  it("sends CyberUtsav Lumbini to CyberUtsav's registration site", () => {
    expect(externalRegistrationUrl("cyberutsav-lumbini")).toBe("https://registration.cyberutsav.com/butwal");
  });
  it("is null for in-site events and inherited keys", () => {
    expect(externalRegistrationUrl("hackday-butwal")).toBeNull();
    expect(externalRegistrationUrl("constructor")).toBeNull();
    expect(externalRegistrationUrl(undefined)).toBeNull();
  });
});

describe("cardAction", () => {
  it("links the CyberUtsav card straight out while registration is open", () => {
    expect(cardAction(event("cyberutsav-lumbini"), "open")).toEqual({
      label: "Register",
      href: "https://registration.cyberutsav.com/butwal",
      external: true,
    });
  });
  it("keeps in-site registration for other events", () => {
    expect(cardAction(event("hackday-butwal"), "open").href).toBe("/events/hackday-butwal#register");
  });
  it("still offers the recap after the event", () => {
    expect(cardAction(event("cyberutsav-lumbini"), "past").href).toBe("/events/cyberutsav-lumbini#recap");
  });
});
