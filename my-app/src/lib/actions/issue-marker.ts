"use server";

import { logger } from "@/lib/logger";
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { sanitizeString } from "@/lib/validation";

export async function issueTrustMarker(input: {
  email: string;
  title: string;
  description: string;
  type: string;
}) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Unauthorized");
    const userId = session.user.sub;

    const supabase = createServiceClient();
    const title = sanitizeString(input.title, 200);
    const description = sanitizeString(input.description, 2000);

    // ponytail: Resolve profile UUID for issuer_id FK
    const { data: issuer } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();
    if (!issuer) throw new Error("Profile not found");

    const { error } = await supabase.from("trust_markers").insert({
      issuer_id: issuer.id,
      claimant_email: input.email.trim().toLowerCase(),
      title,
      description,
      type: input.type,
    });

    if (error) throw error;

    revalidatePath("/dashboard/organizer");
    return { success: true, message: "Trust marker issued successfully!" };
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
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Unauthorized");
    const userId = session.user.sub;

    const supabase = createServiceClient();

    const { data: claimRecord } = await supabase
      .from("claim_tokens")
      .select("*, trust_markers!inner(id)")
      .eq("token", token)
      .maybeSingle();

    if (!claimRecord) throw new Error("Invalid or expired claim token");

    // Look up the profile UUID for this user — profile_id FK references profiles.id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single()

    if (!profile) throw new Error("Profile not found")

    const { error } = await supabase
      .from("trust_markers")
      .update({ is_claimed: true, profile_id: profile.id })
      .eq("id", claimRecord.trust_markers.id);

    if (error) throw error;

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
