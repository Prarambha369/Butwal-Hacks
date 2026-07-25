import { auth0 } from "@/lib/auth0";
import { redirect, notFound } from "next/navigation";
import { createServiceClient } from "@/utils/supabase";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { CalendarDays, Users, Trophy, Plus } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `${slug} Dashboard`,
    description: `Chapter dashboard for ${slug}`,
    path: `/orgs/${slug}/dashboard`,
  });
}

export default async function OrgDashboardPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect("/sign-in");

  const supabase = createServiceClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!chapter) notFound();

  // Look up admin role from chapter_members table
  const { data: membershipProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", userId)
    .single();

  const { data: membership } = await supabase
    .from("chapter_members")
    .select("org_role")
    .eq("chapter_id", chapter.id)
    .eq("profile_id", membershipProfile?.id ?? 'none')
    .single();

  const isAdmin = membership?.org_role === "admin";

  const { count: memberCount } = await supabase
    .from("chapter_members")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", chapter.id);

  const { count: eventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", chapter.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {chapter.name}
          </h1>
          <p className="text-sm text-primary/50">
            {isAdmin ? "Chapter Admin — you manage this community" : "Chapter Member"}
          </p>
        </div>
        {isAdmin && (
          <a
            href={`/orgs/${slug}/events/new`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-red/20 text-primary-red border border-primary-red/30 hover:bg-primary-red/30 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(160px,auto)]">
        <StatCard title="Members" value={memberCount ?? 0} icon={<Users className="text-status-blue" />} description="Chapter members" variant="hero" />
        <StatCard title="Events" value={eventCount ?? 0} icon={<CalendarDays className="text-status-green" />} description="Chapter events" />
        <StatCard title="Role" value={isAdmin ? "Admin" : "Member"} icon={<Trophy className="text-status-yellow" />} description={isAdmin ? "Full chapter access" : "Participant access"} />
      </div>

      <div className="bh-card p-8 space-y-6">
        <h3 className="text-lg font-bold text-primary">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href={`/orgs/${slug}/events`} className="p-4 rounded-xl bg-surface/10 border border-border hover:bg-surface/10 transition-all flex items-center gap-3 text-sm font-medium text-primary/80">
            <CalendarDays className="w-5 h-5 text-status-green" />
            Browse Events
          </a>
          <a href={`/orgs/${slug}/members`} className="p-4 rounded-xl bg-surface/10 border border-border hover:bg-surface/10 transition-all flex items-center gap-3 text-sm font-medium text-primary/80">
            <Users className="w-5 h-5 text-status-blue" />
            View Members
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, variant }: { title: string; value: string | number; icon: React.ReactNode; description: string; variant?: 'hero' | 'compact' }) {
  const isHero = variant === 'hero';
  return (
    <div className={`bh-card ${isHero ? 'md:col-span-2 md:row-span-2 p-8' : 'p-6'} space-y-${isHero ? '5' : '4'} ${isHero ? 'md:flex md:flex-col md:justify-center' : ''}`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 ${isHero ? 'p-3' : ''} rounded-xl bg-surface/10`}>{icon}</div>
      </div>
      <div>
        <p className="text-sm text-primary/50">{title}</p>
        <p className={`font-bold text-primary ${isHero ? 'text-5xl' : 'text-3xl'}`}>{value}</p>
      </div>
      <p className="text-[10px] font-medium text-primary/30 uppercase tracking-tighter">{description}</p>
    </div>
  );
}
