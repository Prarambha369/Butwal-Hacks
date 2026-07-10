"use client"

import { GlassPrimitive } from "@/components/ui/glass-primitive"
import type { ReactNode, HTMLAttributes } from "react"

type GlassVariant = "default" | "red" | "teal" | "yellow" | "green" | "blue"
type GlassPadding = "sm" | "md" | "lg" | "xl"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: GlassVariant
  padding?: GlassPadding
  interactive?: boolean
}

/**
 * GlassCard — thin wrapper around GlassPrimitive for card usage.
 * Maps variant/padding/interactive props directly.
 */
export function GlassCard({
  children,
  variant = "default",
  padding = "md",
  interactive = false,
  className,
  ...props
}: GlassCardProps) {
  return (
    <GlassPrimitive
      variant={variant}
      padding={padding}
      interactive={interactive}
      className={className}
      {...props}
    >
      {children}
    </GlassPrimitive>
  )
}
