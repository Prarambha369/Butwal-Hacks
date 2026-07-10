"use client";

import React, { useState, useCallback } from "react";
import {
  FileText,
  Users,
  Calendar,
  FolderGit2,
  ShieldCheck,
  Medal,
  TrendingUp,
  BarChart3,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReportData {
  year: number;
  generatedAt: string;
  summary: {
    newUsers: number;
    newEvents: number;
    newProjects: number;
    newTeams: number;
    trustMarkersIssued: number;
    microCredentialsAwarded: number;
    eventRegistrations: number;
    totalXpAwarded: number;
  };
  topHackers: { bh_id: string; full_name: string | null; xp: number }[];
  monthlySignups: { month: number; count: number }[];
  communityMetrics: {
    activeChapters: number;
    sponsorOrganizations: number;
    bountyCompleted: number;
    totalEventsHeld: number;
  };
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="lg-surface rounded-2xl border border-glass p-5 space-y-2">
      <div className="flex items-center gap-2 text-secondary/60">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-primary">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

// ─── Client Component ────────────────────────────────────────────────────────

export default function AnnualReportClient() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear - 1);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/annual-report?year=${year}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate report");
      }
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report",
      );
    } finally {
      setLoading(false);
    }
  }, [year]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Annual Report</h1>
          <p className="text-secondary opacity-60">
            Generate an annual impact report with key platform metrics.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="bg-surface/10 border border-glass rounded-xl px-4 py-2.5 text-sm text-primary outline-none focus:ring-2 focus:ring-bh-red-500/20"
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - 1 - i).map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ),
          )}
        </select>
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-bh-red-500 text-white text-sm font-bold hover:bg-bh-red-600 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <FileText size={16} />
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-bh-red-500/10 border border-bh-red-500/30 text-bh-red-500 text-sm">
          {error}
        </div>
      )}

      {report && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="New Users"
              value={report.summary.newUsers}
            />
            <StatCard
              icon={Calendar}
              label="Events"
              value={report.summary.newEvents}
            />
            <StatCard
              icon={FolderGit2}
              label="Projects"
              value={report.summary.newProjects}
            />
            <StatCard
              icon={ShieldCheck}
              label="Trust Markers"
              value={report.summary.trustMarkersIssued}
            />
            <StatCard
              icon={Medal}
              label="Micro-Credentials"
              value={report.summary.microCredentialsAwarded}
            />
            <StatCard
              icon={TrendingUp}
              label="Total XP"
              value={report.summary.totalXpAwarded}
            />
            <StatCard
              icon={BarChart3}
              label="Registrations"
              value={report.summary.eventRegistrations}
            />
            <StatCard
              icon={Users}
              label="Teams Formed"
              value={report.summary.newTeams}
            />
          </div>

          {/* Top Hackers */}
          <div className="lg-surface rounded-3xl border border-glass p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Medal size={18} className="text-bh-red-500" />
              Top Hackers of {report.year}
            </h2>
            <div className="space-y-2">
              {report.topHackers.map((hacker, i) => (
                <div
                  key={hacker.bh_id ?? i}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface/10 border border-glass/50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : i === 1
                            ? "bg-gray-400/20 text-gray-300"
                            : i === 2
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-surface/20 text-secondary/60"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm">
                      {hacker.full_name ?? hacker.bh_id ?? "Anonymous"}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-bh-red-500">
                    {hacker.xp.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Signups */}
          <div className="lg-surface rounded-3xl border border-glass p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-bh-red-500" />
              Monthly Signups — {report.year}
            </h2>
            <div className="flex items-end gap-2 h-32">
              {report.monthlySignups.map((m) => {
                const maxCount = Math.max(
                  ...report.monthlySignups.map((s) => s.count),
                  1,
                );
                const height = (m.count / maxCount) * 100;
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-[10px] font-mono text-secondary/60">
                      {m.count}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-bh-red-500/60 hover:bg-bh-red-500 transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`Month ${m.month}: ${m.count} signups`}
                    />
                    <span className="text-[9px] text-secondary/40">
                      {
                        [
                          "J",
                          "F",
                          "M",
                          "A",
                          "M",
                          "J",
                          "J",
                          "A",
                          "S",
                          "O",
                          "N",
                          "D",
                        ][m.month - 1]
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Community Metrics */}
          <div className="lg-surface rounded-3xl border border-glass p-6 space-y-4">
            <h2 className="text-lg font-bold">Community Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <p className="text-4xl font-bold text-bh-red-500">
                  {report.communityMetrics.activeChapters}
                </p>
                <p className="text-xs text-secondary/60 mt-1">
                  Active Chapters
                </p>
              </div>
              <div className="text-center p-4">
                <p className="text-4xl font-bold text-bh-red-500">
                  {report.communityMetrics.totalEventsHeld}
                </p>
                <p className="text-xs text-secondary/60 mt-1">Events Held</p>
              </div>
              <div className="text-center p-4">
                <p className="text-4xl font-bold text-bh-red-500">
                  {report.communityMetrics.bountyCompleted}
                </p>
                <p className="text-xs text-secondary/60 mt-1">
                  Bounties Completed
                </p>
              </div>
              <div className="text-center p-4">
                <p className="text-4xl font-bold text-bh-red-500">
                  {report.communityMetrics.sponsorOrganizations}
                </p>
                <p className="text-xs text-secondary/60 mt-1">Sponsors</p>
              </div>
            </div>
            <p className="text-xs text-secondary/40 mt-4">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
