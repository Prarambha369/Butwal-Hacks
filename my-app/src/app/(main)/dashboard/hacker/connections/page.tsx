import { buildPageMetadata } from "@/lib/seo";
import { AccountConsolidation } from "@/components/dashboard/hacker/account-consolidation";

export const metadata = {
  ...buildPageMetadata({
    title: "Account Connections",
    description: "Manage and merge your Butwal Hacks accounts",
    path: "/dashboard/hacker/connections",
    keywords: [],
  }),
};

export default function AccountConnectionsPage() {
  return (
    <div className="space-y-6">
      <AccountConsolidation />
    </div>
  );
}
