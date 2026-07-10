import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import OpportunityForm from "../opportunity-form";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <a
          href="/dashboard/sponsor/opportunities"
          className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft size={12} />
          Back to Opportunities
        </a>
        <h1 className="text-2xl font-bold text-primary">New Opportunity</h1>
        <p className="text-secondary text-sm mt-1">
          Post a job, internship, grant, or bounty for the Butwal Hacks community.
        </p>
      </div>

      <OpportunityForm />
    </div>
  );
}
