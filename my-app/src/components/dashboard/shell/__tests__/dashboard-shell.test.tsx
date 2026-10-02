// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";

/**
 * The dashboard shell's mobile drawer.
 *
 * Three defects here were silent -- the page rendered, it just rendered wrong
 * or trapped the keyboard the wrong way -- and two of them were introduced by
 * fixing the other. So these tests assert on mount counts and DOM containment,
 * not on whether anything is visible.
 */

// Count MOUNTS, not renders. Calling the spy from the component body counts
// re-renders too, and React re-invokes a body on every prop change -- so a
// body-level counter cannot tell "remounted" from "re-rendered", which is
// precisely the distinction these tests exist to make. An effect with an empty
// dependency array fires once per mount and never again.
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

// next/navigation is not available outside the App Router, and the sidebar
// reads usePathname() for its active-link state.
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/hacker",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const links = [
  { href: "/dashboard/hacker", label: "Overview", icon: <span /> },
  { href: "/dashboard/hacker/skills", label: "Skills", icon: <span /> },
];

function renderShell() {
  return render(
    <DashboardShell role="hacker" slugId="BH-1234" title="Hacker" links={links}>
      <p>page content</p>
    </DashboardShell>,
  );
}

function openButton() {
  return screen.getByRole("button", { name: /open navigation/i });
}
function closeButton() {
  return screen.getByRole("button", { name: /close navigation/i });
}

beforeEach(() => {
  skillTreeMounts.mockClear();
  orgSwitcherMounts.mockClear();
});
afterEach(cleanup);

describe("DashboardShell sidebar mounting", () => {
  it("does not double-fetch when the drawer opens and closes repeatedly", () => {
    // Two live sidebars -- rail plus drawer body -- meant every drawer open ran
    // getSkillTreeSummary() and the profiles query twice.
    renderShell();
    const baseline = skillTreeMounts.mock.calls.length;

    for (let i = 0; i < 3; i++) {
      fireEvent.click(openButton());
      fireEvent.click(closeButton());
    }

    // Not "not doubled" but "not remounted at all": the data behind
    // SkillTreeWidget and OrgSwitcher does not change when a drawer opens, and
    // swapping two subtrees re-fetches it on every single toggle.
    expect(skillTreeMounts.mock.calls.length).toBe(baseline);
    expect(orgSwitcherMounts.mock.calls.length).toBe(1);
  });

  it("keeps the sidebar mounted across an open/close cycle", () => {
    renderShell();
    const afterMount = skillTreeMounts.mock.calls.length;
    fireEvent.click(openButton());
    fireEvent.click(closeButton());
    expect(skillTreeMounts).toHaveBeenCalledTimes(afterMount);
  });

  it("has exactly one control named \"close navigation\"", () => {
    // The scrim used to be a <button> with this same name, so a screen reader
    // announced two identical buttons for one action.
    renderShell();
    fireEvent.click(openButton());
    expect(screen.getAllByRole("button", { name: /close navigation/i })).toHaveLength(1);
  });
});

describe("DashboardShell drawer accessibility", () => {
  it("exposes the drawer as a modal dialog only while it is open", () => {
    // Asserting on `navigation` here would be vacuous: SidebarNav renders a
    // navigation landmark in both states, so that version of this test passed
    // with no dialog semantics at all. Check role and modality instead.
    renderShell();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(openButton());

    const dialog = screen.getByRole("dialog", { name: /navigation/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("cycles Tab within the drawer instead of letting it reach the page behind it", () => {
    // Trapping the outer shell row instead of the drawer passed a containment
    // assertion while letting Tab walk into the topbar and <main> behind the
    // scrim -- the one thing a modal must not do. A containment check cannot
    // see the difference, because moving a ref does not move any DOM, so this
    // asserts the trap's actual behaviour instead.
    //
    // useFocusTrap wraps only when focus sits on the LAST focusable of ITS
    // container. So focusing the drawer's last control and pressing Tab must
    // return to the drawer's first. If the trap were on the shell row, the
    // row's last focusable would be somewhere down in <main>, no wrap would
    // occur, and focus would be left sitting on a control behind the scrim.
    renderShell();
    fireEvent.click(openButton());

    const dialog = screen.getByRole("dialog", { name: /navigation/i });
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    expect(focusables.length).toBeGreaterThan(1);

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    // And backwards from the first, for Shift+Tab.
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("puts initial focus inside the drawer and keeps page controls out of it", () => {
    renderShell();
    fireEvent.click(openButton());

    const dialog = screen.getByRole("dialog", { name: /navigation/i });
    // The hamburger is the control that opened the drawer; leaving focus there
    // means the first Tab walks forward from the scrim into the page.
    expect(dialog.contains(openButton())).toBe(false);
    expect(dialog.contains(screen.getByRole("main"))).toBe(false);
    expect(dialog.contains(document.activeElement as HTMLElement)).toBe(true);
  });

  it("closes on Escape", () => {
    renderShell();
    expect(closeButton).toBeDefined();
    fireEvent.click(openButton());
    expect(closeButton()).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("button", { name: /close navigation/i })).toBeNull();
  });
});
