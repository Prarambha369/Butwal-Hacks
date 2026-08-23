import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Briefcase, DollarSign, Eye, Building2, Settings, Sparkles } from "lucide-react";
import {
  TopSkillsChart,
  ProjectsSubmittedChart,
  DemographicsChart,
} from "@/components/charts/sponsor-charts";

export const dynamic = "force-dynamic";

export default async function SponsorDashboardPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/sign-in");

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("auth0_user_id", userId)
    .single();

  const { count: hackerCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "hacker");

  const { count: bountyCount } = await supabase
    .from("sponsor_opportunities")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  // ── Projects by day (last 7 days) for chart ──
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentProjects } = await supabase
    .from("projects")
    .select("created_at")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: true });

  const projectsByDay: Record<string, number> = {};
  const shortDayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  recentProjects?.forEach((p) => {
    const d = new Date(p.created_at);
    const key = shortDayLabels[d.getDay()];
    projectsByDay[key] = (projectsByDay[key] || 0) + 1;
  });
  const projectsChartData = shortDayLabels.map((day) => ({
    day,
    count: projectsByDay[day] || 0,
  }));

  // ── Top skills from project tech_stacks ──
  const { data: projectSkills } = await supabase
    .from("projects")
    .select("tech_stack")
    .not("tech_stack", "is", null)
    .limit(100);

  const skillCounts: Record<string, number> = {};
  projectSkills?.forEach((p) => {
    const stack = p.tech_stack as string[] | null;
    stack?.forEach((skill: string) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });
  const skillsChartData = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Sponsor Dashboard</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-status-teal/10 text-status-teal text-[10px] font-mono font-bold border border-status-teal/20">
            Sponsor
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Discover talent, manage bounties, and track your impact.
          {profile?.full_name ? ` Welcome, ${profile.full_name}.` : ""}
        </p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bh-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-status-teal/10">
              <Briefcase className="w-5 h-5 text-status-teal" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Bounties</span>
          </div>
          <p className="text-4xl font-bold text-primary">{bountyCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">Active bounties and opportunities</p>
        </div>

        <div className="bh-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-status-blue/10">
              <Eye className="w-5 h-5 text-status-blue" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Discovery</span>
          </div>
          <p className="text-4xl font-bold text-primary">{hackerCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">Hackers in the talent pool</p>
        </div>

        <div className="bh-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-status-green/10">
              <DollarSign className="w-5 h-5 text-status-green" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Distributed</span>
          </div>
          <p className="text-4xl font-bold text-primary">$0</p>
          <p className="text-xs text-muted-foreground">Funds distributed via Open Collective</p>
        </div>
      </div>

      {/* Quick Actions + Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Analytics Charts */}
        <div className="lg:col-span-3 space-y-6">
          <TopSkillsChart data={skillsChartData} />

          {/* Projects & Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProjectsSubmittedChart data={projectsChartData} />
            <DemographicsChart data={[]} />
          </div>
        </div>

        {/* Right: Navigation & Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Talent Search CTA */}
          <div className="bh-card p-5 space-y-4 bg-gradient-to-br from-status-blue/5 to-transparent border-status-blue/10">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-status-blue" />
              <h3 className="text-sm font-bold text-primary">Discover Talent</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Browse hacker profiles, their projects, and verified trust markers. Find the perfect candidate for your next opportunity.
            </p>
            <Link
              href="/portal/recruiters"
              className="inline-flex items-center gap-1.5 w-full justify-center px-4 py-2.5 rounded-full bg-status-blue text-white text-xs font-bold hover:bg-status-blue/80 transition-all"
            >
              <Search className="w-3.5 h-3.5" /> Browse Directory
            </Link>
            <p className="text-[10px] text-muted-foreground text-center">{hackerCount ?? 0} hackers available</p>
          </div>

          {/* Bounty Board CTA */}
          <div className="bh-card p-5 space-y-4 bg-gradient-to-br from-status-teal/5 to-transparent border-status-teal/10">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-status-teal" />
              <h3 className="text-sm font-bold text-primary">Post a Bounty</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create paid opportunities for hackers. Set a budget, define deliverables, and let the community apply.
            </p>
            <Link
              href="/portal/bounties/new"
              className="inline-flex items-center gap-1.5 w-full justify-center px-4 py-2.5 rounded-full bg-status-teal text-white text-xs font-bold hover:bg-status-teal/80 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> New Opportunity
            </Link>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{bountyCount ?? 0} active bounties</span>
              <Link href="/portal/bounties" className="text-primary-red hover:underline">View all</Link>
            </div>
          </div>

          {/* Company Profile Settings */}
          <div className="bh-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-red" />
              <h3 className="text-sm font-bold text-primary">Company Profile</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-hover border border-border">
                <span className="text-xs text-muted-foreground">Company Name</span>
                <span className="text-xs font-bold text-primary">{profile?.full_name ?? "Not set"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-hover border border-border">
                <span className="text-xs text-muted-foreground">Open Collective</span>
                <span className="text-xs font-bold text-primary">Not connected</span>
              </div>
              <Link
                href="/portal/sponsors/company"
                className="inline-flex items-center gap-1.5 w-full justify-center px-4 py-2 rounded-lg border border-border text-xs font-medium text-primary hover:bg-surface-hover transition-all"
              >
                <Settings className="w-3.5 h-3.5" /> Manage Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
