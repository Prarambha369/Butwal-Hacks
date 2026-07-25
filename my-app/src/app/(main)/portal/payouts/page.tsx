import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { redirect } from "next/navigation";

import PayoutsClient from "./payouts-client";

export const dynamic = "force-dynamic";

export default async function SponsorPayoutsPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/sign-in");

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (!profile) redirect("/sign-in");

  // Sponsor or maintainer can view
  if (!["sponsor", "maintainer"].includes(profile.role ?? "")) {
    redirect("/dashboard");
  }

  const { data: payouts } = await supabase
    .from("sponsor_payouts")
    .select(`
      *,
      opportunity:sponsor_opportunities(id, title, bounty_amount),
      hacker:profiles!sponsor_payouts_hacker_id_fkey(id, full_name, bh_id, email),
      sponsor_org:profiles!sponsor_payouts_sponsor_id_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return <PayoutsClient payouts={payouts ?? []} />;
}
