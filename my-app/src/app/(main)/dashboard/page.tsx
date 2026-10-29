import Link from "next/link";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { BHIDClaimCard } from "@/components/dashboard/bhid-claim-card";
import { ToolGuideSection } from "@/components/dashboard/tool-guide-section";
import { OnboardingSteps } from "@/components/dashboard/onboarding-steps";
import { DashboardInitialScreen } from "@/components/dashboard/dashboard-initial-screen";
import DashboardHubStats from "@/components/dashboard/dashboard-hub-stats";
import { PageHeader } from "@/components/dashboard/shell/page-header";
import { ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = { ...buildPageMetadata({title: "Dashboard", description: "Your Butwal Hacks dashboard overview", path: "/dashboard", keywords: []}), robots: { index: false, follow: false } };

/**
 * Role-aware dashboard hub at the bare /dashboard path.
 *
 * Redirects to sign-in without a session. Middleware already guards this
 * route, but the redirect is repeated here so the page can never render
 * blank if the proxy is ever bypassed.
 */
export default async function DashboardHubPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  // Middleware guards /dashboard, but never render a blank page if the
  // session is missing (e.g. expired mid-render) — send them to login.
  if (!userId) redirect("/auth/login?returnTo=/dashboard/onboarding");

  const email = session.user.email ?? "";
  const emailVerified = session.user.email_verified === true;

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth0_user_id", userId)
    .single();

  const profileId = profile?.id;

  // These five only need `profileId`, so they are independent of each other
  // and were five sequential round-trips. Serialising them put every PostgREST
  // latency in the critical path before first paint, which is the LCP. One
  // profile query has to come first because it resolves `profileId`; the rest
  // now cost one round-trip in total instead of five.
  const [
    { count: projectCount },
    { count: trustMarkerCount },
    { count: hackathonCount },
    { count: chapterCount },
    { data: projectDetails },
  ] = await Promise.all([
    // Get project count for onboarding progress
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId ?? "none"),
    // Get trust marker count
    supabase
      .from("trust_markers")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId ?? "none"),
    // Get event registration count
    supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId ?? "none"),
    // Get chapter count
    supabase
      .from("chapter_members")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId ?? "none"),
    // Project details for onboarding substep tracking
    supabase
      .from("projects")
      .select("tech_stack, github_url, demo_url")
      .eq("profile_id", profileId ?? "none"),
  ]);

  const projectHasStack = projectDetails?.some(p => (p.tech_stack?.length ?? 0) > 0) ?? false;
  const projectHasLink = projectDetails?.some(p => p.github_url || p.demo_url) ?? false;

  const bhId = profile?.bh_id || profile?.slug_id || "BH-••••••";
  const role = profile?.role || "hacker";
  const fullName = profile?.full_name || "New Hacker";

  const locale = 'en' as Locale; // Server component — can't use useLanguage. Falls back to 'en'.

  return (
    <DashboardInitialScreen email={email} emailVerified={emailVerified} currentRole={role}>
    <div className="min-h-dvh bg-background text-primary pt-20 pb-24 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          eyebrow={t('dashboard.hub', locale)}
          title={t('dashboard.welcome_heading', locale)}
          description={t('dashboard.hub_description', locale)}
        />

        {/* ── Section 1: BH-ID Identity Card ── */}
        <BHIDClaimCard bhId={bhId} role={role} fullName={fullName} />

        {/* ── Section 2: Stats & Activity ── */}
        <DashboardHubStats
          trustMarkerCount={trustMarkerCount ?? 0}
          projectCount={projectCount ?? 0}
          hackathonCount={hackathonCount ?? 0}
          chapterCount={chapterCount ?? 0}
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
        <div className="rounded-xl border border-border bg-surface p-8 md:p-10 text-center space-y-5 shadow-sm hover:shadow-md transition-all">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary tracking-tight">
              {t('dashboard.ready_build', locale)}
            </h2>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {t('dashboard.ready_description', locale)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/dashboard/${role}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-bh-red-action text-white text-sm font-semibold hover:bg-deep-red transition-all shadow-sm hover:shadow-md"
            >
              {t('dashboard.go_to_role', locale).replace('{role}', role.charAt(0).toUpperCase() + role.slice(1))}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-surface text-primary text-sm font-semibold hover:bg-surface-hover transition-all"
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
