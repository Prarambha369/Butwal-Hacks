"use client"

import { useRef, useEffect } from "react"
import { Quote, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Testimonial {
  id: string
  name: string
  role: string
  organization: string
  content: string
  rating: number
  avatar?: string
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sabin Sharma",
    role: "Student Developer",
    organization: "Butwal",
    content: "Butwal Hacks gave me the mentorship I needed to transition from learning to building real projects. The community support is incredible.",
    rating: 5,
  },
  {
    id: "2",
    name: "Priya Adhikari",
    role: "Frontend Developer",
    organization: "Tech Startup",
    content: "The hackathon experience here is unlike anything else in Nepal. It's not just about winning—it's about learning and growing together.",
    rating: 5,
  },
  {
    id: "3",
    name: "Ramesh Kumar",
    role: "Computer Science Student",
    organization: "Butwal Multiple Campus",
    content: "Through Butwal Hacks, I found peers who share my passion for technology. We've built projects together that I'm proud to showcase.",
    rating: 5,
  },
]

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || !ref.current) return

    import("animejs").then(({ animate }) => {
      animate(ref.current!, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 700,
        delay: index * 150,
        ease: "outQuad",
      })
    })
  }, [index])

  return (
    <div
      ref={ref}
      className={cn(
        "group relative rounded-xl border border-border bg-card p-6 transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/20 transition-colors group-hover:text-primary/40" />

      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < testimonial.rating ? "fill-primary text-primary" : "text-muted"
            )}
          />
        ))}
      </div>

      <blockquote className="mb-6 text-muted-foreground">
        &ldquo;{testimonial.content}&rdquo;
      </blockquote>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-foreground">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">
            {testimonial.role}, {testimonial.organization}
          </p>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || !headerRef.current) return

    import("animejs").then(({ animate }) => {
      animate(headerRef.current!, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
        ease: "outQuad",
      })
    })
  }, [])

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div ref={headerRef} className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What Our Community Says
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Hear from the builders, learners, and mentors who make Butwal Hacks special.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
