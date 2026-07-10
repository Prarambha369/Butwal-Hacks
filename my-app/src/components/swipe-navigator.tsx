"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * SwipeNavigator — adds swipe gesture support for mobile navigation.
 *
 * Detects left/right swipes:
 * - Swipe right → navigate back (router.back())
 * - Swipe left → currently no-op (future: navigate forward)
 *
 * Only activates on touch devices with screen width < 768px.
 * Requires 80px minimum swipe distance with 0.3s max duration.
 * Renders nothing — attaches event listeners only.
 *
 * ponytail: native touch events, no gesture library dependency.
 */
export default function SwipeNavigator() {
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    // Only enable on mobile devices
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.time;

      // Reset
      touchStart.current = null;

      // Ignore if swipe took too long or was mostly vertical
      if (dt > 300) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.5) return;

      // Swipe right (from left edge) → go back
      // Only trigger from the left 60px of the screen to avoid conflicts with scroll
      if (dx > 80 && e.changedTouches[0].clientX < 120) {
        router.back();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  return null;
}
