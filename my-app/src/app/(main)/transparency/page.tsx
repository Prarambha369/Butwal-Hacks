import type { Metadata } from "next"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"
import { buildPageMetadata } from "@/lib/seo"
import AnnualReportVisualization from "@/components/annual-report/annual-report-visualization"
import { ComingSoon } from "@/components/ui/coming-soon"

// The view comes from a query string (`?view=report`), so the route cannot be
// force-static: Next supplies empty `searchParams` to static renders, which
// silently served the overview at /annual-report's redirect target. ISR still
// caches each URL variant.
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Financial Transparency",
  description:
    "Butwal Hacks publishes its budget on Open Collective. The in-app finance dashboard is still being built; the canonical ledger is public today.",
  path: "/transparency",
})

const OPEN_COLLECTIVE = "https://opencollective.com/butwal-hacks";

export default async function TransparencyPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; year?: string }>;
}) {
  const { view, year: yearParam } = await searchParams;
  const showReport = view === "report";
  const year = parseInt(yearParam ?? "", 10) || new Date().getFullYear() - 1;

  return (
    <main className="min-h-dvh bg-background text-primary">
      <section className="border-b border-border px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Transparency" }]} />
          <div className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-red">
                  Open Collective
                </p>
                <h1 className="mt-2 text-4xl font-black leading-[1.05] tracking-tight text-primary sm:text-5xl">
                  Financial Transparency
                </h1>
              </div>
              <div
                className="inline-flex w-fit rounded-full border border-border bg-surface p-1"
                role="tablist"
                aria-label="Transparency views"
              >
                <Link
                  href="/transparency"
                  role="tab"
                  aria-selected={!showReport}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    !showReport
                      ? "bg-bh-red-action text-white"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/transparency?view=report"
                  role="tab"
                  aria-selected={showReport}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    showReport
                      ? "bg-bh-red-action text-white"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  Year in review
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showReport ? (
        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-center gap-2">
              {[2024, 2025, 2026]
                .filter((y) => y <= new Date().getFullYear())
                .map((y) => (
                  <Link
                    key={y}
                    href={`/transparency?view=report&year=${y}`}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                      y === year
                        ? "bg-bh-red-action text-white"
                        : "border border-border text-muted-foreground hover:border-primary-red/30 hover:text-primary"
                    }`}
                  >
                    {y}
                  </Link>
                ))}
            </div>
            <AnnualReportVisualization year={year} />
          </div>
        </section>
      ) : (
        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <ComingSoon
              eyebrow="Finance dashboard"
              title="The in-app ledger is still being built"
              description="The canonical ledger is public on Open Collective right now — every contribution and expense, with dates. This page will summarise it here once the import is reliable, rather than showing numbers we cannot reconcile."
              planned={[
                "Balance, received, and spent, read live from Open Collective.",
                "Expense categories tied to real receipts.",
                "Per-programme budgets and what each event actually cost.",
                "A downloadable annual statement.",
              ]}
              status="No figures are shown here yet. Use the Open Collective link below for the source of truth."
              mascot="tablet"
              primary={{ label: "Open Collective ledger", href: OPEN_COLLECTIVE, external: true }}
              secondary={{ label: "Year in review", href: "/transparency?view=report" }}
            />

            <div className="mt-10 rounded-xl border border-border bg-surface p-6">
              <p className="text-sm font-bold text-primary">What is already public</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-secondary">
                <li>
                  Every transaction on{" "}
                  <a
                    href={OPEN_COLLECTIVE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary-red hover:underline"
                  >
                    opencollective.com/butwal-hacks <ExternalLink className="inline h-3 w-3" />
                  </a>
                  .
                </li>
                <li>
                  The published{" "}
                  <Link href="/legal/terms" className="font-semibold text-primary-red hover:underline">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/privacy" className="font-semibold text-primary-red hover:underline">
                    privacy policy
                  </Link>
                  .
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
