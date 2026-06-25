import * as React from "react"

import { cn } from "@/lib/utils"

// ponytail: 3-line Slot replaces @radix-ui/react-slot. Same pattern, 0 deps.
function Slot(props: React.ComponentProps<"button">) {
  return React.cloneElement(React.Children.only(props.children as React.ReactElement), props)
}

const BASE = "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.97]";

const VARIANT_CLASSES: Record<string, string> = {
  default:
    "bg-deep-red border border-primary-red/40 text-primary rounded-full shadow-[0_0_20px_var(--glow-bh-red)] hover:scale-[1.03] hover:shadow-[0_0_40px_var(--glow-bh-red)]",
  ghost:
    "bg-transparent border border-border text-primary rounded-full hover:bg-surface-hover hover:scale-[1.02] hover:border-primary-red/20",
  outline:
    "border border-border rounded-full hover:bg-surface-hover hover:scale-[1.02] hover:border-primary-red/20",
  destructive:
    "bg-dark-red/50 border border-bh-red-700 text-bh-red-300 rounded-full hover:scale-[1.02]",
  secondary:
    "bg-surface-hover border border-border text-primary rounded-full hover:bg-background/15 hover:scale-[1.02] hover:border-primary-red/20",
  link: "text-primary-red underline-offset-4 hover:underline hover:scale-[1.02]",
};

const SIZE_CLASSES: Record<string, string> = {
  default: "py-2 px-6",
  sm: "py-1 px-4 text-sm",
  lg: "py-3 px-8 text-lg",
  icon: "size-9",
  "icon-sm": "size-8",
  "icon-lg": "size-10",
};

function buttonVariants({ variant = "default", size = "default" }: { variant?: string; size?: string } = {}) {
  return cn(BASE, VARIANT_CLASSES[variant] || VARIANT_CLASSES.default, SIZE_CLASSES[size] || SIZE_CLASSES.default);
}

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    variant?: string
    size?: string
    asChild?: boolean
  }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
