// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";

/**
 * Drawer behaviour for the shared dashboard shell.
 *
 * Both of these were found by static analysis rather than by a failing test,
 * and both fail *silently* -- the page renders, it just renders wrong:
 *
 *  1. The rail and the drawer body used to be two live DashboardSidebar
 *     subtrees. Each mounts SkillTreeWidget and OrgSwitcher, so every drawer
 *     open fired getSkillTreeSummary() and the profiles query twice.
 *  2. The drawer had no focus containment and no Escape handler, so it was a
 *     one-way keyboard trap.
 */

const mockPathname = vi.fn(() => "/dashboard/hacker");

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

// Count MOUNTS, not renders. Calling the spy from the component body counts
// re-renders too, and React re-invokes a body on every prop change -- so a
// body-level counter cannot tell "remounted" from "re-rendered", which is
// precisely the distinction these tests exist to make. An effect with an
// empty dependency array fires once per mount and never again.
const skillTreeMounts = vi.fn();
const orgSwitcherMounts = vi.fn();

vi.mock("@/components/skills/skill-tree-widget", async () => {
  const { useEffect } = await import("react");
  // Named declaration, not an arrow: react-hooks does not treat an anonymous
  // function assigned to a property as a component, and errors on the hook.
  function SkillTreeWidget() {
    useEffect(() => {
      skillTreeMounts();
    }, []);
    return <div data-testid="skill-tree" />;
  }
  return { default: SkillTreeWidget };
});

vi.mock("@/components/org-switcher", async () => {
  const { useEffect } = await import("react");
  function OrgSwitcher() {
    useEffect(() => {
      orgSwitcherMounts();
    }, []);
    return <div data-testid="org-switcher" />;
  }
  return { OrgSwitcher };
});

vi.mock("@/components/dashboard/dashboard-role-switcher", () => ({
  DashboardRoleSwitcher: () => <div data-testid="role-switcher" />,
}));

const links = [
  { href: "/dashboard/hacker", label: "Overview", icon: <span /> },
  { href: "/dashboard/hacker/work", label: "Work", icon: <span /> },
];

function renderShell() {
  return render(
    <DashboardShell role="hacker" slugId="BH-1234" links={links}>
      <p>content</p>
    </DashboardShell>,
  );
}

const openButton = () => screen.getByRole("button", { name: /open navigation/i });

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname.mockReturnValue("/dashboard/hacker");
});

afterEach(cleanup);

describe("DashboardShell drawer", () => {
  it("mounts exactly one sidebar, and still exactly one with the drawer open", () => {
    renderShell();
    // The rail is the only instance while the drawer is closed.
    expect(screen.getAllByTestId("skill-tree")).toHaveLength(1);
    expect(skillTreeMounts).toHaveBeenCalledTimes(1);

    fireEvent.click(openButton());

    // Still one. Two would double every widget's fetches on each drawer open.
    expect(screen.getAllByTestId("skill-tree")).toHaveLength(1);
    expect(screen.getAllByTestId("org-switcher")).toHaveLength(1);
  });

  it("does not double-fetch when the drawer opens and closes repeatedly", () => {
    renderShell();
    const baseline = skillTreeMounts.mock.calls.length;

    for (let i = 0; i < 3; i++) {
      fireEvent.click(openButton());
      fireEvent.click(screen.getByRole("button", { name: /close navigation/i }));
    }

    expect(skillTreeMounts.mock.calls.length).toBe(baseline);
    expect(screen.getAllByTestId("skill-tree")).toHaveLength(1);
  });

  it("closes on Escape", () => {
    renderShell();
    fireEvent.click(openButton());
    fireEvent.click(openButton());
    expect(screen.getByRole("button", { name: /close navigation/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("button", { name: /close navigation/i })).toBeNull();
  });

  it("keeps the sidebar mounted across an open/close cycle", () => {
    // The stronger form of the double-fetch check: not "not doubled" but
    // "not remounted at all". The data behind SkillTreeWidget and OrgSwitcher
    // does not change when a drawer opens.
    renderShell();
    const afterMount = skillTreeMounts.mock.calls.length;
    fireEvent.click(openButton());
    fireEvent.click(screen.getByRole("button", { name: /close navigation/i }));
    expect(skillTreeMounts).toHaveBeenCalledTimes(afterMount);
  });

  it("exposes the drawer as a modal dialog while it is open", () => {
    renderShell();
    expect(screen.queryByRole("dialog", { name: /navigation/i })).toBeNull();
    fireEvent.click(openButton());
    // The sidebar is the drawer, so the dialog semantics ride on it.
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("has exactly one control named \"close navigation\"", () => {
    // The scrim used to be a <button> with this same name, so a screen reader
    // announced two identical buttons for one action.
    renderShell();
    fireEvent.click(openButton());
    expect(screen.getAllByRole("button", { name: /close navigation/i })).toHaveLength(1);
  });
});
