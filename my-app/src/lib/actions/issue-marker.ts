"use server";

import { logger } from "@/lib/logger";
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { sanitizeString } from "@/lib/validation";
import { signTrustMarker } from "@/lib/crypto-sign";
import { resolveProfileId } from "@/lib/profile-resolver";
import { bustCache } from "@/lib/cache";
import { notifyMarkerIssued } from "@/lib/discord";
import { auth0 } from "@/lib/auth0";
import { accessSubjectFor, isMaintainer } from "@/lib/dashboard-access";

/**
 * Roles allowed to attest a credential.
 *
 * The HTTP route `/api/v1/issue-marker` already enforced this. Server actions
 * are equally reachable endpoints -- every export of a `"use server"` module
 * is callable from the browser -- so an action that skips the check is a hole
 * around the route that has it, not a second way to do the same thing.
 */
const ISSUER_ROLES = new Set(["organizer", "maintainer"]);

/**
 * Resolve the caller's issuer identity, or refuse.
 *
 * Throws rather than returning a union so that no code path can accidentally
 * proceed on an unresolved identity: an unhandled throw inside the action
 * becomes `success: false`, and no insert happens.
 */
async function requireIssuer(): Promise<string> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    throw new Error("Not authenticated.");
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  const role = profile?.role;

  // The maintainer role is never sufficient on its own. A profile carrying
  // role='maintainer' on a personal or unverified address must fail the same
  // predicate the maintainer layouts use, so the role is not simply re-used
  // as a fallback -- otherwise it silently re-grants exactly the authority the
  // staff-address rule exists to withhold.
  const authorized =
    role === "maintainer"
      ? isMaintainer(accessSubjectFor(session.user, profile))
      : typeof role === "string" && ISSUER_ROLES.has(role);

  if (!authorized) {
    logger.warn("[issue-marker] Refused issuance to a non-issuer role");
    throw new Error("Only organizers and maintainers can issue trust markers.");
  }

  return resolveProfileId();
}

export async function issueTrustMarker(input: {
  email: string;
  title: string;
  description: string;
  type: string;
}) {
  try {
    const supabase = createServiceClient();
    // Authorization first: resolveProfileId() has a side effect (it creates a
    // profile row for a caller that has none), so it must not run for someone
    // who is going to be refused.
    const issuerId = await requireIssuer();
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
      issuerName: issuerProfile.data?.full_name || "A Mysterious Hacker",
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
