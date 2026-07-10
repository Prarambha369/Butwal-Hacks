"use client"

import type { ReactNode } from "react"
import { FadeIn } from "@/components/home/shared-primitives"

interface GlassSectionProps {
  label?: string
  heading?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * GlassSection — section wrapper with label, heading, subtitle, and optional action.
 *
 * Usage:
 *   <GlassSection
 *     label="Our Mission"
 *     heading="Building a movement."
 *     subtitle="Subtitle text here."
 *     action={<Link href="/all">View All</Link>}
 *   >
 *     {children}
 *   </GlassSection>
 */
export function GlassSection({
  label,
  heading,
  subtitle,
  action,
  children,
  className,
}: GlassSectionProps) {
  return (
    <section className="border-b border-glass bg-background/30 px-6 py-28" aria-label={label || heading}>
      <FadeIn className="mx-auto w-full max-w-6xl">
        {/* Header */}
        {(label || heading || action) && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
            <div className="space-y-4 max-w-3xl">
              {label && (
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500">
                  {label}
                </p>
              )}
              {heading && (
                <h2 className="text-4xl font-extrabold leading-tight text-primary md:text-5xl">
                  {heading}
                </h2>
              )}
              {subtitle && (
                <p className="text-lg leading-relaxed text-primary/55">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}

        {/* Body */}
        {children}
      </FadeIn>
    </section>
  )
}
