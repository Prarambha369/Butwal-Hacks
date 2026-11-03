import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";
import { DEV_USER_ID, isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass";
import { redirect } from "next/navigation";
import { roleRedirect } from "@/lib/role-gate";
import { buildPageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/dashboard/shell/page-header";
import { AccountConsolidation } from "@/components/dashboard/hacker/account-consolidation";

export const metadata = {
  ...buildPageMetadata({
    title: "Account Connections",
    description: "Manage and merge your Butwal Hacks accounts",
    path: "/dashboard/hacker/connections",
    keywords: [],
  }),
};

export default async function AccountConnectionsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub || (isDevAuthBypassEnabled() ? DEV_USER_ID : undefined);

  if (!userId) {
    redirect("/auth/login");
  }

  const db = createServiceClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, role, slug_id, full_name")
    .eq("auth0_user_id", userId)
    .single();

  const blocked = roleRedirect(profile?.role, ["hacker", "lead", "maintainer", "organizer"]);
  if (blocked) {
    redirect(blocked);
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        eyebrow="Account"
        title="Account Connections"
        description="Manage your connected accounts and merge duplicate profiles"
        actions={null}
      />

      <AccountConsolidation />
    </div>
  );
}
