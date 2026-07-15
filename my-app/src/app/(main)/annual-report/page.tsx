import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, Users, Calendar, Code2, Zap, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { getYearMetrics } from "@/lib/metrics";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Annual Impact Report — Butwal Hacks",
    description: "Yearly impact report for Butwal Hacks — community growth, events, projects, and financial transparency.",
    path: "/annual-report",
  });
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bh-card p-5 transition-all hover:border-primary-red/30">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary mb-3">
        <span className="text-primary-red">{icon}</span>
        {label}
      </div>
      <p className="text-3xl font-black text-primary">{value}</p>
      {sub && <p className="text-[10px] text-secondary mt-1">{sub}</p>}
    </div>
  );
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

  const report = await getYearMetrics(year, false);

  if (!report) {
    notFound();
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const maxMonthlySignups = Math.max(...report.monthlySignups.map((m) => m.count), 1);

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
          <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">
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
                    : "border border-border text-secondary hover:text-primary hover:border-primary-red/30"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="px-4 py-12 border-b border-border">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Year in Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-4 h-4" />} label="New Members" value={report.summary.newUsers} sub="Community growth" />
            <StatCard icon={<Calendar className="w-4 h-4" />} label="Events" value={report.summary.newEvents} sub={`${report.summary.eventRegistrations} registrations`} />
            <StatCard icon={<Code2 className="w-4 h-4" />} label="Projects" value={report.summary.newProjects} sub="Built by hackers" />
            <StatCard icon={<Award className="w-4 h-4" />} label="Trust Markers" value={report.summary.trustMarkersIssued} sub="Verified achievements" />
            <StatCard icon={<ShieldCheck className="w-4 h-4" />} label="Teams Formed" value={report.summary.newTeams} sub="Collaborations" />
            <StatCard icon={<Zap className="w-4 h-4" />} label="XP Awarded" value={report.summary.totalXpAwarded.toLocaleString()} sub="Experience points" />
            <StatCard icon={<Sparkles className="w-4 h-4" />} label="Micro-Credentials" value={report.summary.microCredentialsAwarded} sub="Skill verifications" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="New Users" value={report.summary.newUsers} sub={`Joined in ${year}`} />
          </div>
        </div>
      </section>

      {/* Monthly Growth Chart */}
      <section className="px-4 py-12 border-b border-border">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-6">Monthly Signups</h2>
          <div className="bh-card p-6">
            <div className="flex items-end gap-1.5 h-40 min-h-[10rem]">
              {report.monthlySignups.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[8px] font-mono text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-primary-red/60 hover:bg-primary-red transition-all cursor-pointer"
                    style={{ height: `${(m.count / maxMonthlySignups) * 100}%`, minHeight: m.count > 0 ? "4px" : "0" }}
                    title={`${monthNames[m.month - 1]}: ${m.count} signups`}
                  />
                  <span className="text-[8px] font-mono text-secondary">{monthNames[m.month - 1].slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top Hackers Leaderboard */}
      {report.topHackers.length > 0 && (
        <section className="px-4 py-12 border-b border-border">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-6 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Top Contributors
            </h2>
            <div className="bh-card overflow-hidden">
              {report.topHackers.map((hacker, i) => (
                <div
                  key={hacker.bh_id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    i < report.topHackers.length - 1 ? "border-b border-border" : ""
                  } ${i === 0 ? "bg-primary-red/5" : ""} hover:bg-surface/10 transition-colors`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    i === 0 ? "bg-status-yellow/20 text-status-yellow" :
                    i === 1 ? "bg-secondary/20 text-secondary" :
                    i === 2 ? "bg-status-orange/20 text-status-orange" :
                    "bg-surface/10 text-secondary"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/p/${hacker.bh_id}`} className="text-sm font-bold text-primary hover:text-primary-red transition-colors truncate block">
                      {hacker.full_name}
                    </Link>
                    <span className="text-[10px] font-mono text-secondary">{hacker.bh_id}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{hacker.xp}</p>
                    <p className="text-[9px] font-mono text-secondary">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Metrics */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-6">Community &amp; Infrastructure</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bh-card p-5 text-center">
              <p className="text-3xl font-black text-primary">{report.communityMetrics.activeChapters}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary mt-1">Active Chapters</p>
            </div>
            <div className="bh-card p-5 text-center">
              <p className="text-3xl font-black text-primary">{report.communityMetrics.totalEventsHeld}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary mt-1">Total Events</p>
            </div>
            <div className="bh-card p-5 text-center">
              <p className="text-3xl font-black text-primary">{report.communityMetrics.sponsorOrganizations}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary mt-1">Sponsors</p>
            </div>
            <div className="bh-card p-5 text-center">
              <p className="text-3xl font-black text-primary">{report.communityMetrics.bountyCompleted}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary mt-1">Bounties</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="px-4 py-10 border-t border-border">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs text-secondary">
            Generated on {new Date(report.generatedAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric"
            })}
          </p>
          <p className="text-xs text-secondary mt-1">
            Butwal Hacks — Powering Nepal&apos;s Next Generation of Builders.
          </p>
        </div>
      </section>
    </main>
  );
}
