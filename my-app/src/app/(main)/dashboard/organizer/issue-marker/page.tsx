import React from "react";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { IssueMarkerForm } from "@/components/dashboard/organizer/issue-marker-form";

export default async function IssueMarkerPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Issue Trust Marker</h1>
          <p className="text-secondary opacity-60">
            Grant verified achievements to community members — even if they haven&apos;t signed up yet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
            <IssueMarkerForm />
          </div>
        </div>

        <div className="space-y-6">
          <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
            <div className="flex items-center gap-3 text-status-yellow">
              <AlertCircle size={20} />
              <h3 className="font-bold">Marker Guidelines</h3>
            </div>
            <ul className="text-xs text-secondary opacity-60 space-y-3">
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                Markers should be tied to verifiable outcomes.
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                Always provide a clear justification in the description.
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                If the email doesn&apos;t have an account, a claim link is sent automatically.
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                Markers are immutable once claimed unless revoked by a maintainer.
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-500">•</span>
                Claim links expire after 30 days.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
