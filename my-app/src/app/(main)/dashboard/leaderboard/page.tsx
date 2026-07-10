import React from 'react';
import { createClient } from '@/utils/supabase/server';

import LevelBadge from '@/components/dashboard/level-badge';
import {TrendingUp, Medal} from 'lucide-react';

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('full_name, xp, bh_id')
    .order('xp', { ascending: false })
    .limit(100);

  if (error) return <div className="p-10 text-bh-red-500">Error loading leaderboard: {error.message}</div>;

  return (
    <div className="p-6 md:p-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-bh-red-500">Global Ranking</span>
          <h1 className="text-4xl font-bold tracking-tight">Community Leaderboard</h1>
          <p className="text-secondary opacity-60">Celebrating the most impactful builders in the ecosystem.</p>
        </div>
        <div className="flex gap-4">
          <div className="lg-surface px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-mono">
            <TrendingUp size={14} className="text-status-green" />
            <span>Real-time Updates</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Top 3 Podium */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[0, 1, 2].map((rank) => {
            const profile = profiles?.[rank];
            if (!profile) return null;
            return (
              <div key={profile.bh_id} className={`lg-surface rounded-3xl p-8 text-center relative overflow-hidden transition-all hover:-translate-y-2 ${rank === 0 ? 'ring-2 ring-status-yellow bg-status-yellow/5' : ''}`}>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-surface/10 rounded-full blur-3xl" />
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-glass shadow-xl`}>
                    <Medal size={32} className={rank === 0 ? 'text-status-yellow' : rank === 1 ? 'text-secondary' : 'text-status-orange'} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{profile.full_name}</h3>
                <p className="text-xs font-mono opacity-40 mb-4">{profile.bh_id}</p>
                <div className="flex justify-center">
                  <LevelBadge xp={profile.xp} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Main List */}
        <div className="lg:col-span-4 lg-surface rounded-3xl overflow-hidden border border-glass">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface/10 text-xs font-mono uppercase tracking-widest opacity-40 border-b border-glass">
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">Hacker</th>
                <th className="px-6 py-4 font-medium text-right">XP</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map((profile, index) => (
                <tr key={profile.bh_id} className="border-b border-glass5 hover:bg-surface/10 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm opacity-60">#{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold group-hover:text-bh-red-500 transition-colors">{profile.full_name}</span>
                      <span className="text-[10px] font-mono opacity-40">{profile.bh_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold">{profile.xp.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <LevelBadge xp={profile.xp} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
