import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-surface py-20 md:py-32">
      {/* Static decorative blobs — no mouse tracking, no JS overhead */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-red/5 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-status-blue/8 blur-[100px] pointer-events-none" />

      <div className="bh-container relative">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Live stat — concrete, not aspirational */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-border bg-surface text-xs font-medium text-text-secondary mb-6">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-green" />
            500+ students building across Nepal
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary leading-[1.08]">
            Lumbini&apos;s{" "}
            <span className="text-primary-red relative">
              Youth Tech Hub
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary-red/20" viewBox="0 0 200 12" fill="currentColor" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 8 Q50 0 100 8 T200 8" strokeWidth="2" stroke="currentColor" fill="none" />
              </svg>
            </span>
            {""}— For Students, by Students.
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-text-secondary">
            Free hackathons, mentorship, and project-based learning for students in Lumbini Province.
            Build real projects, earn verifiable credentials, and ship code that matters.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/sign-up"
              className="bh-btn-pill inline-flex items-center gap-2 px-8 py-3.5 text-base group shadow-[0_4px_20px_rgba(254,0,0,0.2)]"
            >
              <span>Start Building</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/explore"
              className="bh-btn-secondary inline-flex items-center gap-2 px-8 py-3.5 text-base"
            >
              <span>View Projects</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
