"use client"

import { useEffect, useRef } from "react"
import { useInViewOnce } from "@/hooks/useInViewOnce"

/**
 * CountUp — animates a number from 0 to `value` when scrolled into view.
 * ponytail: animejs animate({ innerText }) replaces hand-rolled rAF + easeOutCubic.
 * useInViewOnce fires once — no done ref needed.
 */
export default function CountUp({
  value,
  label,
  suffix = "",
}: {
  value: number
  label: string
  suffix?: string
}) {
  const numRef = useRef<HTMLParagraphElement>(null)
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>()

  useEffect(() => {
    if (!isVisible || !numRef.current) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      numRef.current.innerText = `${value.toLocaleString()}${suffix}`
      return
    }

    import("animejs").then(({ animate }) => {
      animate(numRef.current!, { innerText: [0, value], duration: 1100, ease: "outCubic", round: true })
    })
  }, [isVisible, value, suffix])

  return (
    <div ref={ref} className="flex flex-col items-center rounded-2xl px-8 py-8 text-center lg-surface">
      <p className="text-status-tealxl font-extrabold tracking-tight font-mono text-bh-red-500">
        <span ref={numRef}>0</span>{suffix}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/50">{label}</p>
    </div>
  )
}
