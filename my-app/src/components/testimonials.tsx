"use client"

import React, { useState } from "react"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"
import { FadeIn } from "@/components/home/shared-primitives"

interface Testimonial {
  name: string
  role: string
  quote: string
  avatar: string
}

const testimonials: Testimonial[] = [
  {
    name: "Aarav Sharma",
    role: "First-time Hacker",
    quote:
      "Before Butwal Hacks, I thought building software was impossible. In 48 hours, I shipped my first full-stack app. This community doesn't just teach — it empowers.",
    avatar: "AS",
  },
  {
    name: "Priya Gurung",
    role: "Mentor & Engineer",
    quote:
      "The energy here is unmatched. I've mentored at national hackathons, but the hunger to learn in Butwal is different. These builders are solving real local problems.",
    avatar: "PG",
  },
  {
    name: "Rajan Thapa",
    role: "Organizer",
    quote:
      "We are proving that world-class tech talent doesn't only come from Kathmandu. Butwal is becoming a launchpad for innovation in Lumbini Province.",
    avatar: "RT",
  },
  {
    name: "Sneha KC",
    role: "Open Source Contributor",
    quote:
      "The verification system gave me the confidence to contribute to open source. Having my trust markers publicly visible opened doors I didn't know existed.",
    avatar: "SK",
  },
]

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))

  const t = testimonials[current]

  return (
    <section className="border-b border-glass bg-background/30 px-6 py-28" aria-label="Testimonials">
      <FadeIn className="mx-auto w-full max-w-4xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500">
          Voices from the Community
        </p>
        <h2 className="mt-4 text-4xl font-extrabold leading-tight text-primary md:text-5xl">
          What Builders Say
        </h2>

        <div className="mt-16 relative">
          {/* Quote */}
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            <Quote className="h-10 w-10 text-bh-red-500/30" aria-hidden="true" />
            <blockquote className="text-xl leading-relaxed text-primary/80 md:text-2xl">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bh-red-500/20 text-sm font-bold text-bh-red-500">
                {t.avatar}
              </div>
              <div className="text-left">
                <p className="font-bold text-primary">{t.name}</p>
                <p className="text-sm text-secondary">{t.role}</p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex gap-1" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-bh-red-500 text-bh-red-500" />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-glass bg-surface/50 text-secondary transition-all hover:bg-surface hover:text-primary"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === current
                      ? "w-6 bg-bh-red-500"
                      : "bg-border hover:bg-secondary"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-glass bg-surface/50 text-secondary transition-all hover:bg-surface hover:text-primary"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
