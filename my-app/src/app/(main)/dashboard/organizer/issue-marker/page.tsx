import React from "react";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { IssueMarkerForm } from "@/components/dashboard/organizer/issue-marker-form";

export default async function IssueMarkerPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Issue Trust Marker</h1>
          <p className="text-muted-foreground">
            Grant verified achievements to community members — even if they haven&apos;t signed up yet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bh-card p-8 space-y-6">
            <IssueMarkerForm />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bh-card p-6 space-y-4">
            <SectionHeading variant="icon" icon={<AlertCircle size={20} />} color="yellow" as="h3">
              Marker Guidelines
            </SectionHeading>
            <ul className="text-xs text-muted-foreground space-y-3">
              <li className="flex gap-2">
                <span className="text-status-yellow">•</span>
                Markers should be tied to verifiable outcomes.
              </li>
              <li className="flex gap-2">
                <span className="text-status-yellow">•</span>
                Always provide a clear justification in the description.
              </li>
              <li className="flex gap-2">
                <span className="text-status-yellow">•</span>
                If the email doesn&apos;t have an account, a claim link is sent automatically.
              </li>
              <li className="flex gap-2">
                <span className="text-status-yellow">•</span>
                Markers are immutable once claimed unless revoked by a maintainer.
              </li>
              <li className="flex gap-2">
                <span className="text-status-yellow">•</span>
                Claim links expire after 30 days.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
