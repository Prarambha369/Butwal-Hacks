"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { sanitizeString } from "@/lib/validation";
import { captureServerEvent } from "@/lib/analytics/server";

interface SendMessageInput {
  teamId: string;
  message: string;
}

export async function sendTeamMessage(input: SendMessageInput) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Not authenticated");
    const userId = session.user.sub;

    const supabase = createServiceClient();

    // Resolve profile UUID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("auth0_user_id", userId)
      .single();
    if (!profile) throw new Error("Profile not found");

    // Verify user is a member of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", input.teamId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!membership) throw new Error("Not a member of this team");

    const cleanMessage = sanitizeString(input.message, 2000);
    if (cleanMessage.length < 1) throw new Error("Message is required");

    const { error } = await supabase
      .from("team_messages")
      .insert({
        team_id: input.teamId,
        profile_id: profile.id,
        message: cleanMessage,
      });

    if (error) throw error;

    await captureServerEvent("team_message_sent", userId, {
      team_id: input.teamId,
    });

    revalidatePath(`/teams/${input.teamId}`);
    return { success: true };
  } catch (error) {
    logger.error("[team-chat] Error sending message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}

export async function getTeamMessages(teamId: string, limit = 50) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return [];
    const userId = session.user.sub;

    const supabase = createServiceClient();

    // Verify membership
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single();
    if (!profile) return [];

    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!membership) return [];

    const { data } = await supabase
      .from("team_messages")
      .select(`
        id,
        message,
        created_at,
        profile:profiles!inner(id, full_name, avatar_url)
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data || []).reverse(); // chronological order
  } catch {
    return [];
  }
}
