"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { AVAILABLE_REWARDS } from "@/lib/data/rewards";
import { resolveProfileId } from "@/lib/profile-resolver";

export async function redeemReward(rewardId: string) {
  const supabase = createServiceClient();
  
  const userId = await resolveProfileId();

  const reward = AVAILABLE_REWARDS.find(r => r.id === rewardId);
  if (!reward) throw new Error("Reward not found");

  // Check XP balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", userId)
    .single();

  if (!profile || (profile.xp || 0) < reward.cost) {
    throw new Error(`Insufficient XP. You need ${reward.cost} XP to redeem this.`);
  }

  // Deduct XP
  const newXP = (profile.xp || 0) - reward.cost;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ xp: newXP })
    .eq("id", userId);

  if (updateError) throw updateError;

  // ponytail: marker insert and audit log are independent — run concurrently
  const [markerResult, logResult] = await Promise.all([
    supabase
      .from("trust_markers")
      .upsert({
        profile_id: userId,
        type: 'reward',
        title: reward.name,
        description: `Redeemed via XP Store: ${reward.description}`,
        created_at: new Date().toISOString(),
      }, { onConflict: 'profile_id, title' }),
    supabase
      .from("audit_logs")
      .insert({
        actor_id: userId,
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
  revalidatePath("/dashboard/hacker/certificates");
  return { success: true, remainingXP: newXP };
}
