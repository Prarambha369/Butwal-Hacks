import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Search, Users, Briefcase, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SponsorDashboardPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/sign-in");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("auth0_user_id", userId)
    .single();

  // Count total hackers in the platform
  const { count: hackerCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "hacker");

  // Count projects
  const { count: projectCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Sponsor Dashboard
        </h1>
        <p className="text-secondary text-sm mt-1">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}. Discover and recruit talent from the Butwal Hacks community.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="lg-surface rounded-2xl border border-glass p-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-blue/20 text-status-blue">
              <Users size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Hackers</span>
          </div>
          <p className="text-3xl font-bold text-primary">{hackerCount ?? "—"}</p>
          <p className="text-xs text-secondary">Active community members ready to build</p>
        </div>

        <div className="lg-surface rounded-2xl border border-glass p-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-teal/20 text-status-teal">
              <Briefcase size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Projects</span>
          </div>
          <p className="text-3xl font-bold text-primary">{projectCount ?? "—"}</p>
          <p className="text-xs text-secondary">Open-source and hackathon projects</p>
        </div>

        <div className="lg-surface rounded-2xl border border-glass p-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-green/20 text-status-green">
              <Search size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Discovery</span>
          </div>
          <p className="text-sm font-bold text-primary">Browse Directory</p>
          <a
            href="/dashboard/sponsor/hackers"
            className="inline-flex items-center gap-1 text-xs text-bh-red-500 hover:text-bh-red-600 transition-colors"
          >
            Find talent <Eye size={12} />
          </a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="lg-surface rounded-2xl border border-glass p-6 space-y-4">
        <h2 className="text-base font-bold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/dashboard/sponsor/hackers"
            className="flex items-center gap-3 p-4 rounded-xl bg-surface/10 border border-glass hover:border-bh-red-500/30 transition-all group"
          >
            <div className="p-2 rounded-lg bg-status-blue/20 text-status-blue group-hover:scale-110 transition-transform">
              <Search size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Discover Hackers</p>
              <p className="text-xs text-secondary">Browse profiles and projects</p>
            </div>
          </a>
          <a
            href="/dashboard/sponsor/opportunities"
            className="flex items-center gap-3 p-4 rounded-xl bg-surface/10 border border-glass hover:border-bh-red-500/30 transition-all group"
          >
            <div className="p-2 rounded-lg bg-status-teal/20 text-status-teal group-hover:scale-110 transition-transform">
              <Briefcase size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Post Opportunity</p>
              <p className="text-xs text-secondary">Share jobs, internships, or grants</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
