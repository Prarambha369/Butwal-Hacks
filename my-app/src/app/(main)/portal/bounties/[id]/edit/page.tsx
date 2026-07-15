import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/utils/supabase/service";
import { ArrowLeft } from "lucide-react";
import OpportunityForm from "../../opportunity-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth0.getSession();
  if (!session?.user) redirect("/sign-in");

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", session.user.sub)
    .single();

  const { data: sponsor } = await supabase
    .from("sponsor_profiles")
    .select("profile_id")
    .eq("profile_id", profile?.id)
    .maybeSingle();

  // Fetch and verify ownership
  const { data: opp } = await supabase
    .from("sponsor_opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (!opp) notFound();
  if (!sponsor || opp.sponsor_profile_id !== sponsor.profile_id) {
    redirect("/portal/bounties");
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <a
          href="/portal/bounties"
          className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft size={12} />
          Back to Opportunities
        </a>
        <h1 className="text-2xl font-bold text-primary">Edit Opportunity</h1>
        <p className="text-secondary text-sm mt-1">Update your listing.</p>
      </div>

      <OpportunityForm
        initialData={{
          id: opp.id,
          title: opp.title,
          description: opp.description,
          type: opp.type,
          compensation: opp.compensation || "",
          currency: opp.currency || "USD",
          location: opp.location || "",
          is_remote: opp.is_remote,
          skills_required: opp.skills_required || [],
          application_url: opp.application_url || "",
          application_deadline: opp.application_deadline,
          is_bounty: opp.is_bounty,
          bounty_amount: opp.bounty_amount,
        }}
      />
    </div>
  );
}
