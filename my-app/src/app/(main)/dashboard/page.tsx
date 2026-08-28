import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase";
import { BHIDClaimCard } from "@/components/dashboard/bhid-claim-card";
import { ToolGuideSection } from "@/components/dashboard/tool-guide-section";
import { OnboardingSteps } from "@/components/dashboard/onboarding-steps";
import { DashboardInitialScreen } from "@/components/dashboard/dashboard-initial-screen";
import DashboardHubStats from "@/components/dashboard/dashboard-hub-stats";
import { ArrowRight, Sparkles } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

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

  // Get trust marker count
  const { count: trustMarkerCount } = await supabase
    .from("trust_markers")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId ?? "none");

  // Get event registration count
  const { count: hackathonCount } = await supabase
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId ?? "none");

  // Get chapter count
  const { count: chapterCount } = await supabase
    .from("chapter_members")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId ?? "none");

  // Fetch project details for onboarding substep tracking
  const { data: projectDetails } = await supabase
    .from("projects")
    .select("tech_stack, github_url, demo_url")
    .eq("profile_id", profileId ?? "none");

  const projectHasStack = projectDetails?.some(p => (p.tech_stack?.length ?? 0) > 0) ?? false;
  const projectHasLink = projectDetails?.some(p => p.github_url || p.demo_url) ?? false;

  const bhId = profile?.bh_id || profile?.slug_id || "BH-••••••";
  const role = profile?.role || "hacker";
  const fullName = profile?.full_name || "New Hacker";

  const locale = 'en' as Locale; // Server component — can't use useLanguage. Falls back to 'en'.

  return (
    <DashboardInitialScreen email={email} emailVerified={emailVerified} currentRole={role}>
    <div className="min-h-dvh bg-bg-base text-text-body pt-16 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* ── Page Header ── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary-red" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary-red">
              {t('dashboard.hub', locale)}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
            {t('dashboard.welcome_heading', locale)}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            {t('dashboard.hub_description', locale)}
          </p>
        </div>

        {/* ── Section 1: BH-ID Identity Card ── */}
        <BHIDClaimCard bhId={bhId} role={role} fullName={fullName} />

        {/* ── Section 2: Stats & Activity ── */}
        <DashboardHubStats
          trustMarkerCount={trustMarkerCount ?? 0}
          projectCount={projectCount ?? 0}
          hackathonCount={hackathonCount ?? 0}
        />

        {/* ── Section 3: Onboarding Steps ── */}
        <OnboardingSteps
          profile={profile}
          projectCount={projectCount ?? 0}
          chapterCount={chapterCount ?? 0}
          projectHasStack={projectHasStack}
          projectHasLink={projectHasLink}
        />

        {/* ── Section 4: Tool Guide ── */}
        <ToolGuideSection />

        {/* ── Section 5: Quick Start CTA ── */}
        <div className="bh-card p-6 md:p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-primary">
            {t('dashboard.ready_build', locale)}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {t('dashboard.ready_description', locale)}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/dashboard/${role}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-red text-white text-sm font-bold hover:bg-deep-red transition-all shadow-[--bh-glow-red-soft] hover:shadow-[--bh-glow-red] active:scale-[0.97]"
            >
              {t('dashboard.go_to_role', locale).replace('{role}', role.charAt(0).toUpperCase() + role.slice(1))}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-surface text-primary text-sm font-bold hover:bg-surface-hover transition-all active:scale-[0.97]"
            >
              {t('dashboard.explore_community', locale)}
            </Link>
          </div>
        </div>
      </div>
    </div>
    </DashboardInitialScreen>
  );
}
