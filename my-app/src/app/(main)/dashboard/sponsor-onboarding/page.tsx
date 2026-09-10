import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import AssistantPanel from "@/components/assistant-panel";
import { Sparkles, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * /dashboard/sponsor-onboarding — sponsor funnel interstitial.
 *
 * Triggers: a sponsor lands here before completing the Open Collective →
 * company profile → talent search funnel. Shows the three-step funnel and
 * drops them into the right next step.
 *
 * Completion heuristics:
 *  - Has sponsor_profiles row AND at least one sponsor_opportunity →
 *    funnel complete → redirect to /portal/recruiters
 *  - Otherwise render the funnel guide + persistent BH Bot.
 */
export default async function SponsorOnboardingPage() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    redirect("/auth/login");
  }

  const userId = session.user.sub;
  const email = session.user.email ?? "";

  const db = createServiceClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, role, slug_id")
    .eq("auth0_user_id", userId)
    .single();

  if (!profile || (profile.role !== "sponsor" && profile.role !== "maintainer")) {
    redirect("/dashboard");
  }

  if (profile.role === "maintainer") {
    redirect("/dashboard/maintainer");
  }

  const sponsorId = profile.id;

  const [{ data: companyProfile }, { data: hasOpportunity }] = await Promise.all([
    db
      .from("sponsor_profiles")
      .select("id")
      .eq("profile_id", sponsorId)
      .maybeSingle(),
    db
      .from("sponsor_opportunities")
      .select("id")
      .eq("sponsor_profile_id", sponsorId)
      .maybeSingle(),
  ]);

  // Funnel complete → talent search
  if (companyProfile && hasOpportunity) {
    redirect("/portal/recruiters");
  }

  return (
    <div className="min-h-dvh bg-bg-base flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-red" />
          <span className="text-sm font-bold uppercase tracking-widest text-primary-red">
            Butwal Hacks · Sponsor
          </span>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">{email}</div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex p-3 rounded-xl bg-status-blue/10">
              <Building2 className="w-6 h-6 text-status-blue" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary">
              Sponsor Onboarding
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Connect your sponsorship, set up your company profile so hackers can
              find you, then browse verified talent. The whole funnel takes a few
              minutes.
            </p>
          </div>

          {/* Current step is step 1 — make that obvious */}
          <ol className="space-y-3">
            <FunnelStep
              number="1"
              current
              title="Connect Open Collective"
              description="Butwal Hacks operates on Open Collective. Link your sponsorship so bounties and payouts flow through a transparent, auditable channel."
              href="https://opencollective.com/butwal-hacks"
              external
            />

            <FunnelStep
              number="2"
              title="Set Up Your Company Profile"
              description="Tell hackers who you are — company name, website, logo, industries, and locations. This is what appears on your sponsor page and in recruiter search."
              href="/portal/sponsors/company"
            />

            <FunnelStep
              number="3"
              title="Discover Verified Hackers"
              description="Browse the talent directory filtered by skills, trust markers, and achievements. Reach out to hackers whose profile matches what you are looking for."
              href="/portal/recruiters"
            />
          </ol>

          <div className="mt-8 p-4 rounded-xl bg-primary-red/5 border border-primary-red/20 text-center">
            <p className="text-xs text-muted-foreground">
              Not sure where to start? Open BH Bot and ask &quot;how do I sponsor
              an event?&quot; — it will walk you through it.
            </p>
          </div>

          <AssistantPanel context="sponsor" />
        </div>
      </main>
    </div>
  );
}

function FunnelStep({
  number,
  title,
  description,
  href,
  external,
  current,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  current?: boolean;
}) {
  const isCurrent = current ?? false;
  return (
    <li className={isCurrent ? "" : "opacity-70"}>
      <div className={`bh-card p-5 border ${isCurrent ? "border-primary-red/30 bg-primary-red/[0.02]" : "border-border"}`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-mono font-bold ${isCurrent ? "bg-primary-red text-white" : "bg-status-blue/10 text-status-blue"}`}>
            {number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-primary">{title}</h3>
              {isCurrent && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-red bg-primary-red/10 px-1.5 py-0.5 rounded-full">
                  Current step
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
            <div className="mt-3">
              {external ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${isCurrent ? "text-primary-red" : "text-muted-foreground hover:text-primary"}`}
                >
                  Open Open Collective
                  <ArrowRight className="w-3 h-3" />
                </a>
              ) : (
                <Link
                  href={href}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${isCurrent ? "text-primary-red hover:text-deep-red" : "text-muted-foreground hover:text-primary"}`}
                >
                  {isCurrent ? "Start this step" : `Go to ${title}`}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
