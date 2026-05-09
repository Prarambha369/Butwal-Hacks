"use client"

import { useEffect, useRef } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ParticleBackground } from "./particle-background"
import "animate.css"

export function EnhancedHero() {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // Animate hero elements on mount
    const elements = titleRef.current?.parentElement?.querySelectorAll("[data-hero-animate]")
    elements?.forEach((el, idx) => {
      el.classList.add("animate__animated", "animate__fadeInUp")
      ;(el as HTMLElement).style.animationDelay = `${idx * 100}ms`
    })
  }, [])

  return (
    <section className="hero-bg relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Content */}
      <div className="relative z-10 max-w-5xl px-4 text-center mx-auto">
        <div data-hero-animate className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-600/50 bg-red-950/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-red-200 dark:text-red-200 light:text-red-700 dark:bg-red-950/40 light:bg-red-100/50">
          <Sparkles size={16} />
          Welcome to Innovation
        </div>

        <h1
          ref={titleRef}
          data-hero-animate
          className="mt-8 text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-foreground leading-[1.1]"
        >
          Help Us Develop Our Future Generation
        </h1>

        <p
          data-hero-animate
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Join Butwal Hacks — a thriving nonprofit tech community dedicated to mentorship, learning, and shaping the next generation of innovators.
        </p>

        <div
          data-hero-animate
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/explore"
            className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-10 py-4 text-base font-bold text-white shadow-xl shadow-red-950/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/50 hover:from-red-500 hover:to-red-400"
          >
            Explore Now
            <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
          </Link>

          <Link
            href="/about"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-foreground/20 px-10 py-4 text-base font-bold text-foreground hover:bg-foreground/5 transition-all duration-300"
          >
            Learn More
          </Link>
        </div>

        {/* Social Proof */}
        <div
          data-hero-animate
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 border-t border-foreground/10"
        >
          <div className="text-center">
            <div className="text-3xl font-black text-red-600">500+</div>
            <div className="text-sm text-muted-foreground">Community Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-red-600">50+</div>
            <div className="text-sm text-muted-foreground">Events Hosted</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-red-600">100+</div>
            <div className="text-sm text-muted-foreground">Mentees Guided</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Scroll to explore</p>
          <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex items-center justify-center">
            <div className="w-1 h-2 bg-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}

