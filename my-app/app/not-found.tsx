import type { Metadata } from "next"
import Link from "next/link"

import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Page Not Found",
    description: "The page you are looking for is not available on Butwal Hacks.",
    path: "/404",
  }),
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">Page Not Found</h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">The requested page is unavailable or may have moved.</p>
        <Link href="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Return Home
        </Link>
      </section>
      <Footer />
    </main>
  )
}
