import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";
import { logger } from "@/lib/logger";
import { unlinkIdentity, getProviderDisplayName } from "@/lib/auth0-management";
import { withRateLimit } from "@/lib/rate-limiter";
import type { LinkedAccount } from "@/lib/auth0-management";

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

    const { provider, user_id } = await request.json();

    if (!provider || typeof provider !== "string") {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }
    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Prevent unlinking the last identity (user would lose access)
    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("linked_accounts")
      .eq("auth0_user_id", userId)
      .single();

    const linkedAccounts: LinkedAccount[] = (profile?.linked_accounts as LinkedAccount[]) ?? [];

    // Don't allow unlinking if this is the only identity
    // (primary identity is always present, so check total via Management API is expensive;
    //  we check that there's at least one linked account remaining after removal)
    if (linkedAccounts.length <= 1) {
      return NextResponse.json(
        { error: "Cannot unlink your last connected account. You need at least one sign-in method." },
        { status: 400 }
      );
    }

    // Unlink from Auth0 via Management API
    await unlinkIdentity(userId, provider, user_id);

    // Remove from Supabase cache
    const updatedLinked = linkedAccounts.filter(
      (l) => !(l.provider === provider && l.user_id === user_id)
    );

    await supabase
      .from("profiles")
      .update({ linked_accounts: JSON.parse(JSON.stringify(updatedLinked)) })
      .eq("auth0_user_id", userId);

    const displayName = getProviderDisplayName(provider);
    logger.info("[auth/link/unlink] Account unlinked", {
      userId,
      provider,
    });

    return NextResponse.json({
      success: true,
      message: `${displayName} disconnected successfully.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to unlink account";
    logger.error("[auth/link/unlink] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}, "sensitive");
