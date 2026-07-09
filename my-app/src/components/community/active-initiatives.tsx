import Link from "next/link"
import { ChevronRight, ArrowUpRight } from "lucide-react"
import { initiatives } from "@/lib/content"
import { FadeIn } from "@/components/home/shared-primitives"

export function ActiveInitiatives() {
  const active = initiatives.filter((i) => i.status === "active").slice(0, 3)

  return (
    <section className="py-20 md:py-28" aria-label="Featured Initiatives">
      <FadeIn className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="w-8 h-1 rounded-full bg-bh-red-500" />
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
              Active Initiatives
            </h2>
          </div>
          <Link
            href="/initiatives"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bento grid — asymmetric 2+1 layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[minmax(200px,auto)]">
          {active.map((initiative, i) => {
            const isHero = i === 0
            return (
              <Link
                key={initiative.slug}
                href={`/initiatives/${initiative.slug}`}
                className={`bh-card p-6 hover:shadow-md transition-all group ${
                  isHero ? "md:col-span-2 md:row-span-2 bg-gradient-to-br from-primary-red/[0.03] to-transparent border-primary-red/10" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-status-green" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-status-green">
                    Active
                  </span>
                </div>
                <h3 className={`font-bold text-primary group-hover:text-primary-red transition-colors ${
                  isHero ? "text-2xl md:text-3xl" : "text-lg"
                }`}>
                  {initiative.name}
                </h3>
                <p className={`mt-2 text-secondary/80 leading-relaxed ${
                  isHero ? "text-base" : "text-sm"
                }`}>
                  {initiative.summary}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-secondary/60 group-hover:text-primary-red transition-colors">
                  Learn more <ArrowUpRight className="w-3 h-3" />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/initiatives"
            className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            View all initiatives <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </FadeIn>
    </section>
  )
}
