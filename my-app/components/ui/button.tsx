import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--glass-red)] backdrop-blur-md border border-red-500/40 text-white rounded-full shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.5)]",
        ghost:
          "bg-transparent border border-[var(--glass-border)] text-[var(--color-builder-white)] rounded-full hover:bg-white/5",
        outline:
          "border border-[var(--glass-border)] rounded-full hover:bg-white/5",
        destructive:
          "bg-red-900/50 border border-red-700 text-red-300 rounded-full",
        secondary:
          "bg-white/10 border border-[var(--glass-border)] text-[var(--color-builder-white)] rounded-full hover:bg-white/15",
        link: "text-[var(--color-heritage-red)] underline-offset-4 hover:underline",
      },
      size: {
        default: "py-2 px-6",
        sm: "py-1 px-4 text-sm",
        lg: "py-3 px-8 text-lg",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
