import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getUserProjects } from '@/lib/actions/projects';
import ActivityFeed from '@/components/dashboard/activity-feed';
import LevelBadge from '@/components/dashboard/level-badge';
import { Trophy, Target, Zap, LayoutDashboard, Building2, ChevronRight, ExternalLink } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { auth0 } from "@/lib/auth0";
import FirstRunWizard from '@/components/dashboard/first-run-wizard';

export default async function HackerOverviewPage() {
  const supabase = await createClient();
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth0_user_id', userId)
    .single();

  const profileId = profile?.id;
  const userProjects = profileId ? await getUserProjects(profileId) : [];

  // Fetch user's chapters
  const { data: chapterMemberships } = await supabase
    .from('chapter_members')
    .select(`
      org_role,
      chapters!inner(id, slug, name)
    `)
    .eq('profile_id', profileId ?? 'none');

  return (
    <div className="space-y-8">
      <FirstRunWizard
        profile={profile}
        projectCount={userProjects.length}
        chapterCount={chapterMemberships?.length ?? 0}
      />
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Hacker Overview</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}. Here is your progress.</p>
        </div>
        <LevelBadge xp={profile?.xp || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(160px,auto)]">
        <StatCard
          title="Total XP"
          value={profile?.xp || 0}
          icon={<Zap className="text-status-yellow" />}
          description="Experience points earned"
          variant="hero"
        />
        <StatCard
          title="Projects"
          value={userProjects.length}
          icon={<Trophy className="text-primary-red" />}
          description="Projects submitted"
        />
        <StatCard
          title="Trust Markers"
          value={profile?.trust_markers?.length || 0}
          icon={<Target className="text-status-blue" />}
          description="Verified achievements"
        />
      </div>

      {/* Your Chapters Section */}
      {chapterMemberships && chapterMemberships.length > 0 && (
        <div className="space-y-4">
          <SectionHeading variant="accent">Your Chapters</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapterMemberships.map((m) => {
              const chapter = (m.chapters as unknown) as { id: string; slug: string; name: string };
              const isAdmin = m.org_role === 'admin';
              return (
                <Link
                  key={chapter.id}
                  href={`/orgs/${chapter.slug}/dashboard`}
                  className="bh-card p-4 hover:bg-surface-hover  active:scale-100 transition-all duration-150 ease-out flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-red/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-red" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{chapter.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {isAdmin ? 'Admin' : 'Member'} · {chapter.slug}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Explore Chapters CTA when no chapters */}
      {(!chapterMemberships || chapterMemberships.length === 0) && (
        <div className="bh-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-red/10">
                <Building2 className="w-5 h-5 text-primary-red" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">No chapters yet</p>
                <p className="text-xs text-muted-foreground">Join a hackathon chapter to collaborate with your local community.</p>
              </div>
            </div>
            <Link
              href="/explore"
              className="flex items-center gap-2 text-xs font-medium text-primary-red hover:text-primary-red/[0.65] transition-colors"
            >
              Explore <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <SectionHeading variant="icon" icon={<LayoutDashboard size={14} />}>
            Recent Activity
          </SectionHeading>
          <ActivityFeed />
        </div>
        <div className="space-y-4">
          <SectionHeading variant="badge" badge="Milestones">Next Up</SectionHeading>
          <div className="bh-card p-6 space-y-6">
            <MilestoneItem
              title="Level Up"
              current={profile?.xp || 0}
              target={1000}
              desc="Reach Level 2"
            />
            <MilestoneItem
              title="First Ship"
              current={0}
              target={1}
              desc="Submit your first project"
            />
            <MilestoneItem
              title="Team Lead"
              current={0}
              target={1}
              desc="Form a verified team"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, variant }: { title: string, value: string | number, icon: React.ReactNode, description: string, variant?: 'hero' | 'compact' }) {
  const isHero = variant === 'hero';
  return (
    <div className={`bh-card ${isHero ? 'md:col-span-2 md:row-span-2 p-8' : 'p-6'} space-y-${isHero ? '4' : '3'} transition-all ${isHero ? 'md:flex md:flex-col md:justify-center' : ''}`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 ${isHero ? 'p-3' : ''} rounded-lg bg-surface-hover`}>{icon}</div>
        <span className="text-[10px] font-mono text-muted-foreground">Current</span>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`font-bold tracking-tight text-primary ${isHero ? 'text-5xl' : 'text-3xl'}`}>{value}</p>
      </div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{description}</p>
    </div>
  );
}

function MilestoneItem({ title, current, target, desc }: { title: string, current: number, target: number, desc: string }) {
  const progress = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold text-primary">
        <span>{title}</span>
        <span className="font-mono text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
        <div className="h-full bg-bh-red-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
    </div>
  );
}
