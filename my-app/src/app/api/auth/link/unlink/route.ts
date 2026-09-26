import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import { logger } from "@/lib/logger";
import {
  unlinkIdentity,
  getProviderDisplayName,
  getUserIdentities,
  Auth0UserError,
  identitySubject,
} from "@/lib/auth0-management";
import { withRateLimit } from "@/lib/rate-limiter";
import type { LinkedAccount } from "@/lib/auth0-providers";

/**
 * POST /api/auth/link/unlink
 *
 * Unlinks a secondary identity from the user's Auth0 account.
 *
 * Request body: { provider: string, user_id: string }
 * Response: { success: true, message: string }
 */
export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.sub;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { provider, user_id: identityUserId } = (body ?? {}) as {
      provider?: unknown;
      user_id?: unknown;
    };

    if (typeof provider !== "string" || !provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }
    if (typeof identityUserId !== "string" || !identityUserId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Never let a caller unlink the identity they actually sign in with. The
    // cache below does not contain the primary identity, so without this check
    // a crafted request could strip a user's only real login method.
    if (identitySubject(provider, identityUserId) === userId) {
      logger.warn("[auth/link/unlink] Refused unlink of the primary identity", {
        userId,
        provider,
      });
      return NextResponse.json(
        { error: "You cannot disconnect the account you sign in with." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("linked_accounts")
      .eq("auth0_user_id", userId)
      .maybeSingle();

    const linkedAccounts: LinkedAccount[] =
      (profile?.linked_accounts as LinkedAccount[]) ?? [];

    // ── Last-identity guard ────────────────────────────────────────
    // The previous guard compared `linkedAccounts.length <= 1` against the
    // Supabase cache. That was wrong in both directions:
    //   - the cache excludes the primary identity, so having primary + 1
    //     linked was blocked even though unlinking left a working login;
    //   - an empty or stale cache blocked every unlink with a message that
    //     claimed the user had no other sign-in method.
    // Prefer the authoritative count from Auth0; fall back to the cache plus
    // one for the primary identity when the Management API is unavailable.
    let totalIdentities: number | null = null;
    try {
      const identities = await getUserIdentities(userId);
      totalIdentities = identities.length;
    } catch (err) {
      logger.warn("[auth/link/unlink] Identity count unavailable, using cache", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const effectiveCount = totalIdentities ?? linkedAccounts.length + 1;

    if (effectiveCount <= 1) {
      return NextResponse.json(
        { error: "Cannot disconnect your last connected account. You need at least one sign-in method." },
        { status: 400 }
      );
    }

    await unlinkIdentity(userId, provider, identityUserId);

    // Remove from the Supabase cache
    const updatedLinked = linkedAccounts.filter(
      (l) => !(l.provider === provider && l.user_id === identityUserId)
    );

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ linked_accounts: JSON.parse(JSON.stringify(updatedLinked)) })
      .eq("auth0_user_id", userId);

    if (updateError) {
      const { diagnostic } = describeSupabaseError(updateError);
      logger.error(`[auth/link/unlink] Profile cache update failed: ${diagnostic}`);
      return NextResponse.json(
        {
          error:
            "The account was disconnected, but your profile could not be updated. Please contact a maintainer.",
        },
        { status: 500 }
      );
    }

    const displayName = getProviderDisplayName(provider);
    logger.info("[auth/link/unlink] Account unlinked", {
      userId,
      provider,
      remainingIdentities: effectiveCount - 1,
    });

    return NextResponse.json({
      success: true,
      message: `${displayName} disconnected successfully.`,
    });
  } catch (err) {
    // Only surface messages that were explicitly marked as user-facing.
    const error =
      err instanceof Auth0UserError
        ? err.message
        : "Failed to disconnect the account. Please try again.";
    logger.error("[auth/link/unlink] Error:", err);
    return NextResponse.json({ error }, { status: 500 });
  }
}, "sensitive");
