"use client";

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { useInViewOnce } from "@/hooks/useInViewOnce"

// ─── FadeIn ───────────────────────────────────────────────────────────────────

/**
 * FadeIn — wraps children in a scroll-triggered fade+slide-up reveal.
 * Disconnects observer after first trigger to avoid unnecessary reflows.
 * Supports optional `delay` for staggered entrance via CSS var(--fade-delay).
 */
export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const { ref: inViewRef, isVisible } = useInViewOnce<HTMLDivElement>(0.12)

  return (
    <div
      ref={(el) => {
        // eslint-disable-next-line react-hooks/immutability
        (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current = el
      }}
      suppressHydrationWarning
      style={{ "--fade-delay": `${delay}ms` } as React.CSSProperties}
      className={`section-fade ${isVisible ? "visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

// ─── StaggerReveal ────────────────────────────────────────────────────────────

/**
 * StaggerReveal — wraps a grid of children and uses animejs v4 to stagger-entrance
 * them when the container scrolls into view. Falls back to CSS opacity if animejs
 * fails to load or reduced-motion is preferred.
 *
 * Children are initially hidden (opacity: 0, translateY: 20px) and animejs
 * staggers them in with a smooth spring-like cubic-bezier.
 */
export function StaggerReveal({
  children,
  staggerDelay = 60,
  threshold = 0.12,
  className = "",
}: {
  children: ReactNode
  staggerDelay?: number
  threshold?: number
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Scroll detection via IntersectionObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isVisible, threshold])

  // animejs stagger entrance on visibility
  useEffect(() => {
    if (!isVisible || !containerRef.current) return

    let animation: { pause: () => void } | null = null

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    import("animejs")
      .then(({ animate, stagger }) => {
        const children = containerRef.current!.children
        if (!children || children.length === 0) return

        // animejs v4 stagger: fades children in from invisible, one by one
        const anim = animate(children, {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 700,
          ease: "outCubic",
          delay: stagger(staggerDelay, { start: 40 }),
        })

        animation = anim
      })
      .catch(() => {
        // Fallback: animejs failed to load — children stay visible
      })

    return () => {
      // Cleanup: pause animation if component unmounts mid-animation
      if (animation) {
        animation.pause()
      }
    }
  }, [isVisible, staggerDelay])

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-[600ms] ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"} ${className}`}
      data-stagger={isVisible ? "visible" : "hidden"}
    >
      {children}
    </div>
  )
}
