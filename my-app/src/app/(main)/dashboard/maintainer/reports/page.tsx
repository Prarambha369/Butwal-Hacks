import { redirect } from "next/navigation";
import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

import { accessSubjectFor, isMaintainer } from "@/lib/dashboard-access";
import ReportsPanel, {
  type ConductReport,
} from "@/components/dashboard/maintainer/reports-panel";

export const metadata: Metadata = {
  title: "Reports — Maintainer",
  description: "Code of conduct and suspected cheating reports.",
};

export default async function MaintainerReportsPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/sign-in");

  const supabase = createServiceClient();

  // The proxy already gates /dashboard/maintainer by role, but this page
  // reads other people's reports. Use the shared predicate rather than
  // re-deriving `role === 'maintainer'`: staff authority is the role AND a
  // verified address on the staff domain, and a page that checks only the
  // role would accept an account the dashboard layout refuses.
  const { data: caller } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (!caller || !isMaintainer(accessSubjectFor(session.user, caller))) {
    redirect("/dashboard");
  }

  const { data } = await supabase
    .from("conduct_reports")
    .select(
      "id, category, details, status, resolution, created_at, project_id, event_id, reporter_anonymous",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const reports = (data ?? []) as ConductReport[];

  return (
    <div className="flex-1 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-1">
          <ShieldAlert className="w-5 h-5 text-primary-red" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-red">
            Conduct
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Code of conduct and suspected cheating reports. Handling follows{" "}
          <Link href="/policies/incident-response" className="text-primary-red hover:underline">
            the incident response procedure
          </Link>
          .
        </p>
      </div>

      <ReportsPanel reports={reports} />
    </div>
  );
}
