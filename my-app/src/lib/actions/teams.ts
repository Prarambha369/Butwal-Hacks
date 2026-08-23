"use server";

import { createServiceClient } from "@/utils/supabase";
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

// ── Organizer Team Formation V2 ────────────────────────────────────
// Allows organizers to manually create teams and assign members for physical events.

export interface TeamFormationMember {
  profile_id: string
  full_name: string
  bh_id: string
  avatar_url: string | null
}

export interface EventTeam {
  id: string
  name: string
  member_count: number
  members: TeamFormationMember[]
}

/**
 * Fetch all registered attendees for an event with their profile data.
 * Only returns attendees who have not yet been assigned to a team for this event.
 */
export async function getUnassignedAttendees(eventId: string): Promise<TeamFormationMember[]> {
  const supabase = createServiceClient();

  // Get all registered attendees for the event
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("profile_id")
    .eq("event_id", eventId);

  if (!registrations || registrations.length === 0) return [];

  const allAttendeeIds = registrations.map((r: { profile_id: string }) => r.profile_id);

  // Get profile data for attendees
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, bh_id, avatar_url")
    .in("id", allAttendeeIds);

  // Get IDs of attendees already on a team for this event
  const { data: existingTeamMembers } = await supabase
    .from("team_members")
    .select("profile_id")
    .in("profile_id", allAttendeeIds)
    .in("team_id", (
      await supabase.from("teams").select("id").eq("event_id", eventId)
    ).data?.map((t: { id: string }) => t.id) ?? []);

  const assignedIds = new Set(existingTeamMembers?.map((m: { profile_id: string }) => m.profile_id) ?? []);

  return ((profiles ?? []) as { id: string; full_name: string | null; bh_id: string | null; avatar_url: string | null }[])
    .filter((p) => !assignedIds.has(p.id))
    .map((p) => ({
      profile_id: p.id,
      full_name: p.full_name ?? "Unnamed",
      bh_id: p.bh_id ?? "",
      avatar_url: p.avatar_url,
    }));
}

/**
 * Fetch all teams for an event with their members.
 */
export async function getEventTeams(eventId: string): Promise<EventTeam[]> {
  const supabase = createServiceClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (!teams || teams.length === 0) return [];

  const teamIds = teams.map((t: { id: string }) => t.id);

  const { data: members } = await supabase
    .from("team_members")
    .select("team_id, profile_id")
    .in("team_id", teamIds);

  const profileIds = [...new Set((members ?? []).map((m: { profile_id: string }) => m.profile_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, bh_id, avatar_url")
    .in("id", profileIds);

  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null; bh_id: string | null; avatar_url: string | null }) => [p.id, p]));

  return (teams as { id: string; name: string }[]).map((team) => {
    const teamMemberRows = (members ?? []).filter((m: { team_id: string }) => m.team_id === team.id);
    const teamMembers: TeamFormationMember[] = teamMemberRows.map((m: { profile_id: string }) => {
      const p = profileMap.get(m.profile_id);
      return {
        profile_id: m.profile_id,
        full_name: p?.full_name ?? "Unnamed",
        bh_id: p?.bh_id ?? "",
        avatar_url: p?.avatar_url ?? null,
      };
    });

    return {
      id: team.id,
      name: team.name,
      member_count: teamMembers.length,
      members: teamMembers,
    };
  });
}

/**
 * Force-create a team for an event and optionally assign members.
 * Bypasses the normal invitation flow — organizer-only action.
 */
export async function forceCreateTeam(
  eventId: string,
  teamName: string,
  memberIds: string[],
): Promise<{ success: boolean; team_id?: string; error?: string }> {
  const supabase = createServiceClient();

  const trimmedName = teamName.trim();
  if (!trimmedName) return { success: false, error: "Team name is required." };

  // Create the team
  const { data: team, error: createError } = await supabase
    .from("teams")
    .insert({ name: trimmedName, event_id: eventId })
    .select("id")
    .single();

  if (createError || !team) {
    return { success: false, error: "Failed to create team." };
  }

  // Add members
  if (memberIds.length > 0) {
    const memberRows = memberIds.map((profileId) => ({
      team_id: team.id,
      profile_id: profileId,
      is_captain: false,
    }));

    const { error: memberError } = await supabase
      .from("team_members")
      .insert(memberRows);

    if (memberError) {
      // Clean up team if member insert fails
      await supabase.from("teams").delete().eq("id", team.id);
      return { success: false, error: "Failed to add members." };
    }
  }

  revalidatePath(`/dashboard/organizer/events/${eventId}/teams`);
  return { success: true, team_id: team.id };
}

/**
 * Force-add a member to an existing team.
 * Bypasses the normal invitation flow — organizer-only action.
 */
export async function forceAddTeamMember(
  teamId: string,
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Check if already a member
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("profile_id", profileId)
    .single();

  if (existing) {
    return { success: false, error: "Already a member of this team." };
  }

  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, profile_id: profileId, is_captain: false });

  if (error) {
    return { success: false, error: "Failed to add member." };
  }

  return { success: true };
}

/**
 * Remove a member from a team.
 */
export async function removeTeamMember(
  teamId: string,
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", profileId);

  if (error) {
    return { success: false, error: "Failed to remove member." };
  }

  return { success: true };
}

/**
 * Delete a team and all its members.
 */
export async function deleteTeam(
  teamId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Delete members first
  await supabase.from("team_members").delete().eq("team_id", teamId);
  // Delete the team
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    return { success: false, error: "Failed to delete team." };
  }

  return { success: true };
}
