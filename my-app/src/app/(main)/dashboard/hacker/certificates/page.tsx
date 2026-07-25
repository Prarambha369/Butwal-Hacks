import { auth0 } from "@/lib/auth0";
import { createClient } from '@/utils/supabase';
import { calculateLevel } from '@/lib/gamification/levels';
import LevelBadge from '@/components/dashboard/level-badge';
import { Trophy, Star, Zap, Lock, Award } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) return <div className="p-12 text-center">Please log in to view achievements.</div>;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('auth0_user_id', userId)
    .single();

  const userXp = profile?.xp || 0;
  void calculateLevel(userXp);

  const { data: userBadges } = await supabase
    .from('trust_markers')
    .select('title')
    .eq('auth0_user_id', userId);

  const unlockedBadgeIds = new Set(userBadges?.map(b => b.title) || []);
  const anyUnlocked = unlockedBadgeIds.size > 0;

  const achievementList = [
    { id: 'first-project', title: 'First Ship', desc: 'Submit your first project', icon: <Zap />, xp: 100, unlocked: unlockedBadgeIds.has('First Ship') },
    { id: 'team-lead', title: 'Squad Leader', desc: 'Form a team of 3+ members', icon: <Star />, xp: 250, unlocked: unlockedBadgeIds.has('Squad Leader') },
    { id: 'verified', title: 'Trust Verified', desc: 'Get GitHub verification', icon: <Trophy />, xp: 500, unlocked: unlockedBadgeIds.has('Verified Build') },
    { id: 'impact', title: 'Community Pillar', desc: 'Reach 100 project likes', icon: <Star />, xp: 1000, unlocked: unlockedBadgeIds.has('Community Pillar') },
  ];

  return (
    <div className="flex-1 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-red/10 text-[10px] font-bold text-primary-red">Gamification</span>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Your Achievements</h1>
          <p className="text-sm text-muted-foreground">Track your progress and unlock new trust markers.</p>
        </div>
        <div className="bh-card px-6 py-3 flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Current Progress</p>
            <p className="text-lg font-bold font-mono text-primary">{userXp} XP</p>
          </div>
          <LevelBadge xp={userXp} />
        </div>
      </div>

      {anyUnlocked ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievementList.map((ach) => (
            <div 
              key={ach.id} 
              className={`bh-card p-6 transition-all duration-500 ${
                ach.unlocked ? 'border-bh-red-500/30 bg-primary-red/5' : 'opacity-60 grayscale'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-lg ${ach.unlocked ? 'bg-bh-red-500 text-white' : 'bg-surface-hover text-muted-foreground'}`}>
                  {ach.icon}
                </div>
                {!ach.unlocked && <Lock size={16} className="text-muted-foreground/30" />}
              </div>
              <h3 className="text-xl font-bold mb-2">{ach.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{ach.desc}</p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs font-mono text-muted-foreground">Reward: {ach.xp} XP</span>
                {ach.unlocked && (
                  <span className="text-[10px] font-bold text-primary-red">✓ Unlocked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Award className="w-12 h-12" />}
          title="No achievements yet"
          description="Start building to unlock achievements. Submit your first project, join a team, and earn trust markers to level up."
          actions={[
            { label: "Explore events", href: "/events", variant: "primary" },
            { label: "Submit a project", href: "/dashboard/hacker/projects", variant: "secondary" },
          ]}
          hint="Completing achievements earns XP and unlocks trust markers"
        />
      )}
    </div>
  );
} // ponytail: Uses Auth0 authentication for all user and role data.