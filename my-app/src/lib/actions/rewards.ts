"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: 'profile' | 'event' | 'digital';
}

export const AVAILABLE_REWARDS: Reward[] = [
  { id: 'gold-border', name: 'Golden Profile Border', description: 'A prestigious gold ring around your avatar.', cost: 1000, icon: '✨', category: 'profile' },
  { id: 'custom-bio', name: 'Custom Bio Formatting', description: 'Unlock Markdown and emojis in your bio.', cost: 500, icon: '✍️', category: 'profile' },
  { id: 'priority-reg', name: 'Event Priority Registration', description: 'Skip the queue for the next major hackathon.', cost: 2000, icon: '🚀', category: 'event' },
  { id: 'exclusive-sticker', name: 'Digital Achievement Sticker', description: 'A unique badge for your public portfolio.', cost: 300, icon: '🎨', category: 'digital' },
  { id: 'mentor-session', name: '1:1 Mentor Session', description: '30 minutes with a top-tier industry expert.', cost: 5000, icon: '🎓', category: 'event' },
];

export async function redeemReward(rewardId: string) {
  const supabase = createServiceClient();
  
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.sub;

  const reward = AVAILABLE_REWARDS.find(r => r.id === rewardId);
  if (!reward) throw new Error("Reward not found");

  // Check XP balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("auth0_user_id", userId)
    .single();

  if (!profile || (profile.xp || 0) < reward.cost) {
    throw new Error(`Insufficient XP. You need ${reward.cost} XP to redeem this.`);
  }

  // Deduct XP
  const newXP = (profile.xp || 0) - reward.cost;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ xp: newXP })
    .eq("auth0_user_id", userId);

  if (updateError) throw updateError;

  // ponytail: Resolve profile UUID for FK columns
  const { data: profileUuid } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();
  if (!profileUuid) throw new Error("Profile not found");

  // ponytail: marker insert and audit log are independent — run concurrently
  const [markerResult, logResult] = await Promise.all([
    supabase
      .from("trust_markers")
      .upsert({
        profile_id: profileUuid.id,
        type: 'reward',
        title: reward.name,
        description: `Redeemed via XP Store: ${reward.description}`,
        created_at: new Date().toISOString(),
      }, { onConflict: 'profile_id, title' }),
    supabase
      .from("audit_logs")
      .insert({
        actor_id: profileUuid.id,
        action: "REWARD_REDEEMED",
        target_type: "reward",
        target_id: rewardId,
        metadata: {
          cost: reward.cost,
          reward_name: reward.name,
          previous_xp: profile.xp,
          new_xp: newXP,
        },
      }),
  ]);

  if (markerResult.error) {
    logger.error("Failed to grant reward marker:", markerResult.error);
  }
  if (logResult.error) {
    logger.error("Failed to log reward redemption:", logResult.error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rewards");
  return { success: true, remainingXP: newXP };
}
