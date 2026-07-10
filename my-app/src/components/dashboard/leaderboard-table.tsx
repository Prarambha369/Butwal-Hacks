"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trophy, Zap, Medal } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from "@auth0/nextjs-auth0/client";
import { Profile } from '@/lib/supabase-types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface LeaderboardEntry {
  rank: number;
  profile: Profile;
  score: number;
}

const PAGE_SIZE = 50;

export default function LeaderboardTable() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<'xp' | 'impact' | 'badges'>('xp');
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClient();
  const { user } = useUser();

  const fetchLeaderboard = async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // ponytail: range() for server-side pagination instead of fetching all profiles
      const query = supabase
        .from('profiles')
        .select('*, trust_markers(count)')
        .order(sortBy === 'xp' ? 'xp' : 'created_at', { ascending: false })
        .range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      setHasMore(data.length === PAGE_SIZE);

      const ranked = (data || []).map((p, idx) => {
        let score = 0;
        if (sortBy === 'xp') score = p.xp || 0;
        if (sortBy === 'badges') score = p.trust_markers?.[0]?.count || 0;
        if (sortBy === 'impact') score = Math.floor(Math.random() * 1000); // Simulation

        return { rank: from + idx + 1, profile: p, score };
      }).sort((a, b) => b.score - a.score);

      setEntries(prev => append ? [...prev, ...ranked] : ranked);

      if (user) {
        const myIdx = ranked.findIndex(e => e.profile.id === user.id);
        setMyRank(myIdx !== -1 ? myIdx + 1 : null);
      }
    } catch {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchLeaderboard(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  if (loading) return (
    <div className="space-y-8">
      <div className="flex justify-center gap-4">{['xp', 'impact', 'badges'].map(t => <Skeleton key={t} className="h-9 w-24 rounded-full" />)}</div>
      <div className="lg-surface rounded-3xl border border-glass overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-4 border-b border-glass5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Sort Controls */}
      <div className="flex justify-center gap-4">
        {( ['xp', 'impact', 'badges'] as const ).map(type => (
          <button 
            key={type}
            onClick={() => setSortBy(type)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all border",
              sortBy === type 
                ? "bg-bh-red-500 text-primary border-bh-red-500" 
                : "bg-surface/10 text-secondary border-glass hover:bg-surface/10"
            )}
          >
            {type === 'xp' && 'Total XP'}
            {type === 'impact' && 'Impact'}
            {type === 'badges' && 'Badges'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="lg-surface rounded-3xl border border-glass overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface/10 text-xs font-mono text-secondary uppercase tracking-widest">
              <th className="px-6 py-4 w-20 text-center">Rank</th>
              <th className="px-6 py-4">Hacker</th>
              <th className="px-6 py-4 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {entries.map((entry, idx) => (
              <tr key={entry.profile.id} className={cn(
                "group transition-all hover:bg-surface/10",
                idx === 0 && "bg-bh-red-500/5",
                entry.rank === 1 && "border-l-4 border-l-yellow-400"
              )}>
                <td className="px-6 py-4 text-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-xs",
                    entry.rank === 1 ? "bg-yellow-400 text-primary" : 
                    entry.rank === 2 ? "bg-surface text-primary" : 
                    entry.rank === 3 ? "bg-orange-400 text-primary" : "bg-surface/10 text-secondary"
                  )}>
                    {entry.rank}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 overflow-hidden rounded-full ring-1 ring-white/10">
                      <Image 
                        src={entry.profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.profile.full_name}`} 
                        alt={entry.profile.full_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold group-hover:text-bh-red-500 transition-colors">{entry.profile.full_name}</p>
                      <p className="text-[10px] font-mono text-secondary">{entry.profile.bh_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-bold font-mono">{entry.score.toLocaleString()}</span>
                    {sortBy === 'xp' && <Zap className="w-3 h-3 text-yellow-400" />}
                    {sortBy === 'impact' && <Trophy className="w-3 h-3 text-orange-400" />}
                    {sortBy === 'badges' && <Medal className="w-3 h-3 text-blue-400" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && entries.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              const next = page + 1;
              setPage(next);
              fetchLeaderboard(next, true);
            }}
            disabled={loading}
            className="px-6 py-2 rounded-full bg-surface/10 border border-glass text-xs font-bold text-secondary hover:bg-surface/10 transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* My Rank Sticky Footer */}
      {myRank && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="lg-surface px-6 py-3 rounded-full border border-glass shadow-2xl flex items-center gap-4 backdrop-blur-md">
            <div className="text-xs font-mono text-secondary uppercase tracking-widest">Your Rank:</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-bh-red-500 text-primary text-[10px] font-bold flex items-center justify-center">
                #{myRank}
              </div>
              <span className="text-sm font-bold">Keep grinding!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
