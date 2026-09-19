import Link from "next/link";
import { Handshake, ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";
import { getActivePartners } from "@/lib/actions/partners";

export const metadata = buildPageMetadata({
  title: "Partners — Butwal Hacks",
  description:
    "Organizations backing free hackathons and student programs in Nepal. Every logo here is a real relationship.",
  path: "/partners",
  keywords: ["Butwal Hacks partners", "sponsors Nepal hackathon", "support youth tech Nepal"],
});

export const dynamic = "force-dynamic";

/**
 * Public partner showcase — the same maintainer-managed wall as the
 * homepage, expanded into a full page. Honest empty: invites the first
 * partner instead of faking a wall.
 */
export default async function PartnersPage() {
  const partners = await getActivePartners();

  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Partners" }]} />
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-red mb-4 flex items-center gap-2">
          <Handshake className="w-4 h-4" />
          Supported by
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">
          Our Partners
        </h1>
        <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Organizations backing free hackathons, mentorship, and student
          programs across Nepal. Every logo on this page is a real
          relationship, added by hand — never a placeholder.
        </p>

        {partners.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border bg-surface p-10 text-center space-y-4">
            <p className="text-lg font-bold text-primary">No partners listed yet</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
              This wall fills up as organizations join us. If yours backs
              student builders, let&apos;s talk.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full bg-primary-red px-6 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all"
            >
              Become a partner <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner) => {
                const card = (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-hover text-xl font-black text-muted-foreground overflow-hidden">
                      {partner.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={partner.logo_url}
                          alt=""
                          className="max-h-16 w-auto object-contain"
                          loading="lazy"
                        />
                      ) : (
                        partner.name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-primary">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">Partner</p>
                    </div>
                  </>
                );
                const cls =
                  "bh-card flex items-center gap-4 p-5 transition-all hover:shadow-md hover:scale-[1.01]";
                return partner.href ? (
                  <Link
                    key={partner.id}
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={partner.id} className={cls}>
                    {card}
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all"
              >
                Become a partner <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
