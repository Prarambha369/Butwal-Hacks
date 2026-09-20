"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"

export interface CarouselTestimonial {
  quote: string
  name: string
  sub: string | null
  avatarUrl: string | null
  rating: number | null
  vip: boolean
  source: string | null
}

function initialsOf(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

export default function TestimonialCarousel({ items }: { items: CarouselTestimonial[] }) {
  const [current, setCurrent] = useState(0)

  if (items.length === 0) return null

  const prev = () => setCurrent((c) => (c === 0 ? items.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === items.length - 1 ? 0 : c + 1))

  const t = items[current]

  return (
    <div className="mt-16 relative">
      {/* Quote */}
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
        <Quote className="h-10 w-10 text-primary-red/30" aria-hidden="true" />
        {t.vip && (
          <span className="inline-flex text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-primary-red">
            Community voice
          </span>
        )}
        <blockquote className="text-xl leading-relaxed text-primary/80 md:text-2xl">
          &ldquo;{t.quote}&rdquo;
        </blockquote>

        <div className="flex items-center gap-4">
          {t.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.avatarUrl}
              alt={t.name}
              className="h-12 w-12 rounded-full object-cover border border-border"
              loading="lazy"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-red/20 text-sm font-bold text-primary-red">
              {initialsOf(t.name)}
            </div>
          )}
          <div className="text-left">
            <p className="font-bold text-primary">{t.name}</p>
            {t.sub && <p className="text-sm text-secondary">{t.sub}</p>}
          </div>
        </div>

        {/* Stars (only when the author left a rating) */}
        {t.rating !== null && (
          <div className="flex gap-1" aria-label={`Rated ${t.rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i <= (t.rating ?? 0) ? "fill-bh-red-500 text-primary-red" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
        )}
        {t.source && (
          <p className="text-xs font-mono text-muted-foreground">{t.source}</p>
        )}
      </div>

      {/* Navigation */}
      {items.length > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/50 text-secondary transition-all hover:bg-surface hover:text-primary"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            {items.map((_, i) => (
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/50 text-secondary transition-all hover:bg-surface hover:text-primary"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
