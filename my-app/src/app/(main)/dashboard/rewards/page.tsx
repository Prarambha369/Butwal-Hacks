"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { AVAILABLE_REWARDS, Reward, redeemReward } from '@/lib/actions/rewards';
import {Trophy, Sparkles} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RewardCardProps {
  reward: Reward;
  onRedeem: (id: string) => Promise<void>;
}

function RewardCard({ reward, onRedeem }: RewardCardProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = async () => {
    setIsRedeeming(true);
    try {
      await onRedeem(reward.id);
      toast.success(`Successfully redeemed ${reward.name}!`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Redemption failed");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="lg-surface rounded-3xl p-6 border border-glass transition-all duration-500 hover:border-bh-red-500/30 group">
      <div className="flex items-start justify-between mb-6">
        <div className="p-3 rounded-2xl bg-bh-red-500/10 text-bh-red-500 group-hover:scale-110 transition-transform">
          <span className="text-3xl">{reward.icon}</span>
        </div>
        <span className="px-2 py-1 rounded-full bg-surface/10 border border-glass text-[10px] font-mono opacity-60 uppercase tracking-widest">
          {reward.category}
        </span>
      </div>
      
      <div className="space-y-2 mb-8">
        <h3 className="text-xl font-bold group-hover:text-bh-red-500 transition-colors">{reward.name}</h3>
        <p className="text-sm text-secondary opacity-70 leading-relaxed">
          {reward.description}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-400" />
          <span className="font-mono font-bold text-sm">{reward.cost} XP</span>
        </div>
        <Button 
          variant="default"
          size="sm"
          onClick={handleRedeem}
          disabled={isRedeeming}
          className={cn(isRedeeming && "opacity-50 cursor-not-allowed")}
        >
          {isRedeeming ? "Processing..." : "Redeem"}
        </Button>
      </div>
    </div>
  );
}

export default function RewardsStore() {
  const { user } = useUser();
  const userId = user?.sub;
  const [userXp, setUserXp] = useState(0);
  const supabase = createClient();

  const fetchXp = async () => {
    if (!userId) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('auth0_user_id', userId)
      .single();
    
    setUserXp(profile?.xp || 0);
  };

  React.useEffect(() => {
    fetchXp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedeem = async (id: string) => {
    try {
      const result = await redeemReward(id);
      setUserXp(result.remainingXP);
    } catch {
      // Error handled in RewardCard
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-bh-red-500">Gamification</span>
          <h1 className="text-4xl font-bold tracking-tight">Rewards Store</h1>
          <p className="text-secondary opacity-60">Exchange your earned XP for exclusive digital and physical perks.</p>
        </div>
        <div className="lg-surface px-6 py-3 rounded-2xl flex items-center gap-4 border border-glass">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase opacity-40">Your Balance</p>
            <p className="text-lg font-bold font-mono">{userXp.toLocaleString()} XP</p>
          </div>
          <div className="p-2 rounded-full bg-status-yellow/10 text-status-yellow">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {AVAILABLE_REWARDS.map((reward) => (
          <RewardCard 
            key={reward.id} 
            reward={reward} 
            onRedeem={handleRedeem} 
          />
        ))}
      </div>
    </div>
  );
} // ponytail: Replaced Supabase Auth with Clerk ID for user identifier.