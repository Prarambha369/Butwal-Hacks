import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { calculateLevel } from "@/lib/gamification/levels";

describe("cn (clsx + tailwind-merge)", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });
});

describe("calculateLevel", () => {
  it("returns level 1 for 0 xp", () => {
    const level = calculateLevel(0);
    expect(level.level).toBe(1);
  });

  it("returns highest level for high xp", () => {
    const level = calculateLevel(10000);
    expect(level.level).toBe(5);
  });

  it("returns a level with name and color", () => {
    const level = calculateLevel(250);
    expect(level).toHaveProperty("name");
    expect(level).toHaveProperty("color");
  });
});
