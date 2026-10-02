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
      <OnboardingTour role="hacker" />
      <div className="space-y-8 pb-20">
          <PageHeader
            eyebrow="Hacker"
            title={`Welcome back, ${fullName}`}
            description="Here is your record and upcoming opportunities."
            actions={
              <p className="text-[11px] font-mono text-muted-foreground border border-border rounded-full px-2.5 py-1">
                Not sure where to start? Complete your profile first.
              </p>
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

        {/* Right: credentials + record */}
        <div className="lg:col-span-2 space-y-4">
          {/* Your Credentials */}
          <div className="bh-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-status-yellow" />
              <h3 className="text-sm font-bold text-primary">Your Credentials</h3>
            </div>
            {trustMarkerCount > 0 ? (
              <div className="space-y-2">
                {(profile?.trust_markers as { title: string; type: string }[] | undefined)
                  ?.slice(0, 4)
                  .map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-red shrink-0" />
                      <span className="text-xs text-primary truncate">{m.title}</span>
                    </div>
                  ))}
                {trustMarkerCount > 4 && (
                  <p className="text-[10px] text-muted-foreground">+{trustMarkerCount - 4} more</p>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground font-mono">
                Trust markers appear here when organizers verify your work.
              </p>
            )}
          </div>

          {/* Your record — chronological, verifiable, no scores */}
          <div className="bh-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-status-blue" />
              <h3 className="text-sm font-bold text-primary">Your Record</h3>
            </div>
            {journey.length > 0 ? (
              <ol className="space-y-3">
                {journey.slice(0, 8).map((entry, i) => (
                  <li key={`${entry.kind}-${entry.date}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${entry.revoked ? "bg-muted-foreground" : "bg-primary-red"}`} />
                      {i < Math.min(journey.length, 8) - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className={`text-xs font-bold truncate ${entry.revoked ? "line-through text-muted-foreground" : "text-primary"}`}>
                        {entry.href && !entry.revoked ? (
                          <Link href={entry.href} className="hover:text-primary-red transition-colors">
                            {entry.title}
                          </Link>
                        ) : (
                          entry.title
                        )}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {entry.kind}{entry.detail ? ` · ${entry.detail}` : ""} · {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[10px] text-muted-foreground font-mono">
                Nothing recorded yet — it fills in as you attend, ship, and get verified.
              </p>
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
