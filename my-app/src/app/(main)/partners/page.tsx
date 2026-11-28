import type { Metadata } from "next"
import Link from "next/link"
import Breadcrumbs from "@/components/breadcrumbs"
import { buildPageMetadata } from "@/lib/seo"
import { ComingSoon } from "@/components/ui/coming-soon"
import { getActivePartners } from "@/lib/public-reads/partners"
import { fallbackPartnerLogoSrc, partnerLogoFor } from "@/lib/partner-logos"
import { PartnerLogoImage } from "@/components/partners/partner-logo-image"

export const metadata: Metadata = buildPageMetadata({
  title: "Partners — Butwal Hacks",
  description:
    "The Butwal Hacks partner programme is still being built. Sponsorship tiers, recognition, and the partner wall will publish here once the terms are final.",
  path: "/partners",
  keywords: ["Butwal Hacks partners", "sponsors Nepal hackathon", "support youth tech Nepal"],
})

export const revalidate = 300;

/**
 * The organisations that already support Butwal Hacks (the same maintainer-
 * managed list as the homepage strip), then the partner programme, which is
 * not open yet: no tier or price is published. Keeps the `#donors` anchor
 * that older links rely on.
 */
export default async function PartnersPage() {
  const partners = await getActivePartners()
  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Partners" }]} />
        {partners.length > 0 && (
          <section aria-labelledby="supported-by" className="mt-8">
            <h1 id="supported-by" className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Supported by
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Organisations that back Butwal Hacks events with funding, venues, prizes, or people.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {partners.map((partner) => {
                const logo = partnerLogoFor(partner.href)
                const fallbackSrc = logo ? null : fallbackPartnerLogoSrc(partner)
                const body = (
                  <>
                    <span className="flex h-10 items-center justify-center">
                      {logo ? (
                        <PartnerLogoImage logo={logo} alt="" height={logo.wordmark && logo.width / logo.height > 3 ? 28 : 40} />
                      ) : fallbackSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element -- maintainer-set logo on an arbitrary host; static export has no optimiser
                        <img src={fallbackSrc} alt="" height={40} width={40} loading="lazy" decoding="async" className="h-10 w-auto object-contain" />
                      ) : null}
                    </span>
                    <span className="text-center text-sm font-semibold text-secondary transition-colors group-hover:text-primary">
                      {partner.name}
                    </span>
                  </>
                )
                const cls =
                  "group flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-hover"
                return (
                  <li key={partner.id}>
                    {partner.href ? (
                      <a href={partner.href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {body}
                      </a>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <div className="mt-12" id="donors">
          <ComingSoon
            eyebrow="Partner programme"
            headingLevel={partners.length > 0 ? "h2" : "h1"}
            title="Partnerships are not open yet"
            description="We are writing the sponsorship terms before we publish any tier, logo, or price. When that is done, this page will list the organisations that back Butwal Hacks and exactly what their support pays for."
            planned={[
              "Sponsorship tiers with real prices and what each one funds.",
              "A partner wall of organisations that have signed.",
              "Recognition terms: logo placement, event credits, reporting.",
              "An annual partner report tied to the public budget.",
            ]}
            status="No sponsorship tier has been published yet. Nothing on this page is an offer."
            mascot="pointing"
            primary={{ label: "Support the mission", href: "/support" }}
            secondary={{ label: "Talk to the team", href: "/contact" }}
          />
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Already working with us and need something published?{" "}
          <Link href="/contact" className="font-semibold text-primary-red hover:underline">
            Message the team
          </Link>
          {" "}and we will add it once the paperwork is signed.
        </p>
      </section>
    </main>
  )
}
