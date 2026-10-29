import Link from "next/link";
import { createServiceClient } from "@/utils/supabase";
import { getUserProjects } from "@/lib/actions/projects";
import { getJourney } from "@/lib/actions/journey";
import { auth0 } from "@/lib/auth0";
import { formatDualDate } from "@/lib/nepali-date";
import OnboardingTour from "@/components/dashboard/onboarding-tour";
import { PageHeader } from "@/components/dashboard/shell/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/shell/stat-card";

import {
  Trophy, Clock, Users, ArrowRight,
  Code2, Medal,
} from "lucide-react";
import { buildPageMetadata } from "@/lib/seo"

// ─── Main Page ─────────────────────────────────────────────────────


export const metadata = { ...buildPageMetadata({title: "Hacker Dashboard", description: "Your hacker workspace", path: "/dashboard/hacker", keywords: []}), robots: { index: false, follow: false } };

export default async function HackerDashboardPage() {
  const supabase = createServiceClient();
  const session = await auth0.getSession();
  const userId = session?.user?.sub || (process.env.NODE_ENV !== 'production' ? 'dev-user' : undefined);

  if (!userId && process.env.NODE_ENV === 'production') {
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

  // These three only need `profileId`, so they are independent and were three
  // sequential round-trips (two of them bespoke helpers, each their own query)
  // stacked in front of first paint. The profile lookup has to resolve
  // `profileId` first; the rest now cost one round-trip between them.
  const [userProjects, journey, { data: registrations }] = await Promise.all([
    profileId ? getUserProjects(profileId) : [],
    profileId ? getJourney(profileId) : [],
    // Get active event registrations
    supabase
      .from("event_registrations")
      .select("events!inner(id, title, start_date, end_date)")
      .eq("profile_id", profileId ?? "none")
      .gte("events.start_date", new Date().toISOString()),
  ]);

  const trustMarkerCount = (profile?.trust_markers as unknown[])?.length ?? 0;
  const fullName = profile?.full_name ?? "Hacker";

  return (
    <>
      {/* <OnboardingTour role="hacker" /> */}
      <div className="space-y-8 pb-20">
          <PageHeader
            eyebrow="Hacker"
            title={`Welcome back, ${fullName}`}
            description="Track your hackathon journey, projects, and achievements."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bh-red-action text-white text-sm font-semibold hover:bg-deep-red transition-all shadow-sm hover:shadow-md"
                >
                  Browse Events
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard/hacker/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-primary hover:bg-surface-hover transition-all"
                >
                  Edit Profile
                </Link>
              </div>
            }
          />

        <StatGrid cols={3}>
          <StatCard
            label="Trust Markers"
            value={trustMarkerCount}
            icon={Medal}
            tone="red"
            hint="Verified achievements"
          />
          <StatCard
            label="Projects Shipped"
            value={userProjects.length}
            icon={Code2}
            tone="blue"
            hint="Total projects submitted"
          />
          <StatCard
            label="Hackathons"
            value={registrations?.length ?? 0}
            icon={Trophy}
            tone="green"
            hint="Events registered"
          />
        </StatGrid>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Weekly Build Plan */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-red" />
              <h3 className="text-lg font-bold text-primary">Upcoming Hackathons</h3>
            </div>
            {registrations && registrations.length > 0 && (
              <Link href="/events" className="text-sm text-primary-red hover:underline font-medium">
                View all
              </Link>
            )}
          </div>

          {registrations && registrations.length > 0 ? (
            <div className="space-y-3">
              {registrations.slice(0, 3).map((reg) => {
                const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
                const startDate = new Date((ev as { start_date: string }).start_date);

                return (
                  <div key={(ev as { id: string }).id} className="bh-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group hover:shadow-md hover:border-primary-red/20 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary-red/10 to-primary-red/5">
                        <Trophy className="w-5 h-5 text-primary-red" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-primary truncate">{(ev as { title: string }).title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CalendarDaysIcon />
                          <span className="text-sm font-mono text-muted-foreground">
                            {formatDualDate(startDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/hacker/projects`}
                      className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-bh-red-action text-white text-sm font-semibold hover:bg-deep-red transition-all shadow-sm hover:shadow-md"
                    >
                      Submit Project
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bh-card p-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-surface-hover to-surface flex items-center justify-center">
                <CalendarDaysIcon />
              </div>
              <div className="space-y-2">
                <p className="text-base font-bold text-primary">No upcoming events yet</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Register for a hackathon to start building, find teammates, and earn trust markers.
                </p>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-bh-red-action text-white text-sm font-semibold hover:bg-deep-red transition-all shadow-sm hover:shadow-md"
              >
                Browse Events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-primary">Quick Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/dashboard/hacker/projects"
                className="bh-card p-4 flex items-center gap-3 hover:shadow-md hover:border-primary-red/20 transition-all group"
              >
                <div className="p-2 rounded-lg bg-primary-red/10 group-hover:bg-primary-red/15 transition-colors">
                  <Code2 className="w-4 h-4 text-primary-red" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary">My Projects</p>
                  <p className="text-xs text-muted-foreground">{userProjects.length} submitted</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-red group-hover:translate-x-0.5 transition-all" />
              </Link>
              <Link
                href="/dashboard/hacker/team-matching"
                className="bh-card p-4 flex items-center gap-3 hover:shadow-md hover:border-status-blue/20 transition-all group"
              >
                <div className="p-2 rounded-lg bg-status-blue/10 group-hover:bg-status-blue/15 transition-colors">
                  <Users className="w-4 h-4 text-status-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary">Find Teammates</p>
                  <p className="text-xs text-muted-foreground">Team matching</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-status-blue group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: credentials + record */}
        <div className="lg:col-span-2 space-y-4">
          {/* Your Credentials */}
          <div className="bh-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-status-yellow/10">
                  <Trophy className="w-4 h-4 text-status-yellow" />
                </div>
                <h3 className="text-base font-bold text-primary">Trust Markers</h3>
              </div>
              {trustMarkerCount > 0 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-status-yellow/10 text-status-yellow">
                  {trustMarkerCount}
                </span>
              )}
            </div>
            {trustMarkerCount > 0 ? (
              <div className="space-y-2">
                {(profile?.trust_markers as { title: string; type: string }[] | undefined)
                  ?.slice(0, 4)
                  .map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary-red shrink-0" />
                      <span className="text-sm text-primary truncate flex-1">{m.title}</span>
                    </div>
                  ))}
                {trustMarkerCount > 4 && (
                  <p className="text-xs text-muted-foreground pl-5">+{trustMarkerCount - 4} more markers</p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Trust markers appear here when organizers verify your work
                </p>
                <p className="text-xs text-muted-foreground">
                  Participate in events and ship projects to earn them
                </p>
              </div>
            )}
          </div>

          {/* Your record — chronological, verifiable, no scores */}
          <div className="bh-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-status-blue/10">
                <Clock className="w-4 h-4 text-status-blue" />
              </div>
              <h3 className="text-base font-bold text-primary">Activity Timeline</h3>
            </div>
            {journey.length > 0 ? (
              <ol className="space-y-4">
                {journey.slice(0, 6).map((entry, i) => (
                  <li key={`${entry.kind}-${entry.date}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${entry.revoked ? "bg-muted-foreground" : "bg-primary-red"}`} />
                      {i < Math.min(journey.length, 6) - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                    </div>
                    <div className="min-w-0 pb-2 flex-1">
                      <p className={`text-sm font-medium ${entry.revoked ? "line-through text-muted-foreground" : "text-primary"}`}>
                        {entry.href && !entry.revoked ? (
                          <Link href={entry.href} className="hover:text-primary-red transition-colors">
                            {entry.title}
                          </Link>
                        ) : (
                          entry.title
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.kind}{entry.detail ? ` · ${entry.detail}` : ""} · {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your journey starts here
                </p>
                <p className="text-xs text-muted-foreground">
                  It fills in as you attend events, ship projects, and get verified
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function CalendarDaysIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
