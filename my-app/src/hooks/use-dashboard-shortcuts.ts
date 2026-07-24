"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DashboardNavItem } from "@/components/dashboard-command-palette";

/**
 * useDashboardShortcuts — adds g+key navigation shortcuts to the dashboard.
 *
 * Press `g` then a second key within 800ms to navigate.
 * Escape cancels a pending `g` press.
 * Ignores inputs/textareas so it doesn't fire while typing.
 *
 * @param links — nav items with `.shortcut` keys to build the key→path map.
 *                Omitting links falls back to the current path prefix.
 */
export function useDashboardShortcuts(
  links?: DashboardNavItem[],
) {
  const router = useRouter();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    if (!links) return;

    const shortcutMap: Record<string, string> = {};
    for (const link of links) {
      if (link.shortcut) {
        shortcutMap[link.shortcut.toLowerCase()] = link.href;
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // If g is pending, interpret the second key
      if (pendingG.current !== null) {
        if (e.key === "Escape") {
          clearTimeout(pendingG.current);
          pendingG.current = null;
          return;
        }

        const path = shortcutMap[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          clearTimeout(pendingG.current);
          pendingG.current = null;
          router.push(path);
          return;
        }

        // Unknown second key — cancel
        clearTimeout(pendingG.current);
        pendingG.current = null;
        return;
      }

      // Start g sequence
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        pendingG.current = window.setTimeout(() => {
          pendingG.current = null;
        }, 800);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (pendingG.current !== null) {
        clearTimeout(pendingG.current);
      }
    };
  }, [router, links]);
}
