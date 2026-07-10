"use server";

import { logger } from "@/lib/logger";
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";

export async function awardXP(profileId: string, amount: number, reason: string) {
  const supabase = createServiceClient();
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.sub;

  // ponytail: Resolve profile UUID for actor_id FK
  const { data: actor } = await supabase
    .from("profiles").select("id").eq("auth0_user_id", userId).single();
  if (!actor) throw new Error("Profile not found");

  const { data: profile } = await supabase
    .from("profiles").select("xp").eq("id", profileId).single();

  const currentXP = profile?.xp ?? 0;
  const newXP = currentXP + amount;

  const { error } = await supabase
    .from("profiles").update({ xp: newXP }).eq("id", profileId);
  if (error) throw error;

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: actor.id, action: "XP_AWARDED", target_type: "profile",
    target_id: profileId, metadata: { amount, reason, new_xp: newXP },
  })
  if (auditError) logger.error("Failed to log XP award:", auditError)

  revalidatePath("/dashboard");
  return { success: true, newXP };
}

export async function distributeProjectXP(projectId: string, amount: number) {
  const supabase = createServiceClient();
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) throw new Error("Unauthorized");

  const { data: contributions } = await supabase
    .from("project_contributions").select("profile_id").eq("project_id", projectId);
  if (!contributions?.length) throw new Error("No contributors found");

  const share = Math.floor(amount / contributions.length);
  const contributorIds = contributions.map((c) => c.profile_id);

  const { data: profiles } = await supabase
    .from("profiles").select("id, xp").in("id", contributorIds);

  const xpMap = new Map((profiles ?? []).map((p) => [p.id, p.xp ?? 0]));

  // ponytail: Resolve profile UUID for actor_id FK
  const { data: actor } = await supabase
    .from("profiles").select("id").eq("auth0_user_id", userId).single();
  if (!actor) throw new Error("Profile not found");

  await Promise.allSettled(
    contributorIds.map(async (profileId) => {
      const newXP = (xpMap.get(profileId) ?? 0) + share;
      await supabase.from("profiles").update({ xp: newXP }).eq("id", profileId);
      await supabase.from("audit_logs").insert({
        actor_id: actor.id, action: "XP_DISTRIBUTED", target_type: "project",
        target_id: projectId, metadata: { amount: share, project_id: projectId },
      });
    }),
  );

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}
