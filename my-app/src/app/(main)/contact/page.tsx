export const dynamic = "force-static";

import type { Metadata } from "next"
import Link from "next/link"

import Breadcrumbs from "@/components/breadcrumbs"
import { EnhancedContactForm } from "@/components/enhanced-contact-form"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Say hello. Ask about volunteering, partnerships, or anything else on your mind.",
  path: "/contact",
})

export default function ContactPage() {
  return (
    <main className="min-h-dvh bg-background">
      
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <h1 className="text-5xl sm:text-6xl font-black font-heading tracking-tight text-primary">
          Get In Touch
        </h1>
        <p className="mt-5 text-lg text-secondary">
          Have any questions or want to collaborate? We&apos;d love to hear from you. Reach out and let&apos;s build something amazing together.
        </p>
      </section>

      {/* Enhanced Contact Form */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <EnhancedContactForm />
      </section>

      <section className="relative my-20 w-full overflow-hidden rounded-xl border border-border bg-surface p-8 md:p-12">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <h3 className="text-2xl font-bold text-primary">Visit Us in Butwal</h3>
          <p className="text-muted-foreground">
            We have no office. We meet at hackathons, workshops, and meetups
            across Rupandehi District and Lumbini Province. The fastest way to
            find us is the next event.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/events" className="bh-btn-primary text-sm">
              See upcoming events
            </Link>
            <Link href="/community" className="bh-btn-secondary text-sm">
              Join the community
            </Link>
          </div>
        </div>
      </section>

      
    </main>
  )
}


