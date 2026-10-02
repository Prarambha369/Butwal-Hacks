// @vitest-environment happy-dom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import MaintainerSidebar from "@/components/maintainer-sidebar";

/**
 * Nav highlighting in the maintainer rail.
 *
 * `isActive` is a prefix match so that /dashboard/maintainer/users keeps
 * "Users" lit on nested routes. But the section root, /dashboard/maintainer,
 * is a prefix of all eleven of its own children -- so with a plain prefix
 * match, "Command Center" was highlighted on every admin page at once,
 * alongside whichever page you were actually on. sidebar-nav.tsx excludes the
 * same index routes for the same reason; this reintroduced the bug that
 * exclusion list exists to prevent.
 */

const mockPathname = vi.fn(() => "/dashboard/maintainer");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/dashboard/dashboard-role-switcher", () => ({
  DashboardRoleSwitcher: () => <div data-testid="role-switcher" />,
}));

const links = [
  { href: "/dashboard/maintainer", label: "Command Center", icon: <span /> },
  { href: "/dashboard/maintainer/users", label: "Users", icon: <span /> },
  { href: "/dashboard/maintainer/audit-log", label: "Audit Log", icon: <span /> },
];

const ROOT = "/dashboard/maintainer";

function activeLabels() {
  return screen
    .getAllByRole("link")
    .filter((el) => el.getAttribute("aria-current") === "page")
    .map((el) => el.textContent);
}

function renderAt(pathname: string) {
  mockPathname.mockReturnValue(pathname);
  return render(
    <MaintainerSidebar slugId="BH-1234" links={links} />,
  );
}

afterEach(cleanup);

describe("MaintainerSidebar active state", () => {
  it("keeps the drawer and the rail mutually exclusive", () => {
    mockPathname.mockReturnValue(ROOT);
    render(<MaintainerSidebar slugId="BH-1" links={links} />);
    const rail = screen.getByRole("complementary", { name: /maintainer/i });
    // Closed: a static desktop column, hidden on small screens.
    expect(rail.className).toContain("w-56");
    expect(rail.className).toContain("hidden");
    expect(rail.className).not.toContain("fixed");
  });

  it("highlights only the root link on the section root", () => {
    renderAt(ROOT);
    expect(activeLabels()).toEqual(["Command Center"]);
  });

  it("highlights only the nested link on a child route", () => {
    renderAt("/dashboard/maintainer/users");
    // The regression: "Command Center" used to appear here too.
    expect(activeLabels()).toEqual(["Users"]);
  });

  it("never highlights the root link together with a child", () => {
    for (const p of [
      "/dashboard/maintainer/users",
      "/dashboard/maintainer/audit-log",
      "/dashboard/maintainer/trust-override",
    ]) {
      cleanup();
      renderAt(p);
      expect(activeLabels()).not.toContain("Command Center");
    }
  });

  it("keeps a parent lit deeper into its own subtree", () => {
    renderAt("/dashboard/maintainer/users/42/edit");
    expect(activeLabels()).toEqual(["Users"]);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    // /dashboard/maintainer-users must not light up "Users".
    renderAt("/dashboard/maintainer-users");
    expect(activeLabels()).toEqual([]);
  });

  it("is a drawer body when mobileOpen, not a positioned rail", () => {
    mockPathname.mockReturnValue(ROOT);
    render(<MaintainerSidebar slugId="BH-1" links={links} mobileOpen />);
    const rail = screen.getByRole("complementary", { name: /maintainer/i });
    // The shell's container owns positioning and the focus trap, so the sidebar
    // must carry none. `fixed inset-y-0` here escaped the drawer entirely and
    // rendered 224px wide inside a 256px drawer.
    expect(rail.className).toContain("h-full");
    expect(rail.className).toContain("w-full");
    expect(rail.className).not.toContain("fixed");
    expect(rail.className).not.toContain("w-56");
  });
});
