"use client"

import { cn } from "@/lib/utils"

interface LiveDotProps {
  /** Show the dot. When false, renders empty space to prevent layout shift. */
  online: boolean
  className?: string
}

/**
 * Green pulsing dot for live presence indicators.
 * When `online` is false, renders a hidden placeholder to avoid layout shift.
 */
export function LiveDot({ online, className }: LiveDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full transition-all duration-300",
        online
          ? "bg-status-green shadow-[0_0_8px_var(--glow-status-green)] animate-pulse"
          : "bg-surface/30",
        className,
      )}
      aria-label={online ? "Online" : "Offline"}
      title={online ? "Online now" : "Offline"}
    />
  )
}
