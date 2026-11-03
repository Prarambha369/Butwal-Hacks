import { describe, expect, it } from "vitest";
import type { DashboardNavItem } from "@/components/dashboard-command-palette";
import type { NavLink } from "@/components/sidebar-config";
import { hackerNav, type NavItem } from "@/lib/dashboard-nav";

// Hrefs of the inline `hackerLinks` array in hacker/layout.tsx, in its order.
const INLINE_HREFS = [
  "/dashboard/hacker",
  "/dashboard/profile",
  "/dashboard/hacker/work",
  "/dashboard/hacker/projects",
  "/dashboard/hacker/certificates",
  "/teams",
  "/dashboard/hacker/team-matching",
  "/dashboard/hacker/api-keys",
  "/dashboard/hacker/skills",
  "/dashboard/hacker/chat",
];

describe("hackerNav", () => {
  it("matches the inline array it was extracted from: 10 items, same order", () => {
    expect(hackerNav).toHaveLength(10);
    expect(hackerNav.map((item) => item.href)).toEqual(INLINE_HREFS);
  });

  it("gives every item a non-empty label and a root-relative href", () => {
    for (const item of hackerNav) {
      expect(item.label.trim()).not.toBe("");
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("keeps hrefs unique", () => {
    const hrefs = hackerNav.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps shortcuts unique and non-empty", () => {
    const shortcuts = hackerNav.map((item) => item.shortcut);
    for (const shortcut of shortcuts) {
      expect(shortcut.trim()).not.toBe("");
    }
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });

  it("declares a non-empty section on every item, in at most three groups", () => {
    const sections = hackerNav.map((item) => item.section);
    for (const section of sections) {
      expect(typeof section).toBe("string");
      expect(section?.trim()).not.toBe("");
    }
    expect(new Set(sections).size).toBeLessThanOrEqual(3);
  });

  it("carries an icon node on every item", () => {
    for (const item of hackerNav) {
      expect(item.icon).toBeTruthy();
    }
  });

  it("is readonly and assignable to both nav consumers without casts", () => {
    const typed: readonly NavItem[] = hackerNav;
    const sidebarLinks: NavLink[] = [...typed];
    const paletteLinks: DashboardNavItem[] = [...typed];

    expect(typed).toBe(hackerNav);
    expect(sidebarLinks).toHaveLength(typed.length);
    expect(paletteLinks).toHaveLength(typed.length);
  });
});
