"use server";

import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { createHash, randomBytes } from "crypto";
import { resolveProfileId } from "@/lib/profile-resolver";

// ponytail: SHA-256 key hashing. Keys are shown once at creation, then only
// the hash is stored. If key rotation becomes frequent, add a last_rotated_at
// column. For now, revoke + reissue is the rotation path.

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateApiKeyValue(): string {
  const prefix = "bh_";
  const entropy = randomBytes(32).toString("hex");
  return `${prefix}${entropy}`;
}

export async function generateApiKey(name: string) {
  try {
    const supabase = createServiceClient();
    const profileId = await resolveProfileId();
    const rawKey = generateApiKeyValue();
    const keyHash = hashKey(rawKey);

    const { error } = await supabase.from("api_keys").insert({
      profile_id: profileId,
      key_hash: keyHash,
      name: name.trim().slice(0, 100),
      is_active: true,
    });

    if (error) throw error;

    revalidatePath("/dashboard/organizer/api-keys");
    return { success: true, key: rawKey };
  } catch (error) {
    logger.error("Error generating API key:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate API key",
    };
  }
}

export async function revokeApiKey(keyId: string) {
  try {
    const supabase = createServiceClient();
    const profileId = await resolveProfileId();

    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyId)
      .eq("profile_id", profileId);

    if (error) throw error;

    revalidatePath("/dashboard/organizer/api-keys");
    return { success: true };
  } catch (error) {
    logger.error("Error revoking API key:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke API key",
    };
  }
}

/**
 * Verify an API key from an Authorization header.
 * Returns the profile_id if valid, null otherwise.
 */