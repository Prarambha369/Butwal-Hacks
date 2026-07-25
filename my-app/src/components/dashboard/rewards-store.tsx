"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Zap, Award, FileEdit, Badge, GraduationCap } from 'lucide-react';
import { createClient } from '@/utils/supabase';
import { useUser } from "@auth0/nextjs-auth0/client";
import { cn } from '@/lib/utils';
import { CardSkeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { AVAILABLE_REWARDS } from '@/lib/data/rewards';

const REWARD_ICONS: Record<string, React.ReactNode> = {
  'gold-border': <Award className="w-8 h-8" />,
  'custom-bio': <FileEdit className="w-8 h-8" />,
  'priority-reg': <Zap className="w-8 h-8" />,
  'exclusive-sticker': <Badge className="w-8 h-8" />,
  'mentor-session': <GraduationCap className="w-8 h-8" />,
};

export default function RewardsStore() {
  const [userXP, setUserXP] = useState(0);
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useUser();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // Auth0 uses user.sub (not user.id) — query profiles by auth0_user_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, xp')
        .eq('auth0_user_id', user.sub)
        .single();

      setUserXP(profile?.xp || 0);

      // audit_logs.actor_id references profiles(id) (UUID), not Auth0 sub string
      if (profile?.id) {
        const { data: redemptions } = await supabase
          .from('audit_logs')
          .select('target_id')
          .eq('actor_id', profile.id)
          .eq('action', 'REWARD_REDEEMED');
        setRedeemed(redemptions?.map(r => r.target_id) || []);
      }
    } catch (error) {
      logger.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (rewardId: string) => {
    setError(null); // clear stale errors before retry
    try {
      const { redeemReward } = await import('@/lib/actions/rewards');
      const result = await redeemReward(rewardId);
      if (result.success) {
        setUserXP(result.remainingXP);
        setRedeemed(prev => [...prev, rewardId]);
        setError(null);
        toast.success('Reward redeemed successfully!');
      }
    } catch (err: unknown) {
      // ponytail: inline error so user sees it right next to the redeem button
      setError(err instanceof Error ? err.message : 'Redemption failed');
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary-red" /> Rewards Store
          </h3>
          <p className="text-sm text-muted-foreground">Spend your hard-earned XP on exclusive perks.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Your Balance</p>
          <p className="text-2xl font-black text-primary-red">{userXP} XP</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-red/10 border border-primary-red/30 text-primary-red text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-primary-red/60 hover:text-primary-red text-xs">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_REWARDS.map(reward => {
          const isRedeemed = redeemed.includes(reward.id);
          const canAfford = userXP >= reward.cost;

          return (
            <div key={reward.id} className={cn(
              "bh-card p-6 border transition-all duration-300",
              isRedeemed ? "border-status-green/30 bg-status-green/5" : "border-border hover:border-border"
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-surface-hover border border-border flex items-center justify-center text-primary">
                  {REWARD_ICONS[reward.id] ?? <Award className="w-8 h-8" />}
                </div>
                {isRedeemed ? (
                  <div className="p-1 rounded-full bg-status-green text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                    canAfford ? "bg-primary-red/20 text-primary-red" : "bg-surface-hover text-muted-foreground"
                  )}>
                    {reward.category}
                  </div>
                )}
              </div>

              <h4 className="text-lg font-bold mb-2">{reward.name}</h4>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                {reward.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                  <Zap className="w-3 h-3 text-status-yellow" />
                  {reward.cost} XP
                </div>
                <button 
                  onClick={() => handleRedeem(reward.id)}
                  disabled={isRedeemed || !canAfford}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    isRedeemed 
                      ? "bg-status-green/20 text-status-green cursor-default" 
                      : canAfford 
                        ? "bg-bh-red-500 text-primary hover:bg-primary-red/90" 
                        : "bg-surface-hover text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isRedeemed ? 'Owned' : 'Redeem'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
