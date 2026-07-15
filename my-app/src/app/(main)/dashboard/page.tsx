import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";
import { BHIDClaimCard } from "@/components/dashboard/bhid-claim-card";
import { ToolGuideSection } from "@/components/dashboard/tool-guide-section";
import { OnboardingSteps } from "@/components/dashboard/onboarding-steps";
import { DashboardInitialScreen } from "@/components/dashboard/dashboard-initial-screen";
import { ArrowRight, Sparkles } from "lucide-react";

export default async function DashboardHubPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) return null;

  const email = session.user.email ?? "";
  const emailVerified = session.user.email_verified === true;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth0_user_id", userId)
    .single();

  const profileId = profile?.id;

  // Get project count for onboarding progress
  const { count: projectCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId ?? "none");

  // Get chapter count
  const { count: chapterCount } = await supabase
    .from("chapter_members")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId ?? "none");

  const bhId = profile?.bh_id || profile?.slug_id || "BH-••••••";
  const role = profile?.role || "hacker";
  const fullName = profile?.full_name || "New Hacker";
  const xp = profile?.xp || 0;

  return (
    <DashboardInitialScreen email={email} emailVerified={emailVerified} currentRole={role}>
    <div className="min-h-dvh bg-bg-base text-text-body pt-16 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* ── Page Header ── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary-red" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary-red">
              Dashboard Hub
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
            Welcome to Butwal Hacks
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            This is your central hub. Claim your identity, complete your onboarding, and explore every tool available to you.
          </p>
        </div>

        {/* ── Section 1: BH-ID Identity Card ── */}
        <BHIDClaimCard bhId={bhId} role={role} fullName={fullName} xp={xp} />

        {/* ── Section 2: Onboarding Steps ── */}
        <OnboardingSteps
          profile={profile}
          projectCount={projectCount ?? 0}
          chapterCount={chapterCount ?? 0}
        />

        {/* ── Section 3: Tool Guide ── */}
        <ToolGuideSection />

        {/* ── Section 4: Quick Start CTA ── */}
        <div className="bh-card p-6 md:p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-primary">
            Ready to start building?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Head to your role-specific dashboard to access all your tools, track progress, and manage your projects.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/dashboard/${role}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-red text-white text-sm font-bold hover:bg-deep-red transition-all shadow-[--bh-glow-red-soft] hover:shadow-[--bh-glow-red] active:scale-[0.97]"
            >
              Go to {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-surface text-primary text-sm font-bold hover:bg-surface-hover transition-all active:scale-[0.97]"
            >
              Explore the Community
            </Link>
          </div>
        </div>
      </div>
    </div>
    </DashboardInitialScreen>
  );
}
