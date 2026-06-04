import type { Metadata } from "next"

import Breadcrumbs from "@/components/breadcrumbs"


import { EnhancedContactForm } from "@/components/enhanced-contact-form"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Get in touch with Butwal Hacks for collaboration, volunteering, or community inquiries.",
  path: "/contact",
})

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <h1 className="text-5xl sm:text-6xl font-black font-heading tracking-tight text-foreground animate__animated animate__fadeInUp">
          Get In Touch
        </h1>
        <p className="mt-5 text-lg text-muted-foreground animate__animated animate__fadeInUp" style={{ animationDelay: "100ms" }}>
          Have any questions or want to collaborate? We&apos;d love to hear from you. Reach out and let&apos;s build something amazing together.
        </p>
      </section>

      {/* Enhanced Contact Form */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <EnhancedContactForm />
      </section>

      {/* Map placeholder — replace with an actual embed when address is confirmed */}
      <section className="relative my-20 h-96 w-full bg-gradient-to-r from-red-600/20 to-red-500/20 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground">📍 Visit Us in Butwal</h3>
            <p className="mt-2 text-muted-foreground">Rupandehi District, Nepal</p>
          </div>
        </div>
      </section>

      
    </main>
  )
}


