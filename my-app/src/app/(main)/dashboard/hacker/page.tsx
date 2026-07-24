import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getUserProjects } from "@/lib/actions/projects";
import { auth0 } from "@/lib/auth0";
import OnboardingTour from "@/components/dashboard/onboarding-tour";

import {
  Trophy, Clock, Users, ArrowRight,
  Code2, Medal, TrendingUp,
} from "lucide-react";
import { XPProgressChart, ActivityTimelineChart } from "@/components/charts/hacker-charts";

// ─── Helpers ───────────────────────────────────────────────────────

function calculateLevel(xp: number): { level: number; current: number; next: number; progress: number } {
  const level = Math.floor(xp / 1000) + 1;
  const current = xp % 1000;
  const next = 1000;
  const progress = Math.round((current / next) * 100);
  return { level, current, next, progress };
}

// ─── Main Page ─────────────────────────────────────────────────────

export default async function HackerDashboardPage() {
  const supabase = await createClient();
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) {
    return (
      <div className="bh-card p-12 text-center">
        <p className="text-lg font-bold text-primary">Sign in to view your dashboard</p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, trust_markers(*)")
    .eq("auth0_user_id", userId)
    .single();

  const profileId = profile?.id;
  const userProjects = profileId ? await getUserProjects(profileId) : [];
  const xp = profile?.xp ?? 0;
  const { level, current, next } = calculateLevel(xp);
  const trustMarkerCount = (profile?.trust_markers as unknown[])?.length ?? 0;
  const fullName = profile?.full_name ?? "Hacker";

  // Get active event registrations
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("events!inner(id, title, start_date, end_date)")
    .eq("profile_id", profileId ?? "none")
    .gte("events.start_date", new Date().toISOString());

  return (
    <>
      <OnboardingTour role="hacker" />
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Welcome back, {fullName}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-primary-red/10 text-primary-red text-[10px] font-mono font-bold border border-primary-red/20">
              Level {level}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Here is your progress and upcoming opportunities.</p>
        </div>
      </div>

      {/* XP Growth Chart */}
      <XPProgressChart currentXp={xp} currentLevel={level} />

      {/* Performance Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Trust Markers"
          value={trustMarkerCount}
          icon={<Medal className="w-4 h-4 text-primary-red" />}
          desc="Verified achievements"
        />
        <MetricCard
          title="Projects Shipped"
          value={userProjects.length}
          icon={<Code2 className="w-4 h-4 text-status-blue" />}
          desc="Total projects submitted"
        />
        <MetricCard
          title="Hackathons"
          value={registrations?.length ?? 0}
          icon={<Trophy className="w-4 h-4 text-status-green" />}
          desc="Events attended"
        />
        <MetricCard
          title="Global Rank"
          value={`#${Math.max(1, 100 - level * 10)}`}
          icon={<TrendingUp className="w-4 h-4 text-status-orange" />}
          desc="Among all hackers"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Weekly Build Plan */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-red" />
            <h3 className="text-sm font-bold text-primary">Weekly Build Plan</h3>
          </div>

          {registrations && registrations.length > 0 ? (
            <div className="space-y-3">
              {registrations.slice(0, 3).map((reg) => {
                const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
                const startDate = new Date((ev as { start_date: string }).start_date);
                // eslint-disable-next-line react-hooks/purity
                const now = Date.now();
                const daysUntil = Math.ceil((startDate.getTime() - now) / (1000 * 60 * 60 * 24));

                return (
                  <div key={(ev as { id: string }).id} className="bh-card p-5 flex items-center justify-between group hover:bg-surface-hover transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary-red/10">
                        <Trophy className="w-4 h-4 text-primary-red" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary truncate">{(ev as { title: string }).title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Starts in {daysUntil} days
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/hacker/projects`}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-primary-red text-white text-[10px] font-bold hover:bg-deep-red transition-all"
                    >
                      Submit Project
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bh-card p-6 text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center">
                <CalendarDaysIcon />
              </div>
              <p className="text-sm font-bold text-primary">No upcoming events</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Register for a hackathon to see your build plan here.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all"
              >
                Browse Events <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/hacker/projects"
              className="bh-card p-4 flex items-center gap-3 hover:bg-surface-hover transition-all group"
            >
              <Code2 className="w-4 h-4 text-primary-red group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-bold text-primary">Projects</p>
                <p className="text-[10px] text-muted-foreground">{userProjects.length} submitted</p>
              </div>
            </Link>
            <Link
              href="/dashboard/hacker/team-matching"
              className="bh-card p-4 flex items-center gap-3 hover:bg-surface-hover transition-all group"
            >
              <Users className="w-4 h-4 text-status-blue group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-bold text-primary">Team Match</p>
                <p className="text-[10px] text-muted-foreground">Find teammates</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right: Activity Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <ActivityTimelineChart />

          {/* Level Rewards */}
          <div className="bh-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-status-yellow" />
              <h3 className="text-sm font-bold text-primary">Level Rewards</h3>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Reach Level {level + 1} ({next - current} XP away) to unlock the next tier.
            </p>
            <div className="flex -space-x-1.5">
              {["Bronze", "Silver", "Gold", "Platinum"].map((tier, i) => (
                <div
                  key={tier}
                  className={`w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-[8px] font-bold ${
                    i <= level - 1 ? "bg-status-yellow/20 text-status-yellow" : "bg-surface-hover text-muted-foreground/40"
                  }`}
                >
                  {tier[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function MetricCard({ title, value, icon, desc }: { title: string; value: string | number; icon: React.ReactNode; desc: string }) {
  return (
    <div className="bh-card p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="p-1.5 rounded-lg bg-surface-hover">{icon}</div>
        <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function CalendarDaysIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
