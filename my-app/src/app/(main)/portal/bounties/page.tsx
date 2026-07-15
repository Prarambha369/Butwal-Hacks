import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { getSponsorOpportunities } from "@/lib/actions/sponsor-opportunities";
import { Plus } from "lucide-react";
import OpportunitiesManager from "./opportunities-manager";

export const dynamic = "force-dynamic";

export default async function SponsorOpportunitiesPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/sign-in");

  const opportunities = await getSponsorOpportunities();

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-primary">Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            Post jobs, internships, grants, and bounties to attract talent from the community.
          </p>
        </div>
        <a
          href="/portal/bounties/new"
          className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all"
        >
          <Plus size={16} />
          New Opportunity
        </a>
      </div>

      <OpportunitiesManager opportunities={opportunities} />
    </div>
  );
}
