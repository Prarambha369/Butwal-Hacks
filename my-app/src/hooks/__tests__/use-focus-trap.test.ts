// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createRef } from "react";
import { useFocusTrap } from "../use-focus-trap";

// ═══════════════════════════════════════════════════════════════════
// useFocusTrap
// ═══════════════════════════════════════════════════════════════════

describe("useFocusTrap", () => {
  let container: HTMLDivElement;
  let outerButton: HTMLButtonElement;
  let focusableElements: HTMLElement[];

  beforeEach(() => {
    vi.useFakeTimers();

    // Create container with focusable children
    container = document.createElement("div");
    container.innerHTML = `
      <button id="first">First</button>
      <input id="second" type="text" />
      <a id="third" href="#">Third</a>
    `;
    document.body.appendChild(container);

    // Create an element outside the container
    outerButton = document.createElement("button");
    outerButton.id = "outer";
    document.body.appendChild(outerButton);

    focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>("button, input, a"),
    );
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("focuses the first focusable element when activated", () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    expect(document.activeElement).toBe(focusableElements[0]);
  });

  it("does not focus when inactive", () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, false));

    expect(document.activeElement).not.toBe(focusableElements[0]);
  });

  it("restores previous focus when deactivated", () => {
    outerButton.focus();
    const previousActive = document.activeElement;

    const ref = { current: container };
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useFocusTrap(ref, active),
      { initialProps: { active: true } },
    );

    // Deactivate
    rerender({ active: false });

    expect(document.activeElement).toBe(previousActive);
  });

  it("wraps Tab from last to first element", () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    // Focus the last element
    focusableElements[focusableElements.length - 1].focus();

    // Simulate Tab (no shift)
    act(() => {
      container.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
      );
    });

    expect(document.activeElement).toBe(focusableElements[0]);
  });

  it("wraps Shift+Tab from first to last element", () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    // Focus the first element
    focusableElements[0].focus();

    // Simulate Shift+Tab
    act(() => {
      container.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }),
      );
    });

    expect(document.activeElement).toBe(focusableElements[focusableElements.length - 1]);
  });

  it("does not wrap Tab when not on boundary element", () => {
    const ref = { current: container };
    renderHook(() => useFocusTrap(ref, true));

    // Focus the middle element
    focusableElements[1].focus();

    // Simulate Tab
    act(() => {
      container.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
      );
    });

    // Focus should stay on the middle element (browser default)
    expect(document.activeElement).toBe(focusableElements[1]);
  });

  it("focuses the container when there are no focusable children", () => {
    const emptyContainer = document.createElement("div");
    document.body.appendChild(emptyContainer);
    const ref = { current: emptyContainer };

    renderHook(() => useFocusTrap(ref, true));

    expect(document.activeElement).toBe(emptyContainer);
  });

  it("sets tabindex=-1 on container when there are no focusable children", () => {
    const emptyContainer = document.createElement("div");
    document.body.appendChild(emptyContainer);
    const ref = { current: emptyContainer };

    renderHook(() => useFocusTrap(ref, true));

    expect(emptyContainer.getAttribute("tabindex")).toBe("-1");
  });

  it("does nothing when container ref is null", () => {
    const ref = createRef<HTMLElement>();

    expect(() => {
      renderHook(() => useFocusTrap(ref, true));
    }).not.toThrow();
  });

  it("removes keydown listener on unmount", () => {
    const ref = { current: container };
    const removeSpy = vi.spyOn(container, "removeEventListener");

    const { unmount } = renderHook(() => useFocusTrap(ref, true));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("adds keydown listener when activated", () => {
    const ref = { current: container };
    const addSpy = vi.spyOn(container, "addEventListener");

    renderHook(() => useFocusTrap(ref, true));

    expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    addSpy.mockRestore();
  });

  it("removes keydown listener when deactivated", () => {
    const ref = { current: container };
    const removeSpy = vi.spyOn(container, "removeEventListener");

    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useFocusTrap(ref, active),
      { initialProps: { active: true } },
    );

    rerender({ active: false });

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
  });
});
