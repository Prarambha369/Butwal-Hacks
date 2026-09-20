import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { RoleSelector } from "@/components/dashboard/role-selector";
import AssistantPanel from "@/components/assistant-panel";
import { Sparkles, User, CalendarDays, Building2 } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = { ...buildPageMetadata({title: "Onboarding", description: "Complete your onboarding", path: "/dashboard/onboarding", keywords: []}), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

/**
 * /dashboard/onboarding — post-login role selection gate.
 *
 * One flow, three destinations:
 *  - Hacker     → /dashboard/hacker   (BH-ID already issued; build profile, find teammates)
 *  - Organizer  → /dashboard/organizer (force first event creation)
 *  - Sponsor    → /portal/recruiters  (Open Collective → talent search)
 *  - Maintainer → /dashboard/maintainer (already has access)
 *
 * Returning users (ROLE_SELECTED_KEY set, or non-hacker role) skip straight
 * to their dashboard. New sessions see only the role picker — no hub noise.
 *
 * NOTE: Auth0 post-login redirect should point here (not /dashboard).
 * That redirect URL is set in Auth0 Application config → Application URIs,
 * not in this codebase. Update it to /dashboard/onboarding to make this
 * gate the true first experience after login.
 */
export default async function OnboardingPage() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    redirect("/auth/login");
  }

  const email = session.user.email ?? "";
  const emailVerified = session.user.email_verified === true;
  const userId = session.user.sub;

  const db = createServiceClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", userId)
    .single();

  const currentRole = profile?.role ?? "hacker";

  // Non-hacker roles already have a destination — skip the picker
  if (currentRole !== "hacker") {
    redirect(`/dashboard/${currentRole}`);
  }

  // When the user already picked a role in a previous session, the client
  // RoleSelector reads ROLE_SELECTED_KEY from localStorage and instead of
  // showing the picker again it renders a "proceed as Hacker" fallback.
  // We still render RoleSelector here so that client logic can run.

  return (
    <div className="min-h-dvh bg-bg-base flex flex-col">
      {/* Navbar-style top bar (light, matches marketing shell) */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-red" />
          <span className="text-sm font-bold uppercase tracking-widest text-primary-red">
            Butwal Hacks
          </span>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">
          {email}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 pb-20">
        <div className="w-full max-w-2xl">
          {/* Welcome + track cards */}
          <WelcomeSection />

          <RoleSelector email={email} emailVerified={emailVerified} />

          {/* Persistent BH Bot helper — flow-aware suggestions for this path */}
          <AssistantPanel context="hacker" />
        </div>
      </main>
    </div>
  );
}

function WelcomeSection() {
  return (
    <div className="text-center space-y-6 mb-10">
      <div className="inline-flex p-3 rounded-xl bg-primary-red/10">
        <Sparkles className="w-6 h-6 text-primary-red" />
      </div>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
        Welcome to Butwal Hacks
      </h1>

      <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
        Pick the role that fits what you want to do next. Your BH-ID travels with
        you either way, and you can change your role later or request an upgrade.
      </p>
      <p className="text-xs text-muted-foreground/80 max-w-lg mx-auto leading-relaxed">
        New here? Everything is free, beginners are welcome, and our community is moderated.
        You are safe to ask basic questions.
      </p>

      {/* Three destination cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
        <TrackCard
          icon={<User className="w-5 h-5" />}
          title="Hacker"
          color="text-status-green"
          bg="bg-status-green/10"
          border="border-status-green/20"
          description="Get your BH-ID (your Hacker ID), finish your profile, find teammates, and ship your first project."
        />
        <TrackCard
          icon={<CalendarDays className="w-5 h-5" />}
          title="Organizer"
          color="text-status-yellow"
          bg="bg-status-yellow/10"
          border="border-status-yellow/20"
          description="Run hackathons. Create your first event, issue trust markers, and manage participants."
        />
        <TrackCard
          icon={<Building2 className="w-5 h-5" />}
          title="Sponsor / Recruiter"
          color="text-status-blue"
          bg="bg-status-blue/10"
          border="border-status-blue/20"
          description="Connect with verified talent. Fund bounties via Open Collective and search hackers by skill."
        />
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        Already have a role? Choose it below and the system sends you there.
      </p>
    </div>
  );
}

function TrackCard({
  icon,
  title,
  color,
  bg,
  border,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  bg: string;
  border: string;
  description: string;
}) {
  return (
    <div
      className={`bh-card p-4 border ${border} ${bg} rounded-xl`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${bg} ${color}`}>
        {icon}
      </div>
      <h3 className={`text-sm font-bold ${color} mb-1`}>{title}</h3>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
