import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32">
      {/* Radial glow effects */}
      <div className="pointer-events-none absolute -right-48 -top-48 h-[500px] w-[500px] rounded-full bg-primary-red/5 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-red/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Hero badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/30 bg-surface/50 px-4 py-1.5 text-xs font-medium text-text-muted backdrop-blur-xl">
            <Zap className="h-3 w-3 text-primary-red" />
            Nepal&apos;s Youth Tech Initiative
          </div>

          {/* Main headline */}
          <h1 className="max-w-5xl text-5xl font-black tracking-tight text-text-primary md:text-7xl lg:text-8xl leading-[1.05]">
            Powering Nepal&apos;s{" "}
            <br className="hidden md:block" />
            Next Generation{" "}
            <br className="hidden md:block" />
            of <span className="text-primary-red">Builders.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted md:text-xl">
            Hands-on hackathons, mentorship, and innovation opportunities for youth in Lumbini Province, Nepal.
            Build real projects, earn verified credentials, and join a growing community of builders.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/sign-up"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary-red px-8 py-4 text-base font-bold text-white transition-all hover:bg-deep-red hover:shadow-[0_0_30px_rgba(254,0,0,0.3)] active:scale-95"
            >
              Join the Movement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/explore"
              className="group inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-border/50 px-8 py-4 text-base font-bold text-text-primary transition-all hover:bg-surface/50 active:scale-95"
            >
              Explore Projects
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-8 rounded-2xl border border-border/30 bg-surface/30 px-8 py-6 backdrop-blur-xl">
            {[
              { value: "500+", label: "BUILDERS" },
              { value: "20+", label: "EVENTS" },
              { value: "8+", label: "DISTRICTS" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-3xl font-black text-text-primary md:text-4xl">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-mono font-medium tracking-widest text-text-muted">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
