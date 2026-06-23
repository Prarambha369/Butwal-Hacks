"use server";

import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { resolveProfileId } from "@/lib/profile-resolver";

export async function sendTeamInvite(teamId: string, profileId: string) {
  const supabase = createServiceClient();
  const senderId = await resolveProfileId();

  const { data: membership } = await supabase
    .from("team_members").select("id").eq("team_id", teamId).eq("profile_id", senderId).single();
  if (!membership) throw new Error("You must be a team member to send invites");

  const { error } = await supabase
    .from("team_invites")
    .insert({ team_id: teamId, profile_id: profileId, status: "pending" });
  if (error) throw error;

  revalidatePath("/teams");
  return { success: true };
}

export async function acceptTeamInvite(inviteId: string) {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  const { data: invite } = await supabase
    .from("team_invites").select("*").eq("id", inviteId).single();
  if (!invite) throw new Error("Invite not found");

  // Only the intended recipient can accept
  if (invite.profile_id !== profileId) throw new Error("This invite is not for you");

  const { error: memberError } = await supabase
    .from("team_members").insert({ team_id: invite.team_id, profile_id: invite.profile_id });
  if (memberError) throw memberError;

  const { error: updateError } = await supabase
    .from("team_invites").update({ status: "accepted" }).eq("id", inviteId);
  if (updateError) throw updateError;

  revalidatePath("/teams");
  return { success: true };
}

export async function denyTeamInvite(inviteId: string) {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  const { data: invite } = await supabase
    .from("team_invites").select("profile_id").eq("id", inviteId).single();
  if (!invite) throw new Error("Invite not found");

  // Only the intended recipient can deny
  if (invite.profile_id !== profileId) throw new Error("This invite is not for you");

  const { error } = await supabase
    .from("team_invites").update({ status: "denied" }).eq("id", inviteId);
  if (error) throw error;

  revalidatePath("/teams");
  return { success: true };
}

export async function requestToJoinTeam(teamId: string) {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  const { error } = await supabase
    .from("team_invites").insert({ team_id: teamId, profile_id: profileId, status: "pending" });
  if (error) throw error;

  revalidatePath("/teams");
  return { success: true };
}
