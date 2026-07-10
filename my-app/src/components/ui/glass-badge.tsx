"use client"

import { cn } from "@/lib/utils"
import { GlassPrimitive } from "@/components/ui/glass-primitive"
import type { ReactNode } from "react"

type BadgeTier = "default" | "live" | "verified" | "organizer" | "pending" | "revoked"
type DotColor = "red" | "teal" | "yellow" | "green"

interface GlassBadgeProps {
  children: ReactNode
  tier?: BadgeTier
  dot?: DotColor
  pulse?: boolean
  className?: string
}

/** Maps friendly tier names to GlassPrimitive badge variants */
const tierMap: Record<BadgeTier, string> = {
  default: "default",
  live: "badge-live",
  verified: "badge-verified",
  organizer: "badge-organizer",
  pending: "badge-pending",
  revoked: "badge-revoked",
}

/**
 * GlassBadge — thin wrapper around GlassPrimitive for badge/tag usage.
 *
 * Usage:
 *   <GlassBadge tier="live" dot="green" pulse>Live</GlassBadge>
 *   <GlassBadge tier="verified" dot="red">Verified</GlassBadge>
 *   <GlassBadge tier="revoked">Revoked</GlassBadge>
 */
export function GlassBadge({
  children,
  tier = "default",
  dot,
  pulse = false,
  className,
}: GlassBadgeProps) {
  return (
    <GlassPrimitive
      variant={tierMap[tier] as any}
      pulse={pulse}
      dot={dot}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest",
        className,
      )}
    >
      {children}
    </GlassPrimitive>
  )
}
