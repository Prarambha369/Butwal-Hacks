import type { Metadata } from "next"
import Link from "next/link"
import Breadcrumbs from "@/components/breadcrumbs"
import { buildPageMetadata } from "@/lib/seo"
import { ComingSoon } from "@/components/ui/coming-soon"

export const dynamic = "force-static";

export const metadata: Metadata = buildPageMetadata({
  title: "Transparency & Governance",
  description:
    "How Butwal Hacks is structured, who decides, and which policies are in force. The governance model is being documented and will be published here.",
  path: "/governance",
})

/**
 * There is no ratified board, charter, or decision process to publish yet.
 * This page says so instead of listing names or structures that do not exist.
 */
export default function GovernancePage() {
  return (
    <main className="min-h-dvh bg-background text-primary">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Governance" }]} />
        <div className="mt-8">
          <ComingSoon
            eyebrow="Governance"
            title="Governance is being written down"
            description="We are turning how Butwal Hacks actually runs into a published charter: who holds which decision, what a maintainer can approve alone, and how a member can challenge a call. Until that is ratified there is nothing official to show."
            planned={[
              "A charter covering the organisation, its officers, and their limits.",
              "A decision record for policy and budget changes.",
              "The code of conduct and its enforcement process.",
              "Term lengths, elections, and removal rules.",
            ]}
            status="No board, officer list, or charter is in force on this page."
            mascot="reading"
            primary={{ label: "Public finances", href: "/transparency" }}
            secondary={{ label: "Privacy policy", href: "/legal/privacy" }}
          />
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          The documents that <em>are</em> in force live in{" "}
          <Link href="/legal/terms" className="font-semibold text-primary-red hover:underline">
            Terms
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="font-semibold text-primary-red hover:underline">
            Privacy
          </Link>
          , and{" "}
          <Link href="/cookie-policy" className="font-semibold text-primary-red hover:underline">
            Cookies
          </Link>
          . Anything not linked from there is not policy.
        </p>
      </section>
    </main>
  )
}
