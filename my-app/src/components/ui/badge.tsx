import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-mono text-xs uppercase tracking-widest px-3 py-0.5 rounded-full border transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-glass bg-surface/10 text-primary/70",
        verified:
          "border-bh-red-500/50 bg-bh-red-500/15 text-bh-red-500",
        organizer:
          "border-yellow-400/50 bg-yellow-400/10 text-yellow-400",
        ghost:
          "border-transparent bg-transparent text-primary/60",
        secondary:
          "border-glass bg-surface/10 text-primary/70",
        outline:
          "border-glass bg-transparent text-primary/70",
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
