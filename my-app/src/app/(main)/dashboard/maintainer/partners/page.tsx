import { getAllPartners } from "@/lib/actions/partners";
import { PartnersClient } from "./partners-client";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = { ...buildPageMetadata({ title: "Partners", description: "Manage the homepage partner wall", path: "/dashboard/maintainer/partners", keywords: [] }), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function MaintainerPartnersPage() {
  const partners = await getAllPartners();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Partners</h1>
        <p className="text-sm text-muted-foreground">
          Homepage wall ({partners.filter((p) => p.is_active).length} visible)
        </p>
      </div>
      <PartnersClient initialPartners={partners} />
    </div>
  );
}
