import { describe, it, expect } from "vitest";
import { toDisplayRole, getExplorerStats, type ExplorerMember } from "@/lib/members";

describe("toDisplayRole", () => {
  it("maps lowercase DB roles to directory roles", () => {
    expect(toDisplayRole("hacker")).toBe("Builder");
    expect(toDisplayRole("mentor")).toBe("Mentor");
    expect(toDisplayRole("organizer")).toBe("Organizer");
    expect(toDisplayRole("maintainer")).toBe("Organizer");
    expect(toDisplayRole("sponsor")).toBe("Sponsor");
  });

  it("defaults unknown and null roles to Builder", () => {
    expect(toDisplayRole(null)).toBe("Builder");
    expect(toDisplayRole("HACKER")).toBe("Builder");
    expect(toDisplayRole("whatever")).toBe("Builder");
  });
});

describe("getExplorerStats", () => {
  it("counts normalized roles so the Builders tile never sticks at zero", () => {
    const members = [
      { role: "Builder" },
      { role: "Builder" },
      { role: "Organizer" },
    ] as ExplorerMember[];
    const stats = getExplorerStats(members);
    expect(stats.total).toBe(3);
    expect(stats.byRole.Builder).toBe(2);
    expect(stats.byRole.Organizer).toBe(1);
  });
});
