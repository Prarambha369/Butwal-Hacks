import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { Settings2, Construction } from "lucide-react";

export default async function SiteConfigPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-1">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Settings</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Site Configuration</h1>
        <p className="text-sm text-muted-foreground">Manage global site settings and feature flags.</p>
      </div>
      <div className="bh-card p-12 text-center space-y-4">
        <div className="inline-flex p-3 rounded-lg bg-surface-hover">
          <Construction className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-bold text-primary">Coming Soon</p>
          <p className="text-sm text-muted-foreground">Site configuration panel is under development.</p>
        </div>
      </div>
    </div>
  );
}
