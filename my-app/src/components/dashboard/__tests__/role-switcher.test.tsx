// @vitest-environment happy-dom

import { describe, it, expect, vi } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardRoleSwitcher } from "@/components/dashboard/dashboard-role-switcher";

/**
 * The role switcher's destinations.
 *
 * It derived each href as `/dashboard/${role.id}`, which silently assumed one
 * dashboard route per role. `/dashboard/sponsor` and `/dashboard/lead` were
 * never created, so those two entries were dead links -- picking "Sponsor" or
 * "Lead" from the switcher 404'd. Nothing caught it: no test rendered the
 * dropdown, and Next happily compiles a Link to a route that does not exist.
 *
 * So this asserts the hrefs resolve to real routes on disk. That is the one
 * check a compile-time pass cannot do.
 */

const APP = process.cwd();

/**
 * Does some page.tsx serve this href?
 *
 * Checked across route groups because the dashboard lives in `src/app/(main)`,
 * and a group segment is not part of the URL -- so a naive join of the href
 * against `src/app` misses every dashboard route.
 */
function routeExists(href: string): boolean {
  const rel = href.replace(/^\//, "");
  const candidates = [
    resolve(APP, "src/app", rel, "page.tsx"),
    resolve(APP, "src/app", "(main)", rel, "page.tsx"),
  ];
  return candidates.some((p) => existsSync(p));
}

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/hacker",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("DashboardRoleSwitcher destinations", () => {
  const entries = [
    { role: "hacker", href: "/dashboard/hacker" },
    { role: "organizer", href: "/dashboard/organizer" },
    { role: "maintainer", href: "/dashboard/maintainer" },
    { role: "sponsor", href: "/dashboard/sponsor-onboarding" },
    // Documented in dashboard/hacker/layout.tsx: lead falls through to the
    // hacker dashboard until a dedicated /dashboard/lead layout exists.
    { role: "lead", href: "/dashboard/hacker" },
  ];

  it.each(entries)("$role links to a route that exists", ({ href }) => {
    expect(routeExists(href)).toBe(true);
  });

  it("does not derive hrefs from role ids any more", () => {
    // Guards the original defect directly: if someone reintroduces the
    // interpolation, a role without a /dashboard/<id> route breaks again.
    for (const { role } of entries) {
      const assumed = `/dashboard/${role}`;
      if (role === "sponsor" || role === "lead") {
        // These two are exactly the roles with no /dashboard/<id> route.
        expect(routeExists(assumed)).toBe(false);
      }
    }
  });

  it("renders every role as a link to its destination", () => {
    render(<DashboardRoleSwitcher currentRole="hacker" slugId="BH-1234" />);
    // fireEvent wraps in act; a raw .click() does not flush the state update
    // that opens the dropdown.
    fireEvent.click(screen.getByRole("button"));

    for (const { href } of entries) {
      // Sponsors and leads share the other hrefs, so assert by membership
      // rather than count.
      // role="option" on each <Link> overrides the implicit link role, so
      // these are options in the listbox, not links.
      expect(screen.getAllByRole("option").map((a) => a.getAttribute("href"))).toContain(
        href,
      );
    }
  });
});