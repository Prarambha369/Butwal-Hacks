import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-mono text-xs uppercase tracking-widest px-3 py-0.5 rounded-full border transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-white/10 bg-white/5 text-white/70",
        verified:
          "border-red-500/50 bg-red-500/15 text-red-400",
        organizer:
          "border-yellow-400/50 bg-yellow-400/10 text-yellow-400",
        ghost:
          "border-transparent bg-transparent text-white/60",
        secondary:
          "border-white/10 bg-white/10 text-white/70",
        outline:
          "border-white/20 bg-transparent text-white/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
