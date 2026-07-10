import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getUserProjects } from '@/lib/actions/projects';
import ActivityFeed from '@/components/dashboard/activity-feed';
import LevelBadge from '@/components/dashboard/level-badge';
import { Trophy, Target, Zap, LayoutDashboard, Building2, ChevronRight, ExternalLink } from 'lucide-react';
import SkillTree from '@/components/dashboard/skill-tree';
import { CertificateScanner } from '@/components/dashboard/certificate-scanner';
import { auth0 } from "@/lib/auth0";

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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Hacker Overview</h1>
          <p className="text-secondary opacity-60">Welcome back, {profile?.full_name}. Here is your progress.</p>
        </div>
        <LevelBadge xp={profile?.xp || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total XP" 
          value={profile?.xp || 0} 
          icon={<Zap className="text-status-yellow" />} 
          description="Experience points earned" 
        />
        <StatCard 
          title="Projects" 
          value={userProjects.length} 
          icon={<Trophy className="text-bh-red-500" />} 
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
          <h3 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
            <Building2 size={16} />
            Your Chapters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapterMemberships.map((m) => {
              const chapter = (m.chapters as unknown) as { id: string; slug: string; name: string };
              const isAdmin = m.org_role === 'admin';
              return (
                <Link
                  key={chapter.id}
                  href={`/orgs/${chapter.slug}/dashboard`}
                  className="lg-surface p-4 rounded-2xl border border-glass hover:bg-surface/10 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bh-red-500/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-bh-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{chapter.name}</p>
                      <p className="text-[10px] font-mono text-primary/40">
                        {isAdmin ? 'Admin' : 'Member'} · {chapter.slug}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-primary/20 group-hover:text-primary/50 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Explore Chapters CTA when no chapters */}
      {(!chapterMemberships || chapterMemberships.length === 0) && (
        <div className="lg-surface p-6 rounded-3xl border border-glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-bh-red-500/10">
                <Building2 className="w-5 h-5 text-bh-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">No chapters yet</p>
                <p className="text-xs text-primary/50">Join a hackathon chapter to collaborate with your local community.</p>
              </div>
            </div>
            <Link
              href="/explore"
              className="flex items-center gap-2 text-xs font-medium text-bh-red-500 hover:text-red-300 transition-colors"
            >
              Explore <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Skill Tree / Micro-Credentials */}
      <SkillTree />

      {/* AI Certificate Scanner */}
      <CertificateScanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
            <LayoutDashboard size={16} />
            Recent Activity
          </h3>
          <ActivityFeed />
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Next Milestones</h3>
          <div className="lg-surface p-6 rounded-3xl border border-glass space-y-6">
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

function StatCard({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) {
  return (
    <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-surface/10">{icon}</div>
        <span className="text-xs font-mono opacity-40">Current</span>
      </div>
      <div>
        <p className="text-sm text-secondary opacity-60">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <p className="text-[10px] font-medium opacity-40 uppercase tracking-tighter">{description}</p>
    </div>
  );
}

function MilestoneItem({ title, current, target, desc }: { title: string, current: number, target: number, desc: string }) {
  const progress = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span>{title}</span>
        <span className="font-mono opacity-60">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full bg-surface/10 rounded-full overflow-hidden">
        <div className="h-full bg-bh-red-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[10px] opacity-40">{desc}</p>
    </div>
  );
}
