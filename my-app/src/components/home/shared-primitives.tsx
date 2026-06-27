"use client";

import type { ReactNode } from "react"

// ─── FadeIn ───────────────────────────────────────────────────────────────────

/**
 * FadeIn — minimal wrapper that renders children directly.
 *
 * ponytail: Scroll-triggered entrance animations removed. Content renders
 * immediately with no JS overhead, no observer, no flash-of-invisible-content.
 * Reduced-motion users see the same instant render as everyone else.
 */
export function FadeIn({
  children,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
