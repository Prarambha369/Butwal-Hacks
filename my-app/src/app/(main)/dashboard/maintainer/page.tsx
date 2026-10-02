import { PageHeader } from "@/components/dashboard/shell/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/shell/stat-card";
import { createServiceClient } from "@/utils/supabase";
import Link from "next/link";
import {
  Users, ShieldCheck, MessageSquare,
  ArrowRight, CheckCircle2, AlertCircle, AlertTriangle,
  Settings2, GraduationCap, UserCheck, Database, ScrollText,
} from "lucide-react";
import {
  APIUsageChart,
  NewSignupsChart,
  TrustMarkersChart,
} from "@/components/charts/maintainer-charts";
import AuditLogFeed from "@/components/audit/audit-log-feed";
import { runAllChecksCached, toSystemCheckResult } from "@/lib/health-checks";
import type { AuditLog } from "@/lib/supabase-types";
import type { SystemCheckResult } from "@/lib/health-checks";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = { ...buildPageMetadata({title: "Maintainer Dashboard", description: "Maintainer workspace", path: "/dashboard/maintainer", keywords: []}), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function MaintainerCommandCenter() {
  const supabase = createServiceClient();

  // ── Date bounds first: cheap and synchronous, and every query below needs
  // one. Nothing here reads another query's result, so the whole batch is
  // independent and was nine sequential round-trips -- eight PostgREST calls
  // plus a health probe -- with every latency stacked in front of first paint.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  // Started before the query batch so the probe overlaps it. Awaited after,
  // the two were serial, so a cold cache cost (query latency + up to 5s of
  // external probing). Started here, the worst case is the slower of the
  // two rather than their sum -- and the cache means this is almost always
  // a read, not a probe.
  const healthPromise = runAllChecksCached();

  // ── Clean separate queries (no nested expansions that silently fail) ──
  const [
    { count: profileCount },
    { data: events },
    { data: auditLogs },
    { count: trustMarkerCount },
    { count: projectCount },
    // ── Active users in last 24h ──
    { count: activeUsers24h },
    // ── New users today ──
    { count: newUsersToday },
    // ── Signups by day (last 7 days) for chart ──
    { data: recentProfiles },
    // ── Trust markers by month (current year) for chart ──
    { data: markersByMonth },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("id, is_published, title, start_date"),
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("trust_markers").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", yesterday),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true }),
    supabase
      .from("trust_markers")
      .select("created_at")
      .gte("created_at", yearStart)
      .order("created_at", { ascending: true }),
  ]);

  // Group signups by day
  const signupsByDay: Record<string, number> = {};
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  recentProfiles?.forEach((p) => {
    const d = new Date(p.created_at);
    const key = dayLabels[d.getDay()];
    signupsByDay[key] = (signupsByDay[key] || 0) + 1;
  });
  const signupsChartData = dayLabels.map((day) => ({
    day,
    signups: signupsByDay[day] || 0,
  }));

  const markersByMonthMap: Record<string, number> = {};
  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  markersByMonth?.forEach((m) => {
    const d = new Date(m.created_at);
    const key = monthLabels[d.getMonth()];
    markersByMonthMap[key] = (markersByMonthMap[key] || 0) + 1;
  });
  const markersChartData = monthLabels.map((month) => ({
    month,
    count: markersByMonthMap[month] || 0,
  }));

  // ── Live health checks from shared utilities (runs in parallel) ──
  const healthResults = await healthPromise;
  const systemChecks: SystemCheckResult[] = healthResults.map(toSystemCheckResult);
  const allHealthy = systemChecks.every((c) => c.healthy);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Maintainer"
        title={
          <span className="flex items-center gap-3">
            Command Center
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                allHealthy
                  ? "bg-status-green/10 text-status-green border-status-green/20"
                  : "bg-status-yellow/10 text-status-yellow border-status-yellow/20"
              }`}
            >
              {allHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {allHealthy ? "All Systems Healthy" : "Degraded Service"}
            </span>
          </span>
        }
        description="System-wide oversight, moderation, and platform health monitoring."
      />

      <StatGrid cols={3}>
        <StatCard
          label="Active Users"
          value={activeUsers24h ?? 0}
          icon={UserCheck}
          tone="blue"
          hint="Last 24 hours"
        />
        <StatCard
          label="Trust Markers"
          value={trustMarkerCount ?? 0}
          icon={ShieldCheck}
          tone="green"
          hint="Issued to date"
        />
        <StatCard
          label="New Users"
          value={newUsersToday ?? 0}
          icon={AlertTriangle}
          tone="red"
          hint="Today"
        />
      </StatGrid>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Platform Analytics */}
        <div className="lg:col-span-3 space-y-6">
          {/* API Usage + Signups */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <APIUsageChart />
            <NewSignupsChart data={signupsChartData} />
          </div>

          <TrustMarkersChart data={markersChartData} />

          {/* System Integrity */}
          <div className="bh-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary-red" />
              <h3 className="text-sm font-bold text-primary">System Integrity</h3>
            </div>
            <div className="space-y-2">
              {systemChecks.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-surface-hover border border-border">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold font-mono ${item.color}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Audit Log + Controls */}
        <div className="lg:col-span-2 space-y-6">
          <AuditLogFeed initialLogs={(auditLogs ?? []) as unknown as AuditLog[]} />

          {/* System Controls */}
          <div className="bh-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary-red" />
              <h3 className="text-sm font-bold text-primary">System Controls</h3>
            </div>
            <div className="space-y-2">
              <ControlLink href="/dashboard/maintainer/site-config" icon={<Settings2 size={14} />} label="Site Config" desc="Maintenance mode, site settings" color="text-status-orange" />
              <ControlLink href="/dashboard/maintainer/users" icon={<Users size={14} />} label="User Management" desc="Manage users, roles, bans" color="text-status-blue" />
              <ControlLink href="/dashboard/maintainer/testimonials" icon={<MessageSquare size={14} />} label="Testimonials" desc="Review quotes, feature VIP voices" color="text-status-green" />
              <ControlLink href="/dashboard/maintainer/trust-override" icon={<ShieldCheck size={14} />} label="Trust Override" desc="Revoke or reinstate markers" color="text-primary-red" />
              <ControlLink href="/dashboard/maintainer/audit-log" icon={<ScrollText size={14} />} label="Audit Log" desc="Full system activity log" color="text-muted-foreground" />
              <ControlLink href="/dashboard/maintainer/dedicate-school" icon={<GraduationCap size={14} />} label="Dedicate School" desc="Add a new school chapter" color="text-muted-foreground" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bh-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Platform Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-bold text-primary">{profileCount ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Events</span>
                <span className="font-bold text-primary">{events?.length ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Projects</span>
                <span className="font-bold text-primary">{projectCount ?? 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Trust Markers Issued</span>
                <span className="font-bold text-primary">{trustMarkerCount ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlLink({ href, icon, label, desc, color }: { href: string; icon: React.ReactNode; label: string; desc: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover border border-border hover:border-primary-red/20 transition-all group"
    >
      <div className={`p-1.5 rounded-lg bg-surface-hover ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-primary">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary-red transition-all group-hover:translate-x-0.5 shrink-0" />
    </Link>
  );
}
