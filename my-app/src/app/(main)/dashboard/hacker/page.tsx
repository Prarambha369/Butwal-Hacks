import Link from "next/link";
import { createServiceClient } from "@/utils/supabase";
import { getUserProjects } from "@/lib/actions/projects";
import { auth0 } from "@/lib/auth0";
import { DEV_USER_ID, isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass";
import { formatDualDate } from "@/lib/nepali-date";
import { PageHeader } from "@/components/dashboard/shell/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/shell/stat-card";
import OnboardingTour from "@/components/dashboard/onboarding-tour";

import {
  Trophy, Clock, ArrowRight,
  Code2, Medal,
  CalendarDays,
} from "lucide-react";

const CalendarDaysIcon = CalendarDays;
import { buildPageMetadata } from "@/lib/seo";

// ─── Main Page ─────────────────────────────────────────────────────

export const metadata = { ...buildPageMetadata({title: "Hacker Dashboard", description: "Your hacker workspace", path: "/dashboard/hacker", keywords: []}), robots: { index: false, follow: false } };

export default async function HackerDashboardPage() {
  const supabase = createServiceClient();
  const session = await auth0.getSession();
  const userId = session?.user?.sub || (isDevAuthBypassEnabled() ? DEV_USER_ID : undefined);

  // No identity means the profile lookup below would run against
  // `auth0_user_id = undefined` and return nothing, rendering an empty
  // dashboard. The proxy already redirects the normal cases to /auth/login;
  // this is the belt-and-braces check for when it does not.
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
  const [userProjects, { data: registrations }] = await Promise.all([
    profileId ? getUserProjects(profileId) : [],
    // Get active event registrations
    supabase
      .from("event_registrations")
      .select("events!inner(id, title, start_date, end_date)")
      .eq("profile_id", profileId ?? "none")
      .gte("events.start_date", new Date().toISOString()),
  ]);

  const trustMarkerCount = (profile?.trust_markers as unknown[])?.length ?? 0;
  const fullName = profile?.full_name ?? "Hacker";

  const emptyCard = (
    <div className="bh-card p-10 text-center flex flex-col items-center gap-4">
      <div className="w-20 h-20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 384 384"
          width="80"
          height="80"
        >
          <defs>
            <radialGradient id="bh-body-grad" cx="50%" cy="42%" r="62%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="28%" stop-color="#FE7C7C" />
              <stop offset="62%" stop-color="#FE0000" />
              <stop offset="100%" stop-color="#B10000" />
            </radialGradient>
            <radialGradient id="bh-belly-grad" cx="50%" cy="52%" r="60%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="70%" stop-color="#F2F2F2" />
              <stop offset="100%" stop-color="#D7D7D7" />
            </radialGradient>
          </defs>

          <g fill="#1A1A1A">
            <path d="M158 74c-6 -8 -3 -18 5 -18c7 0 13 -4 13 -11c0 -4 4 -9 9 -10c11 -3 13 7 11 17c-3 14 -9 24 -21 18c-7 -4 -1 -17 4 -17z" />
            <path d="M226 74c6 -8 3 -18 -5 -18c-7 0 -13 -4 -13 -11c0 -4 -4 -9 -9 -10c-11 -3 -13 7 -11 17c3 14 9 24 21 18c7 -4 1 -17 -4 -17z" />
            <path d="M98 150c-9 -2 -22 -1 -34 -11c-12 -12 -20 -30 -18 -52c3 -22 17 -40 34 -42c17 -1 29 9 33 24c4 16 1 30 -7 41c-7 10 -14 20 -28 29z" />
            <path d="M286 150c9 -2 22 -1 34 -11c12 -12 20 -30 18 -52c-3 -22 -17 -40 -34 -42c-17 -1 -29 9 -33 24c-4 16 -1 30 7 41c7 10 14 20 28 29z" />
            <path d="M86 238c-13 -4 -23 -14 -22 -30c4 -28 22 -46 42 -47c18 -1 32 9 38 26c5 15 4 30 -2 43c-5 10 -7 18 -7 19 7 -11 12 -25 11 -39c-1 -17 -6 -30 11 -32z" />
            <path d="M298 238c13 -4 23 -14 22 -30c-4 -28 -22 -46 -42 -47c-18 -1 -32 9 -38 26c-5 15 -4 30 2 43c5 10 7 18 7 19 -7 -11 -12 -25 -11 -39c1 -17 6 -30 -11 -32z" />
          </g>

          <g>
            <g fill="url(#bh-body-grad)">
              <ellipse cx="192" cy="252" rx="116" ry="98" />
              <circle cx="192" cy="132" r="66" />
              <ellipse cx="192" cy="158" rx="38" ry="28" />
              <circle cx="142" cy="92" r="20" />
              <circle cx="242" cy="92" r="20" />
              <ellipse cx="126" cy="222" rx="26" ry="52" transform="rotate(-18 126 222)" />
              <ellipse cx="258" cy="214" rx="26" ry="52" transform="rotate(18 258 214)" />
              <ellipse cx="150" cy="320" rx="26" ry="32" />
              <ellipse cx="234" cy="320" rx="26" ry="32" />
              <path d="M192 62c-7 -8 2 -18 12 -16c11 2 17 9 16 18c-1 14 -8 19 -16 21c-8 2 -12 -1 -12 -23z" />
            </g>

            <g fill="#7B0000" opacity="0.55">
              <path d="M150 92c-18 -3 -32 7 -31 25c2 -6 5 -11 10 -13c4 -1 13 1 19 2c4 -15 16 -25 32 -23c6 -3 1 -16 -10 -11z" />
              <path d="M234 92c18 -3 32 7 31 25c-2 -6 -5 -11 -10 -13c-4 -1 -13 1 -19 2c-4 -15 -16 -25 -32 -23c-6 -3 -1 -16 10 -11z" />
            </g>

            <ellipse cx="192" cy="258" rx="72" ry="52" fill="url(#bh-belly-grad)" />
            <path d="M156 150c0 -14 16 -26 36 -26s36 12 36 26c0 12 -8 22 -20 28s-34 10 -42 0c-5 -6 -10 -10 -16 -10 -7 0 -14 4 -16 10z" fill="#2A2A2A" />
            <circle cx="192" cy="228" r="20" fill="#FFFFFF" opacity="0.92" />
            <circle cx="192" cy="228" r="15" fill="#FE0000" opacity="0.95" />
            <text x="192" y="234" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fontSize="15" fontWeight="700" fill="#FFFFFF" letterSpacing="0.5">bh</text>

            <circle cx="142" cy="88" r="20" fill="#2A2A2A" />
            <circle cx="142" cy="88" r="11" fill="#4A4A4A" />
            <circle cx="242" cy="88" r="20" fill="#2A2A2A" />
            <circle cx="242" cy="88" r="11" fill="#4A4A4A" />

            <ellipse cx="168" cy="124" rx="9" ry="8" fill="#1A1A1A" />
            <ellipse cx="216" cy="124" rx="9" ry="8" fill="#1A1A1A" />
            <circle cx="168" cy="125" r="5.5" fill="#FFFFFF" />
            <circle cx="216" cy="125" r="5.5" fill="#FFFFFF" />
            <circle cx="169" cy="126" r="3" fill="#1A1A1A" />
            <circle cx="217" cy="126" r="3" fill="#1A1A1A" />
            <circle cx="167.5" cy="124" r="1.1" fill="#FFFFFF" />
            <circle cx="215.5" cy="124" r="1.1" fill="#FFFFFF" />
            <path d="M158 117c3 -3 11 -3 14 0c2 -4 8 -5 11 -2c-2 -5 -11 -4 -17 1c-3 -6 -14 -4 -14 1z" fill="#2A2A2A" />
            <path d="M226 117c-3 -3 -11 -3 -14 0c-2 -4 -8 -5 -11 -2c2 -5 11 -4 17 1c3 -6 14 -4 14 1z" fill="#2A2A2A" />
            <ellipse cx="192" cy="146" rx="7" ry="5" fill="#1A1A1A" />
            <ellipse cx="190" cy="144" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.55" />
            <path d="M180 162c2 3 6 4 12 4s10 -1 12 -4" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M180 162c2 5 6 7 12 7s10 -2 12 -4" fill="none" stroke="#2A2A2A" strokeWidth="1" opacity="0.45" />
            <ellipse cx="150" cy="142" rx="9" ry="5" fill="#FFB3B3" opacity="0.5" />
            <ellipse cx="234" cy="142" rx="9" ry="5" fill="#FFB3B3" opacity="0.5" />
          </g>

          <ellipse cx="192" cy="360" rx="120" ry="10" fill="#000000" opacity="0.12" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold text-primary">Welcome back, {fullName}</h2>
        <p className="text-sm text-muted-foreground">
          Your hackathon space is ready. Browse events, submit projects, and see
          your progress in one place.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
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
    </div>
  );

  return (
    <>
      <OnboardingTour role="hacker" />
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
                          <CalendarDaysIcon className="w-4 h-4" />
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
          ) : emptyCard}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bh-card p-6">
            <h3 className="text-lg font-bold text-primary">Quick Links</h3>
            <div className="mt-4 space-y-2">
              <Link
                href="/dashboard/hacker/projects"
                className="block w-full rounded-lg border border-border bg-surface text-left px-3 py-2 text-sm font-medium text-primary hover:bg-surface-hover transition-all"
              >
                My Projects
              </Link>
              <Link
                href="/dashboard/hacker/journey"
                className="block w-full rounded-lg border border-border bg-surface text-left px-3 py-2 text-sm font-medium text-primary hover:bg-surface-hover transition-all"
              >
                Journey
              </Link>
            </div>
          </div>

          <div className="bh-card p-6">
            <h3 className="text-lg font-bold text-primary">Upcoming Events</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="mb-4">
                Attend hackathons, meet other hackers, and win prizes.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-red hover:underline"
              >
                Browse all events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
