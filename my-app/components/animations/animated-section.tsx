"use client"

import { useRef, useEffect, type ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  duration?: number
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 800,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || !ref.current) return

    const element = ref.current
    element.style.opacity = "0"

    const directionMap = {
      up: { translateY: [40, 0] },
      down: { translateY: [-40, 0] },
      left: { translateX: [40, 0] },
      right: { translateX: [-40, 0] },
    }

    const animation = directionMap[direction]

    import("animejs").then(({ animate }) => {
      animate(element, {
        opacity: [0, 1],
        ...animation,
        duration,
        delay,
        ease: "outQuad",
      })
    })
  }, [delay, direction, duration])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  initialDelay?: number
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 100,
  initialDelay = 0,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || !ref.current) return

    const children = ref.current.children
    if (children.length === 0) return

    import("animejs").then(({ animate, stagger }) => {
      animate(children, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: stagger(staggerDelay, { start: initialDelay }),
        ease: "outQuad",
      })
    })
  }, [staggerDelay, initialDelay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
