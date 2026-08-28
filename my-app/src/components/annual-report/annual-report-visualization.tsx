"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Code2,
  Award,
  Zap,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Sparkles,
  Trophy,
  Layers,
  GitBranch,
  Building2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { AnnualReportData } from "@/lib/actions/annual-report";

interface ReportVisualizationProps {
  year: number;
}

export default function AnnualReportVisualization({ year }: ReportVisualizationProps) {
  const [report, setReport] = useState<AnnualReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    import("@/lib/actions/annual-report")
      .then((m) => m.generateAnnualReport(year))
      .then((data) => {
        if (!cancelled) {
          if (data) setReport(data);
          else setError("No data available for this year");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error("[annual-report]", err);
          setError("Failed to generate report");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [year]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bh-card p-5 animate-pulse space-y-3">
              <div className="h-4 w-24 bg-surface-hover rounded" />
              <div className="h-8 w-16 bg-surface-hover rounded" />
            </div>
          ))}
        </div>
        <div className="bh-card p-8 flex items-center justify-center min-h-[200px]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-mono">Generating report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bh-card p-8 border border-primary-red/30 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-primary-red mx-auto" />
        <p className="text-sm font-bold text-primary">{error ?? "Report unavailable"}</p>
        <p className="text-xs text-muted-foreground">Could not generate the annual report for {year}.</p>
      </div>
    );
  }

  const { summary, financials, topHackers, monthlySignups, projectCategories, techUsage, skillTreeUnlocks, communityMetrics } = report;
  const maxMonthlySignups = Math.max(...monthlySignups.map((m) => m.count), 1);
  const maxSkillUnlocks = Math.max(...skillTreeUnlocks.map((m) => m.count), 1);
  const maxCategoryCount = Math.max(...projectCategories.map((c) => c.count), 1);
  const maxTechCount = Math.max(...techUsage.map((t) => t.count), 1);

  return (
    <div className="space-y-10">
      {/* ── Year in Numbers ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-primary-red" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Year in Numbers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Users className="w-4 h-4" />} label="New Members" value={summary.newUsers} sub={`${summary.totalUsers.toLocaleString()} total`} />
          <StatCard icon={<Calendar className="w-4 h-4" />} label="Events" value={summary.newEvents} sub={`${summary.eventRegistrations} registrations`} />
          <StatCard icon={<Code2 className="w-4 h-4" />} label="Projects" value={summary.newProjects} sub={`${communityMetrics.totalProjects} total built`} />
          <StatCard icon={<Award className="w-4 h-4" />} label="Trust Markers" value={summary.trustMarkersIssued} sub="Verified achievements" />
          <StatCard icon={<ShieldCheck className="w-4 h-4" />} label="Teams" value={summary.newTeams} sub="Collaborations formed" />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Contributions" value={summary.totalXpAwarded.toLocaleString()} sub="Total score" />
          <StatCard icon={<Sparkles className="w-4 h-4" />} label="Credentials" value={summary.microCredentialsAwarded} sub="Skill verifications" />
          <StatCard icon={<DollarSign className="w-4 h-4" />} label="Budget" value={financials.available ? formatCurrency(financials.received, financials.currency) : "—"} sub="Total received" />
        </div>
      </section>

      {/* ── Financial Overview ────────────────────────────────────── */}
      {financials.available && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="w-4 h-4 text-primary-red" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Financial Overview</h2>
          </div>
          <div className="bh-card p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
                <p className="text-2xl font-black text-status-green">{formatCurrency(financials.balance, financials.currency)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Received</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(financials.received, financials.currency)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Spent</p>
                <p className="text-2xl font-black text-primary-red">{formatCurrency(financials.spent, financials.currency)}</p>
              </div>
            </div>

            {/* Spend ring */}
            <div className="mt-6 flex items-center justify-center">
              <div className="relative w-32 h-32">
                <DonutChart
                  percentage={financials.received > 0 ? Math.round((financials.spent / financials.received) * 100) : 0}
                  size={128}
                  strokeWidth={12}
                  color="#FE0000"
                  bgColor="rgba(254,0,0,0.08)"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-black text-primary">
                      {financials.received > 0 ? Math.round((financials.spent / financials.received) * 100) : 0}%
                    </p>
                    <p className="text-[8px] font-mono text-muted-foreground">Spent</p>
                  </div>
                </div>
              </div>
              <div className="ml-8 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-red" />
                  Spent: {formatCurrency(financials.spent, financials.currency)}
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-green" />
                  Remaining: {formatCurrency(financials.balance, financials.currency)}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Monthly Signups ───────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-primary-red" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Monthly Signups</h2>
        </div>
        <div className="bh-card p-6">
          <BarChart
            data={monthlySignups}
            maxValue={maxMonthlySignups}
            color="bg-primary-red/60 hover:bg-primary-red"
            emptyColor="bg-surface-hover/30"
            monthNames={["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}
          />
          <div className="flex items-center justify-between mt-4 text-[10px] text-muted-foreground font-mono">
            <span>Q1: {monthlySignups.slice(0, 3).reduce((s, m) => s + m.count, 0)}</span>
            <span>Q2: {monthlySignups.slice(3, 6).reduce((s, m) => s + m.count, 0)}</span>
            <span>Q3: {monthlySignups.slice(6, 9).reduce((s, m) => s + m.count, 0)}</span>
            <span>Q4: {monthlySignups.slice(9, 12).reduce((s, m) => s + m.count, 0)}</span>
          </div>
        </div>
      </section>

      {/* ── Project Categories ────────────────────────────────────── */}
      {projectCategories.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Code2 className="w-4 h-4 text-primary-red" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project Categories</h2>
          </div>
          <div className="bh-card p-6">
            <div className="space-y-2.5">
              {projectCategories.map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <span className="w-28 text-xs font-medium text-primary truncate flex-shrink-0">{item.category}</span>
                  <div className="flex-1 h-5 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-red to-red-400 transition-all duration-700"
                      style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-mono text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Technologies ──────────────────────────────────────── */}
      {techUsage.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Layers className="w-4 h-4 text-primary-red" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top Technologies</h2>
          </div>
          <div className="bh-card p-6">
            <div className="space-y-2.5">
              {techUsage.map((item) => (
                <div key={item.tech} className="flex items-center gap-3">
                  <span className="w-32 text-xs font-medium text-primary truncate flex-shrink-0">{item.tech}</span>
                  <div className="flex-1 h-5 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${(item.count / maxTechCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-mono text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Skill Tree Unlocks ────────────────────────────────────── */}
      {maxSkillUnlocks > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <GitBranch className="w-4 h-4 text-primary-red" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Skill Tree Unlocks</h2>
          </div>
          <div className="bh-card p-6">
            <BarChart
              data={skillTreeUnlocks}
              maxValue={maxSkillUnlocks}
              color="bg-status-green/60 hover:bg-status-green"
              emptyColor="bg-surface-hover/30"
              monthNames={["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}
            />
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-primary">{summary.microCredentialsAwarded}</span> total credentials unlocked this year
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Top Hackers Leaderboard ───────────────────────────────── */}
      {topHackers.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-4 h-4 text-primary-red" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top Contributors</h2>
          </div>
          <div className="bh-card overflow-hidden">
            {topHackers.map((hacker, i) => (
              <div
                key={hacker.bh_id}
                className={cn(
                  "flex items-center gap-4 px-5 py-3.5 transition-colors",
                  i < topHackers.length - 1 ? "border-b border-border" : "",
                  i === 0 ? "bg-primary-red/5" : "hover:bg-surface-hover/50",
                )}
              >
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                  i === 0 ? "bg-status-yellow/20 text-status-yellow" :
                  i === 1 ? "bg-muted-foreground/20 text-muted-foreground" :
                  i === 2 ? "bg-status-orange/20 text-status-orange" :
                  "bg-surface-hover text-muted-foreground",
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <Link href={`/p/${hacker.bh_id}`} className="text-sm font-bold text-primary hover:text-primary-red transition-colors truncate block">
                    {hacker.full_name}
                  </Link>
                  <span className="text-[10px] font-mono text-muted-foreground">{hacker.bh_id}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{hacker.xp.toLocaleString()}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">Score</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Community Metrics ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-primary-red" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Community & Infrastructure</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricBox value={communityMetrics.activeChapters} label="Active Chapters" />
          <MetricBox value={communityMetrics.totalEventsHeld} label="Total Events" />
          <MetricBox value={communityMetrics.bountiesCompleted} label="Bounties Completed" />
          <MetricBox value={communityMetrics.totalProjects} label="Total Projects" />
        </div>
      </section>

      {/* ── Generated Timestamp ───────────────────────────────────── */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-[10px] font-mono text-muted-foreground">
          Generated on {new Date(report.generatedAt).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">
          Butwal Hacks — Nepal&apos;s student-hacker community.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bh-card p-4 transition-all hover:border-primary-red/30 hover:shadow-[0_0_15px_rgba(254,0,0,0.06)] group">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        <span className="text-primary-red group-hover:scale-110 transition-transform">{icon}</span>
        {label}
      </div>
      <p className="text-2xl md:text-3xl font-black text-primary tabular-nums">{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{sub}</p>}
    </div>
  );
}

function MetricBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="bh-card p-5 text-center hover:border-primary-red/30 transition-all">
      <p className="text-3xl font-black text-primary tabular-nums">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function DonutChart({ percentage, size, strokeWidth, color, bgColor }: {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  bgColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
    </svg>
  );
}

function BarChart({ data, maxValue, color, emptyColor, monthNames }: {
  data: { month: number; count: number }[];
  maxValue: number;
  color: string;
  emptyColor: string;
  monthNames: string[];
}) {
  return (
    <div className="flex items-end gap-1.5 h-36 min-h-[9rem]">
      {data.map((item) => {
        const height = item.count > 0 ? Math.max((item.count / maxValue) * 100, 4) : 0;
        return (
          <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[8px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {item.count}
            </span>
            <div
              className={cn(
                "w-full rounded-t-md transition-all cursor-pointer",
                item.count > 0 ? color : emptyColor,
              )}
              style={{ height: `${height}%` }}
              title={`${monthNames[item.month - 1]}: ${item.count}`}
            />
            <span className="text-[7px] font-mono text-muted-foreground">{monthNames[item.month - 1].slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(value);
}
