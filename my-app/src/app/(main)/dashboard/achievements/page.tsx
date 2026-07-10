import React from 'react';
import { auth0 } from "@/lib/auth0";
import { createClient } from '@/utils/supabase/server';
import { calculateLevel } from '@/lib/gamification/levels';
import LevelBadge from '@/components/dashboard/level-badge';
import { Trophy, Star, Zap, Lock } from 'lucide-react';

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

  const achievementList = [
    { id: 'first-project', title: 'First Ship', desc: 'Submit your first project', icon: <Zap />, xp: 100, unlocked: unlockedBadgeIds.has('First Ship') },
    { id: 'team-lead', title: 'Squad Leader', desc: 'Form a team of 3+ members', icon: <Star />, xp: 250, unlocked: unlockedBadgeIds.has('Squad Leader') },
    { id: 'verified', title: 'Trust Verified', desc: 'Get GitHub verification', icon: <Trophy />, xp: 500, unlocked: unlockedBadgeIds.has('Verified Build') },
    { id: 'impact', title: 'Community Pillar', desc: 'Reach 100 project likes', icon: <Star />, xp: 1000, unlocked: unlockedBadgeIds.has('Community Pillar') },
  ];

  return (
    <div className="p-6 md:p-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-bh-red-500">Gamification</span>
          <h1 className="text-4xl font-bold tracking-tight">Your Achievements</h1>
          <p className="text-secondary opacity-60">Track your growth and unlock elite builder markers.</p>
        </div>
        <div className="lg-surface px-6 py,3 rounded-2xl flex items-center gap-4 border border-glass">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase opacity-40">Current Progress</p>
            <p className="text-lg font-bold font-mono">{userXp} XP</p>
          </div>
          <LevelBadge xp={userXp} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievementList.map((ach) => (
          <div 
            key={ach.id} 
            className={`lg-surface rounded-3xl p-6 border transition-all duration-500 ${
              ach.unlocked ? 'border-bh-red-500/30 bg-bh-red-500/5' : 'border-glass opacity-60 grayscale'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-2xl ${ach.unlocked ? 'bg-bh-red-500 text-primary' : 'bg-surface/10 text-secondary'}`}>
                {ach.icon}
              </div>
              {!ach.unlocked && <Lock size={16} className="opacity-20" />}
            </div>
            <h3 className="text-xl font-bold mb-2">{ach.title}</h3>
            <p className="text-sm text-secondary opacity-60 mb-6">{ach.desc}</p>
            <div className="flex items-center justify-between pt-4 border-t border-glass">
              <span className="text-xs font-mono opacity-40">Reward: {ach.xp} XP</span>
              {ach.unlocked && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-bh-red-500">Unlocked</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} // ponytail: Updated to use Clerk authentication for all user and role data.