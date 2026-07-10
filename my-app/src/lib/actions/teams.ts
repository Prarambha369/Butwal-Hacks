"use server";

import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";

export async function sendTeamInvite(teamId: string, profileId: string) {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.sub;

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("team_invites")
    .insert({ team_id: teamId, profile_id: profileId, status: "pending" });
  if (error) throw error;

  revalidatePath("/dashboard/teams");
  return { success: true };
}

export async function acceptTeamInvite(inviteId: string) {
  const supabase = createServiceClient();
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.sub;

  const { data: invite } = await supabase
    .from("team_invites").select("*").eq("id", inviteId).single();
  if (!invite) throw new Error("Invite not found");

  const { error: memberError } = await supabase
    .from("team_members").insert({ team_id: invite.team_id, profile_id: invite.profile_id });
  if (memberError) throw memberError;

  const { error: updateError } = await supabase
    .from("team_invites").update({ status: "accepted" }).eq("id", inviteId);
  if (updateError) throw updateError;

  revalidatePath("/dashboard/teams");
  return { success: true };
}

export async function denyTeamInvite(inviteId: string) {
  const supabase = createServiceClient();
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.sub;

  const { error } = await supabase
    .from("team_invites").update({ status: "denied" }).eq("id", inviteId);
  if (error) throw error;

  revalidatePath("/dashboard/teams");
  return { success: true };
}

export async function requestToJoinTeam(teamId: string) {
  const supabase = createServiceClient();
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.sub;

  const { data: profile } = await supabase
    .from("profiles").select("id").eq("auth0_user_id", userId).single();
  if (!profile) throw new Error("Profile not found");

  const { error } = await supabase
    .from("team_invites").insert({ team_id: teamId, profile_id: profile.id, status: "pending" });
  if (error) throw error;

  revalidatePath("/teams");
  return { success: true };
}
