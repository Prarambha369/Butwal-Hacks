import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { Settings2 } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo"
import { getSiteContentMap } from "@/lib/actions/site-content";
import { EDITABLE_KEYS } from "@/lib/site-content-keys";
import SiteContentEditor from "./site-content-editor";


export const metadata = { ...buildPageMetadata({title: "Site Config", description: "Edit displayed site copy", path: "/dashboard/maintainer/site-config", keywords: []}), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function SiteConfigPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  const values = await getSiteContentMap();

  return (
    <div className="flex-1 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-1">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Settings</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Site Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Edit the copy shown on the site. Empty means today&apos;s default text.
        </p>
      </div>
      <SiteContentEditor keys={EDITABLE_KEYS} initialValues={values} />
    </div>
  );
}
