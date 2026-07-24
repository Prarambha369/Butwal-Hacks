"use client";

import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Collects all focusable children within `el`, returning them as a
 * live NodeList (updated on every call so dynamic DOM is respected).
 */
function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/**
 * useFocusTrap — traps Tab / Shift+Tab focus cycling inside a container.
 *
 * @param containerRef - ref to the element that should trap focus
 * @param active - whether the trap is currently engaged
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save the previously-focused element so we can restore it when the trap
  // is deactivated.
  useEffect(() => {
    if (active) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;

      const el = containerRef.current;
      if (!el) return;

      const focusable = getFocusable(el);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // No focusable children — focus the container itself so the
        // keydown handler still works (e.g. for Escape).
        el.setAttribute("tabindex", "-1");
        el.focus();
      }
    } else {
      // Restore focus when trap is deactivated
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
     
  }, [active]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const el = containerRef.current;
      if (!el) return;

      const focusable = getFocusable(el);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [containerRef],
  );

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef, handleKeyDown]);
}
