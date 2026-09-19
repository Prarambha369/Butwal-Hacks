import { describe, it, expect } from "vitest";
import { categorizeEvent } from "@/lib/event-categories";

describe("categorizeEvent", () => {
  it("matches known formats", () => {
    expect(categorizeEvent("Summer HackDay 2026")).toBe("Hackathon");
    expect(categorizeEvent("48-hour hackathon")).toBe("Hackathon");
    expect(categorizeEvent("Game Jam 2025")).toBe("Game Jam");
    expect(categorizeEvent("Intro to Git Workshop")).toBe("Workshop");
    expect(categorizeEvent("React Bootcamp")).toBe("Workshop");
    expect(categorizeEvent("Monthly tech session")).toBe("Workshop");
  });

  it("defaults unknowns to Meetup, never to a wrong format", () => {
    expect(categorizeEvent("Chiya & Code Evening")).toBe("Meetup");
    expect(categorizeEvent("")).toBe("Meetup");
  });
});
