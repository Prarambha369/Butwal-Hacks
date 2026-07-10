"use client"

import { cn } from "@/lib/utils"
import type { HTMLAttributes, ReactNode } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type GlassVariant = "default" | "red" | "teal" | "yellow" | "green" | "blue" | "badge-verified" | "badge-organizer" | "badge-pending" | "badge-revoked" | "badge-live";
type GlassPadding = "sm" | "md" | "lg" | "xl";

interface GlassPrimitiveProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: GlassVariant
  padding?: GlassPadding
  interactive?: boolean
  pulse?: boolean
  dot?: "red" | "teal" | "yellow" | "green"
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const variants: Record<GlassVariant, string> = {
  // Card variants
  default: "lg-surface",
  red: "bg-bh-red-600/80 backdrop-blur-xl saturate-150 border border-bh-red-500/50 shadow-[0_4px_20px_var(--glow-bh-red)]",
  teal: "bg-status-teal/15 backdrop-blur-xl saturate-150 border border-status-teal/30 shadow-[0_4px_20px_var(--glow-status-teal)]",
  yellow: "bg-status-yellow/12 backdrop-blur-xl saturate-150 border border-status-yellow/30 shadow-[0_4px_20px_var(--glow-status-yellow)]",
  green: "bg-status-green/12 backdrop-blur-xl saturate-150 border border-status-green/30 shadow-[0_4px_20px_var(--glow-status-green)]",
  blue: "bg-status-blue/12 backdrop-blur-xl saturate-150 border border-status-blue/30 shadow-[0_4px_20px_var(--glow-status-blue)]",
  // Badge variants
  "badge-verified": "border-bh-red-500/50 bg-bh-red-500/15 text-bh-red-500",
  "badge-organizer": "border-yellow-400/50 bg-yellow-400/10 text-yellow-400",
  "badge-pending": "border-blue-400/30 bg-blue-400/10 text-blue-400",
  "badge-revoked": "border-glass bg-surface/10 text-primary/40 line-through",
  "badge-live": "border-green-500/40 bg-green-500/10 text-green-400",
}

const paddings: Record<GlassPadding, string> = {
  sm: "p-4", md: "p-6", lg: "p-8", xl: "p-10",
}

const dotStyles: Record<string, string> = {
  red: "bg-[var(--color-bh-red-500)] shadow-[0_0_6px_var(--glow-bh-red)]",
  teal: "bg-status-teal shadow-[0_0_6px_var(--glow-status-teal)]",
  yellow: "bg-status-yellow shadow-[0_0_6px_var(--glow-status-yellow)]",
  green: "bg-status-green shadow-[0_0_6px_var(--glow-status-green)]",
}

/**
 * GlassPrimitive — A consolidated glass-morphism wrapper.
 * replaces GlassCard and GlassBadge.
 * 
 * Usage:
 * - For Cards: <GlassPrimitive variant="red" padding="lg"> ... </GlassPrimitive>
 * - For Badges: <GlassPrimitive variant="badge-verified" className="rounded-full px-3 py-1 font-mono text-[10px] uppercase"> ... </GlassPrimitive>
 */
export function GlassPrimitive({
  children,
  variant = "default",
  padding = "md",
  interactive = false,
  pulse = false,
  dot,
  className,
  ...props
}: GlassPrimitiveProps) {
  const isBadge = variant.startsWith("badge-");

  return (
    <div
      className={cn(
        variants[variant],
        !isBadge && paddings[padding],
        interactive && "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-bh-red-500/30 hover:shadow-[0_16px_48px_-8px_var(--glow-bh-red)]",
        pulse && "animate-pulse",
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0 inline-block mr-1.5",
            dotStyles[dot],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}
