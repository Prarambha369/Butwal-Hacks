"use server";

import { logger } from "@/lib/logger";
import { createServiceClient } from "@/utils/supabase";
import { resolveProfileId } from "@/lib/profile-resolver";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export interface ChatMessage {
  id: string;
  team_id: string;
  profile_id: string;
  message: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    slug_id: string | null;
    auth0_user_id?: string | null;
  };
}

const SendMessageSchema = z.object({
  teamId: z.string().uuid(),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long (max 2000 chars)"),
});

/**
 * Send a chat message to a team.
 * Validates the sender is a member of the team.
 */
export async function sendMessage(teamId: string, message: string) {
  const parsed = SendMessageSchema.safeParse({ teamId, message });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  // Verify sender is a member of this team
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("profile_id", profileId)
    .single();

  if (!membership) {
    throw new Error("You are not a member of this team");
  }

  // Embed profile data in the insert response to avoid a separate profile fetch (N+1 fix).
  const { data, error } = await supabase
    .from("team_messages")
    .insert({
      team_id: teamId,
      profile_id: profileId,
      message: parsed.data.message,
    })
    .select(`
      id,
      team_id,
      profile_id,
      message,
      created_at,
      profile:profiles!team_messages_profile_id_fkey (
        full_name,
        avatar_url,
        slug_id,
        auth0_user_id
      )
    `)
    .single();

  if (error) {
    logger.error("[team-chat] Failed to send message:", error);
    throw new Error("Failed to send message");
  }

  const msg = data as unknown as ChatMessage;

  // Broadcast via Realtime channel with embedded profile data.
  // Best-effort — if broadcast fails, other clients still receive the message
  // via postgres_changes + the existing profile cache.
  broadcastMessage(teamId, msg).catch(() => {});

  return msg;
}

/**
 * Fetch recent messages for a team (last 50).
 */
export async function getMessages(teamId: string): Promise<ChatMessage[]> {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  // Verify membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("profile_id", profileId)
    .single();

  if (!membership) {
    throw new Error("You are not a member of this team");
  }

  const { data, error } = await supabase
    .from("team_messages")
    .select(`
      id,
      team_id,
      profile_id,
      message,
      created_at,
      profile:profiles!team_messages_profile_id_fkey (
        full_name,
        avatar_url,
        slug_id,
        auth0_user_id
      )
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("[team-chat] Failed to fetch messages:", error);
    throw new Error("Failed to fetch messages");
  }

  // Reverse to show oldest first
  return (data as unknown as ChatMessage[]).reverse();
}

/**
 * Broadcast a message with embedded profile data via Supabase Realtime.
 * Runs asynchronously — callers should not await it.
 * Uses a direct Supabase client (not the service client) so the broadcast
 * is sent via the anon key connection that clients are subscribed to.
 */
async function broadcastMessage(teamId: string, message: ChatMessage): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  const bcClient = createClient(url, key, {
    realtime: { params: { log_level: "error" } },
  });

  const channel = bcClient.channel(`team-bc-${teamId}`);

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), 3000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          resolve();
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timer);
          reject(new Error(`Subscribe failed: ${status}`));
        }
      });
    });

    await channel.send({
      type: "broadcast",
      event: "new_message",
      payload: message,
    });
  } catch {
    logger.warn("[team-chat] Realtime broadcast failed — message delivered via postgres_changes + cache");
  } finally {
    bcClient.removeChannel(channel);
  }
}

/**
 * Get all teams the current user is a member of.
 */
export async function getUserTeams(): Promise<Array<{ id: string; name: string; memberCount: number }>> {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, team:teams!inner(id, name)")
    .eq("profile_id", profileId);

  if (!memberships?.length) return [];

  const teamIds = memberships.map((m) => m.team_id);
  const teamNames = new Map(
    memberships.map((m) => [m.team_id, (m.team as unknown as { name: string }).name])
  );

  // Get member counts
  const { data: counts } = await supabase
    .from("team_members")
    .select("team_id")
    .in("team_id", teamIds);

  const countMap = new Map<string, number>();
  for (const c of counts ?? []) {
    countMap.set(c.team_id, (countMap.get(c.team_id) ?? 0) + 1);
  }

  return teamIds.map((id) => ({
    id,
    name: teamNames.get(id) ?? "Unnamed Team",
    memberCount: countMap.get(id) ?? 0,
  }));
}
