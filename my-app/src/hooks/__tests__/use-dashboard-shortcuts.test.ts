// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDashboardShortcuts } from "../use-dashboard-shortcuts";

// ─── Mock next/navigation ─────────────────────────────────────────

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

// ─── Helpers ──────────────────────────────────────────────────────

function createNavLink(shortcut: string, href: string) {
  return { shortcut, href, label: `Go to ${href}`, icon: "file" as const };
}

function fireKey(key: string, target: EventTarget = window, overrides: Partial<KeyboardEvent> = {}) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...overrides }));
}

// ═══════════════════════════════════════════════════════════════════
// useDashboardShortcuts
// ═══════════════════════════════════════════════════════════════════

describe("useDashboardShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing when no links are provided", () => {
    renderHook(() => useDashboardShortcuts());

    fireKey("g");
    fireKey("p");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to the correct path on g+shortcut key", () => {
    const links = [createNavLink("p", "/dashboard/hacker/projects")];
    renderHook(() => useDashboardShortcuts(links));

    fireKey("g");
    fireKey("p");

    expect(mockPush).toHaveBeenCalledWith("/dashboard/hacker/projects");
  });

  it("matches shortcut keys case-insensitively", () => {
    const links = [createNavLink("P", "/dashboard/hacker/projects")];
    renderHook(() => useDashboardShortcuts(links));

    fireKey("g");
    fireKey("p");

    expect(mockPush).toHaveBeenCalledWith("/dashboard/hacker/projects");
  });

  it("navigates to different paths for different shortcuts", () => {
    const links = [
      createNavLink("p", "/projects"),
      createNavLink("h", "/home"),
    ];
    renderHook(() => useDashboardShortcuts(links));

    fireKey("g");
    fireKey("h");

    expect(mockPush).toHaveBeenCalledWith("/home");
    expect(mockPush).not.toHaveBeenCalledWith("/projects");
  });

  it("ignores keyboard events when typing in an input field", () => {
    const links = [createNavLink("p", "/dashboard/hacker/projects")];
    renderHook(() => useDashboardShortcuts(links));

    const input = document.createElement("input");
    fireKey("g", input);
    fireKey("p", input);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("ignores keyboard events when typing in a textarea", () => {
    const links = [createNavLink("p", "/projects")];
    renderHook(() => useDashboardShortcuts(links));

    const textarea = document.createElement("textarea");
    fireKey("g", textarea);
    fireKey("p", textarea);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("cancels pending g on Escape key", () => {
    const links = [createNavLink("p", "/projects")];
    renderHook(() => useDashboardShortcuts(links));

    fireKey("g");
    fireKey("Escape");
    fireKey("p");

    // After Escape, the second 'p' should start a new g sequence, not navigate
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("expires pending g after 800ms", () => {
    const links = [createNavLink("p", "/projects")];
    renderHook(() => useDashboardShortcuts(links));

    fireKey("g");
    vi.advanceTimersByTime(801);
    fireKey("p");

    // After 800ms, the pending 'g' expired, so 'p' starts a new sequence
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate for unknown shortcut key", () => {
    const links = [createNavLink("p", "/projects")];
    renderHook(() => useDashboardShortcuts(links));

    fireKey("g");
    fireKey("x");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("cleans up event listener on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useDashboardShortcuts([createNavLink("p", "/projects")]));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("does not trigger navigation on meta+g", () => {
    const links = [createNavLink("p", "/projects")];
    renderHook(() => useDashboardShortcuts(links));

    fireKey("g", window, { metaKey: true });

    // metaKey means this isn't the start of a shortcut sequence
    // Subsequent 'p' should start a new g sequence
    fireKey("p");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not trigger navigation on ctrl+g", () => {
    const links = [createNavLink("p", "/projects")];
    renderHook(() => useDashboardShortcuts(links));

    fireKey("g", window, { ctrlKey: true });
    fireKey("p");

    expect(mockPush).not.toHaveBeenCalled();
  });
});
