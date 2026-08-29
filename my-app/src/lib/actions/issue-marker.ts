"use server";

import { logger } from "@/lib/logger";
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { sanitizeString } from "@/lib/validation";
import { signTrustMarker } from "@/lib/crypto-sign";
import { resolveProfileId } from "@/lib/profile-resolver";
import { bustCache } from "@/lib/cache";
import { notifyMarkerIssued } from "@/lib/discord";

export async function issueTrustMarker(input: {
  email: string;
  title: string;
  description: string;
  type: string;
}) {
  try {
    const supabase = createServiceClient();
    const issuerId = await resolveProfileId();
    const title = sanitizeString(input.title, 200);
    const description = sanitizeString(input.description, 2000);

    const { data: marker, error } = await supabase
      .from("trust_markers")
      .insert({
        issuer_id: issuerId,
        claimant_email: input.email.trim().toLowerCase(),
        title,
        description,
        type: input.type,
      })
      .select("id, created_at")
      .single();

    if (error || !marker) throw error || new Error("Failed to create marker");

    // ── Sign with Ed25519 ──────────────────────────────
    const signature = signTrustMarker({
      id: marker.id,
      profile_id: null,
      issuer_id: issuerId,
      title,
      type: input.type,
      created_at: marker.created_at,
    })

    if (signature) {
      await supabase
        .from("trust_markers")
        .update({ crypto_signature: signature })
        .eq("id", marker.id)
    }

    // ── Discord notification (community events) ──
    const issuerProfile = await supabase
      .from("profiles")
      .select("full_name, bh_id")
      .eq("id", issuerId)
      .single();

    notifyMarkerIssued({
      title,
      type: input.type,
      recipientEmail: input.email,
      issuerName: issuerProfile.data?.full_name || "Unknown",
      issuerBhId: issuerProfile.data?.bh_id || "",
      markerId: marker.id,
    });

    revalidatePath("/dashboard/organizer");
    return { success: true, message: "Trust marker issued successfully!", signed: !!signature };
  } catch (error) {
    logger.error("Error issuing trust marker:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to issue marker",
    };
  }
}

export async function claimTrustMarker(token: string) {
  try {
    const supabase = createServiceClient();
    const profileId = await resolveProfileId();

    const { data: claimRecord } = await supabase
      .from("claim_tokens")
      .select("*, trust_markers!inner(id)")
      .eq("token", token)
      .maybeSingle();

    if (!claimRecord) throw new Error("Invalid or expired claim token");

    const { error } = await supabase
      .from("trust_markers")
      .update({ is_claimed: true, profile_id: profileId })
      .eq("id", claimRecord.trust_markers.id);

    if (error) throw error;

    // Bust Redis cache for the claiming user's profile
  const { data: p } = await supabase.from("profiles").select("bh_id").eq("id", profileId).single();
  if (p?.bh_id) await bustCache(`profile:bh_id:${p.bh_id}`);

  revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    logger.error("Error claiming trust marker:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to claim marker",
    };
  }
}
