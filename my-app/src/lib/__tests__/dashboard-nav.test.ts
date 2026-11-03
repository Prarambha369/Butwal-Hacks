import { describe, expect, it } from "vitest";
import type { DashboardNavItem } from "@/components/dashboard-command-palette";
import type { NavLink } from "@/components/sidebar-config";
import {
  hackerNav,
  organizerNav,
  maintainerNav,
  sponsorNav,
  sectionGroups,
} from "@/lib/dashboard-nav";

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
  "/dashboard/hacker/connections",
  "/dashboard/hacker/chat",
];

// Hrefs of the four inline layout arrays this module replaces, in their order.
const EXPECTED: Record<string, string[]> = {
  hackerNav: INLINE_HREFS,
  organizerNav: [
    "/dashboard/organizer",
    "/dashboard/organizer/events",
    "/dashboard/organizer/work",
    "/dashboard/organizer/issue-marker",
    "/dashboard/organizer/certificates/templates",
    "/dashboard/organizer/api-keys",
  ],
  maintainerNav: [
    "/dashboard/maintainer",
    "/dashboard/maintainer/users",
    "/dashboard/maintainer/system-check",
    "/dashboard/maintainer/audit-log",
    "/dashboard/maintainer/trust-override",
    "/dashboard/maintainer/site-config",
    "/dashboard/maintainer/photos",
    "/dashboard/maintainer/partners",
    "/dashboard/maintainer/chapters",
    "/dashboard/maintainer/blog",
    "/api-docs",
    "/dashboard/maintainer/dedicate-school",
  ],
  sponsorNav: [
    "/portal/sponsors",
    "/portal/recruiters",
    "/portal/bounties",
    "/portal/sponsors/company",
  ],
};

describe.each([
  ["hackerNav", hackerNav],
  ["organizerNav", organizerNav],
  ["maintainerNav", maintainerNav],
  ["sponsorNav", sponsorNav],
])("%s", (name, nav) => {
  it("matches the inline array it was extracted from: same count, same order", () => {
    expect(nav).toHaveLength(EXPECTED[name].length);
    expect(nav.map((item) => item.href)).toEqual(EXPECTED[name]);
  });

  it("gives every item a non-empty label and a root-relative href", () => {
    for (const item of nav) {
      expect(item.label.trim()).not.toBe("");
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("keeps hrefs unique", () => {
    const hrefs = nav.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps shortcuts unique and non-empty", () => {
    const shortcuts = nav.map((item) => item.shortcut);
    for (const shortcut of shortcuts) {
      expect(shortcut.trim()).not.toBe("");
    }
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });

  it("declares a non-empty section on every item, in at most three groups", () => {
    const sections = nav.map((item) => item.section);
    for (const section of sections) {
      expect(typeof section).toBe("string");
      expect(section?.trim()).not.toBe("");
    }
    expect(new Set(sections).size).toBeLessThanOrEqual(3);
  });

  it("carries an icon node on every item", () => {
    for (const item of nav) {
      expect(item.icon).toBeTruthy();
    }
  });

  it("is assignable to both nav consumers without casts", () => {
    const sidebarLinks: NavLink[] = nav;
    const paletteLinks: DashboardNavItem[] = nav;

    expect(sidebarLinks).toHaveLength(nav.length);
    expect(paletteLinks).toHaveLength(nav.length);
  });
});

describe("hackerNav", () => {
  it("keeps the pre-extraction contract: items in inline order", () => {
    expect(hackerNav.map((item) => item.href)).toEqual(INLINE_HREFS);
  });
});

describe("sectionGroups", () => {
  it("groups adjacent same-section runs in array order", () => {
    const groups = sectionGroups(maintainerNav);
    expect(groups.map((g) => g.label)).toEqual(maintainerNav.map((item) => item.section)
      .filter((section, i, arr) => i === 0 || section !== arr[i - 1]));
    // Round-trip: grouping loses no items and preserves the flat order.
    expect(groups.flatMap((g) => g.items)).toEqual(maintainerNav);
  });

  it("renders a single unlabelled group when no link carries a section", () => {
    const links = [
      { href: "/a", label: "A", section: undefined },
      { href: "/b", label: "B", section: undefined },
    ];
    expect(sectionGroups(links)).toEqual([{ label: null, items: links }]);
  });

  it("treats blank section labels as ungrouped", () => {
    const links = [{ section: "  " }];
    expect(sectionGroups(links)).toEqual([{ label: null, items: links }]);
  });
});
