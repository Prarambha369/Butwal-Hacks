import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import AnnualReportVisualization from "@/components/annual-report/annual-report-visualization";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Annual Impact Report — Butwal Hacks",
    description: "Yearly impact report for Butwal Hacks — community growth, events, projects, and financial transparency.",
    path: "/annual-report",
  });
}

export default async function AnnualReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const year = parseInt(yearParam ?? "", 10) || new Date().getFullYear() - 1;

  if (year < 2024 || year > 2099 || !Number.isFinite(year)) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-background text-primary">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute -right-48 -top-48 h-[500px] w-[500px] rounded-full bg-primary-red/5 blur-[150px]" />
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary-red/30 bg-primary-red/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-red mb-4">
            <Sparkles className="w-3 h-3" />
            Annual Impact Report
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            {year} in Review
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A look back at the community&apos;s growth, achievements, and impact over {year}.
          </p>

          {/* Year selector */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {[2024, 2025, 2026].filter((y) => y <= new Date().getFullYear()).map((y) => (
              <Link
                key={y}
                href={`/annual-report?year=${y}`}
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
        </div>
      </section>

      {/* Report content */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <AnnualReportVisualization year={year} />
        </div>
      </section>
    </main>
  );
}
