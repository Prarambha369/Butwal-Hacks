import Link from "next/link";
import { createClient } from "@/utils/supabase";
import { getUserProjects } from "@/lib/actions/projects";
import { auth0 } from "@/lib/auth0";
import { formatDualDate } from "@/lib/nepali-date";
import OnboardingTour from "@/components/dashboard/onboarding-tour";

import {
  Trophy, Clock, Users, ArrowRight,
  Code2, Medal,
} from "lucide-react";
import { ActivityTimelineChart } from "@/components/charts/hacker-charts";

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
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Welcome back, {fullName}
          </h1>
          <p className="text-sm text-muted-foreground">Here is your progress and upcoming opportunities.</p>
        </div>
      </div>

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
          title="Events"
          value={registrations?.length ?? 0}
          icon={<CalendarDaysIcon />}
          desc="Registered events"
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
                            {formatDualDate(startDate)}
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

          {/* Credential Progress */}
          <div className="bh-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-status-yellow" />
              <h3 className="text-sm font-bold text-primary">Your Credentials</h3>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Earn trust markers by participating in events and contributing to projects.
            </p>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-red/10">
                <Medal className="w-4 h-4 text-primary-red" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">{trustMarkerCount} Trust Marker{trustMarkerCount !== 1 ? "s" : ""}</p>
                <p className="text-[10px] text-muted-foreground">Verified achievements</p>
              </div>
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
