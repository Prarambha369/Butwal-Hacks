"use client"

import { cn } from "@/lib/utils"

interface LiveDotProps {
  /** Show the dot. When false, renders empty space to prevent layout shift. */
  online: boolean
  className?: string
  /** Show a text label beside the dot */
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const dotSizes = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

/**
 * Green pulsing dot for live presence indicators.
 * When `online` is false, renders an inactive dot (no pulse).
 * Optionally shows a text label beside the dot.
 */
export function LiveDot({ online, showLabel, size = 'md', className }: LiveDotProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        className,
      )}
      aria-label={online ? "Online" : "Offline"}
      title={online ? "Online now" : "Offline"}
    >
      <span
        className={cn(
          "inline-block rounded-full transition-all duration-300 shrink-0",
          dotSizes[size],
          online
            ? "bg-status-green shadow-[0_0_8px_var(--glow-status-green)]"
            : "bg-surface/30",
          online && "animate-pulse",
        )}
      />
      {showLabel && (
        <span className={cn(
          "text-[11px] font-bold uppercase tracking-wider transition-all",
          online ? "text-status-green" : "text-muted-foreground/50",
        )}>
          {online ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  )
}
