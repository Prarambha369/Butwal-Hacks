import * as React from "react"

import { cn } from "@/lib/utils"

const BASE = "inline-flex items-center font-mono text-xs uppercase tracking-widest px-3 py-0.5 rounded-full border transition-colors";

const VARIANT_CLASSES: Record<string, string> = {
  default: "border-border bg-surface-hover text-primary/70",
  verified: "border-bh-red-500/50 bg-primary-red/15 text-primary-red",
  organizer: "border-yellow-400/50 bg-yellow-400/10 text-yellow-400",
  ghost: "border-transparent bg-transparent text-primary/60",
  secondary: "border-border bg-surface-hover text-primary/70",
  outline: "border-border bg-transparent text-primary/70",
};

function badgeVariants({ variant = "default" }: { variant?: string } = {}) {
  return cn(BASE, VARIANT_CLASSES[variant] || VARIANT_CLASSES.default);
}

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & { variant?: string }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
