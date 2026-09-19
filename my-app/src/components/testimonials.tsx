import { FadeIn } from "@/components/home/shared-primitives"
import TestimonialCarousel, { type CarouselTestimonial } from "@/components/testimonials-carousel"
import { getApprovedTestimonials } from "@/lib/actions/testimonials"

/**
 * TestimonialsSection — real community voices only.
 * Reads approved (+featured-first) rows; never invents entries.
 * Empty state stays honest instead of showing placeholder people.
 */
export async function TestimonialsSection() {
  const rows = await getApprovedTestimonials(12)

  const items: CarouselTestimonial[] = rows
    .filter((r) => (r.comment ?? "").trim().length > 0)
    .map((r) => ({
      quote: (r.comment ?? "").trim(),
      name: r.guest_name || r.profile?.full_name || "A Mysterious Hacker",
      sub: r.guest_title || (r.profile?.bh_id ? `BH-ID ${r.profile.bh_id}` : null),
      avatarUrl: r.profile?.avatar_url ?? null,
      rating: r.rating,
      vip: r.author_type === "maintainer",
      source: r.source,
    }))

  return (
    <section className="border-b border-border bg-background/30 px-6 py-28" aria-label="Testimonials">
      <FadeIn className="mx-auto w-full max-w-4xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-red">
          Voices from the Community
        </p>
        <h2 className="mt-4 text-4xl font-extrabold leading-tight text-primary md:text-5xl">
          What Builders Say
        </h2>

        {items.length === 0 ? (
          <p className="mx-auto mt-10 max-w-xl text-sm leading-relaxed text-muted-foreground">
            No stories published yet — share yours with the form below and it will
            appear here once a maintainer approves it.
          </p>
        ) : (
          <TestimonialCarousel items={items} />
        )}
      </FadeIn>
    </section>
  )
}
