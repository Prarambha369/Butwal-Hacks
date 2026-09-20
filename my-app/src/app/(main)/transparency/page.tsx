import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, DollarSign, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"
import { buildPageMetadata } from "@/lib/seo"
import AnnualReportVisualization from "@/components/annual-report/annual-report-visualization"

export const dynamic = "force-static";
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Financial Transparency",
  description:
    "Every rupee in and out, live from Open Collective. Our budget is public, down to the last momo.",
  path: "/transparency",
})

type OCStats = {
  balance: number
  received: number
  spent: number
  currency: string
}

async function fetchCollectiveStats(): Promise<OCStats | null> {
  try {
    const res = await fetch("https://api.opencollective.com/graphql/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          account(slug: "butwal-hacks") {
            stats {
              balanceWithBlockedFunds { value currency }
              totalAmountReceived { value currency }
              totalAmountSpent { value currency }
            }
          }
        }`,
      }),
      next: { revalidate: 300 },
    })
    const json = await res.json()
    const s = json?.data?.account?.stats
    if (!s) return null
    return {
      balance: s.balanceWithBlockedFunds?.value ?? 0,
      received: s.totalAmountReceived?.value ?? 0,
      spent: s.totalAmountSpent?.value ?? 0,
      currency: s.balanceWithBlockedFunds?.currency ?? "USD",
    }
  } catch {
    return null
  }
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(value)
}

export default async function TransparencyPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; year?: string }>;
}) {
  const { view, year: yearParam } = await searchParams;
  const showReport = view === "report";
  const year = parseInt(yearParam ?? "", 10) || new Date().getFullYear() - 1;
  const stats = await fetchCollectiveStats()

  return (
    <main className="min-h-dvh bg-background text-primary">
      <section className="border-b border-border px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Transparency" }]} />
          <div className="text-center">
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Open Collective
            </p>
            <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-bold font-heading leading-[0.95] tracking-tight text-primary sm:text-6xl">
              Financial Transparency
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-secondary sm:text-lg">
              Every dollar is publicly tracked on Open Collective. No hidden funds, no opaque budgets — full
              community accountability.
            </p>
            {/* Money-now vs year-in-review (migrated from /annual-report). */}
            <div className="mt-7 inline-flex rounded-full border border-border bg-surface p-1" role="tablist" aria-label="Transparency views">
              <Link
                href="/transparency"
                role="tab"
                aria-selected={!showReport}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!showReport ? "bg-bh-red-500 text-white" : "text-muted-foreground hover:text-primary"}`}
              >
                Money now
              </Link>
              <Link
                href="/transparency?view=report"
                role="tab"
                aria-selected={showReport}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${showReport ? "bg-bh-red-500 text-white" : "text-muted-foreground hover:text-primary"}`}
              >
                Year in review
              </Link>
            </div>
          </div>
        </div>
      </section>

      {showReport ? (
        <section className="px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-center gap-2">
              {[2024, 2025, 2026].filter((y) => y <= new Date().getFullYear()).map((y) => (
                <Link
                  key={y}
                  href={`/transparency?view=report&year=${y}`}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    y === year
                      ? "bg-bh-red-500 text-white shadow-[0_0_15px_rgba(254,0,0,0.3)]"
                      : "border border-border text-muted-foreground hover:text-primary hover:border-primary-red/30"
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
      <>
      {stats ? (
        <>
          <section className="border-b border-border px-4 py-12">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <DollarSign className="h-4 w-4" />
                    Current Balance
                  </div>
                  <p className="mt-3 text-4xl font-bold text-primary">
                    {formatCurrency(stats.balance, stats.currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <TrendingUp className="h-4 w-4" />
                    Total Received
                  </div>
                  <p className="mt-3 text-4xl font-bold text-primary">
                    {formatCurrency(stats.received, stats.currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <TrendingDown className="h-4 w-4" />
                    Total Spent
                  </div>
                  <p className="mt-3 text-4xl font-bold text-primary">
                    {formatCurrency(stats.spent, stats.currency)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ponytail: contributor list + expense breakdown skipped. API returns paginated data that needs
          multi-step fetching. Open Collective page is the canonical source for those. */}
          <section className="border-b border-border px-4 py-12">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-xl border border-primary/40 bg-primary p-6 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Live from Open Collective</p>
                    <p className="mt-1 text-sm text-primary-foreground/80">
                      Data refreshes every 5 minutes. All transactions are publicly auditable.
                    </p>
                  </div>
                  <a
                    href="https://opencollective.com/butwal-hacks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary-foreground/90"
                  >
                    View on Open Collective
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="border-b border-border px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <p className="text-lg font-semibold text-primary">Open Collective data unavailable</p>
              <p className="mt-2 text-sm text-secondary">
                Visit the Open Collective page directly to view financial data.
              </p>
              <a
                href="https://opencollective.com/butwal-hacks"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/80"
              >
                View on Open Collective <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-primary">Why Transparency Matters</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Community Trust",
                description: "Every contributor can verify exactly how funds are used. No blind donations.",
              },
              {
                title: "Non-Profit Integrity",
                description: "Zero salaried employees. Every dollar goes to programs, materials, and local operations.",
              },
              {
                title: "Open by Default",
                description:
                  "Budget decisions, expense reports, and collective votes are documented and publicly accessible.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-xl font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">{item.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/governance"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/70"
            >
              View Governance & Policies <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      </>
      )}
    </main>
  )
}
