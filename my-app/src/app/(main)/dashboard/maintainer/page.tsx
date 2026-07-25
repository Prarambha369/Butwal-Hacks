import { createClient } from "@/utils/supabase";
import Link from "next/link";
import {
  Users, ShieldCheck,
  ArrowRight, CheckCircle2, AlertCircle, AlertTriangle,
  Settings2, GraduationCap, UserCheck, Database, ScrollText,
} from "lucide-react";
import {
  APIUsageChart,
  NewSignupsChart,
  TrustMarkersChart,
} from "@/components/charts/maintainer-charts";
import AuditLogFeed from "@/components/audit/audit-log-feed";
import { runAllChecks, toSystemCheckResult } from "@/lib/health-checks";
import type { AuditLog } from "@/lib/supabase-types";
import type { SystemCheckResult } from "@/lib/health-checks";

export const dynamic = "force-dynamic";

export default async function MaintainerCommandCenter() {
  const supabase = await createClient();

  // ── Clean separate queries (no nested expansions that silently fail) ──
  const { count: profileCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { data: events } = await supabase
    .from("events")
    .select("id, is_published, title, start_date");

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const { count: trustMarkerCount } = await supabase
    .from("trust_markers")
    .select("*", { count: "exact", head: true });

  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  // ── Active users in last 24h ──
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsers24h } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("last_seen", yesterday);

  // ── New users today ──
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: newUsersToday } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  // ── Signups by day (last 7 days) for chart ──
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: true });

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

  // ── Trust markers by month (current year) for chart ──
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { data: markersByMonth } = await supabase
    .from("trust_markers")
    .select("created_at")
    .gte("created_at", yearStart)
    .order("created_at", { ascending: true });

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
  const healthResults = await runAllChecks();
  const systemChecks: SystemCheckResult[] = healthResults.map(toSystemCheckResult);
  const allHealthy = systemChecks.every((c) => c.healthy);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Command Center</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
              allHealthy
                ? "bg-status-green/10 text-status-green border-status-green/20"
                : "bg-status-yellow/10 text-status-yellow border-status-yellow/20"
            }`}>
              {allHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {allHealthy ? "All Systems Healthy" : "Degraded Service"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">System-wide oversight, moderation, and platform health monitoring.</p>
        </div>
      </div>

      {/* System Health Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bh-card p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-status-blue/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-status-blue/10"><UserCheck className="w-4 h-4 text-status-blue" /></div>
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">24h</span>
          </div>
          <p className="text-3xl font-bold text-primary">{activeUsers24h ?? 0}</p>
          <p className="text-xs text-muted-foreground">Active users (last 24h)</p>
        </div>

        <div className="bh-card p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-status-green/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-status-green/10"><ShieldCheck className="w-4 h-4 text-status-green" /></div>
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Issued</span>
          </div>
          <p className="text-3xl font-bold text-primary">{trustMarkerCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">Trust markers issued</p>
        </div>

        <div className="bh-card p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-red/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-primary-red/10"><AlertTriangle className="w-4 h-4 text-primary-red" /></div>
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Today</span>
          </div>
          <p className="text-3xl font-bold text-primary">{newUsersToday ?? 0}</p>
          <p className="text-xs text-muted-foreground">New users today</p>
        </div>
      </div>

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
