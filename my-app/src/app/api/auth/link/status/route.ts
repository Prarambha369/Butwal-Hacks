import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";
import { logger } from "@/lib/logger";
import { getLinkedIdentities } from "@/lib/auth0-management";
import type { LinkedAccount } from "@/lib/auth0-management";

/**
 * GET /api/auth/link/status
 *
 * Returns the current user's linked Auth0 identities.
 * Reads from both the Auth0 Management API (live) and Supabase (cached).
 *
 * Response: { linkedAccounts: LinkedAccount[] }
 */
export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.sub;

    // Fetch linked identities from Auth0 Management API
    let auth0Identities: Awaited<ReturnType<typeof getLinkedIdentities>> = [];
    try {
      auth0Identities = await getLinkedIdentities(userId);
    } catch (mgmtErr) {
      // Management API may not be configured; fall back to Supabase cache
      logger.warn("[auth/link/status] Management API unavailable, falling back to cache", {
        error: mgmtErr instanceof Error ? mgmtErr.message : String(mgmtErr),
      });
    }

    // Also get cached linked accounts from Supabase (faster, available offline)
    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("linked_accounts")
      .eq("auth0_user_id", userId)
      .single();

    const cachedLinkedAccounts: LinkedAccount[] = (profile?.linked_accounts as LinkedAccount[]) ?? [];

    // Merge: prefer Auth0 API data (it's authoritative), fallback to cache
    let linkedAccounts: LinkedAccount[];

    if (auth0Identities.length > 0) {
      // Convert Auth0 identities to LinkedAccount format
      linkedAccounts = auth0Identities.map((id) => {
        const cached = cachedLinkedAccounts.find(
          (c) => c.provider === id.provider && c.user_id === id.user_id
        );
        return {
          provider: id.provider,
          connection: id.connection,
          user_id: id.user_id,
          email: id.profileData?.email ?? cached?.email ?? null,
          name: id.profileData?.name ?? cached?.name ?? null,
          linked_at: cached?.linked_at ?? new Date().toISOString(),
        };
      });

      // Update Supabase cache in the background
      supabase
        .from("profiles")
        .update({ linked_accounts: JSON.parse(JSON.stringify(linkedAccounts)) })
        .eq("auth0_user_id", userId)
        .then(({ error }) => {
          if (error) {
            logger.warn("[auth/link/status] Failed to sync linked accounts cache", {
              error: error.message,
            });
          }
        });
    } else {
      linkedAccounts = cachedLinkedAccounts;
    }

    return NextResponse.json({ linkedAccounts }, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    logger.error("[auth/link/status] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
