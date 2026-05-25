/**
 * useInViewOnce
 *
 * A reusable hook that fires once when the referenced element enters the viewport.
 * Uses IntersectionObserver and disconnects immediately after the first trigger.
 *
 * Usage:
 *   const { ref, isVisible } = useInViewOnce<HTMLDivElement>()
 *   return <div ref={ref} className={isVisible ? "visible" : ""} />
 *
 * @param threshold - Fraction of element visible before triggering (default 0.15)
 */
"use client"

import { useEffect, useRef, useState } from "react"

export function useInViewOnce<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref.current || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [isVisible, threshold])

  return { ref, isVisible }
}
