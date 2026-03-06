import type { Metadata } from "next"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Get in touch with Butwal Hacks for collaboration, volunteering, or community inquiries.",
  path: "/contact",
})

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">Contact</h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground">
          For collaborations, volunteering, and community inquiries, contact us at hello@butwalhacks.com.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">Location: Butwal, Rupandehi District, Nepal.</p>
      </section>
      <Footer />
    </main>
  )
}
