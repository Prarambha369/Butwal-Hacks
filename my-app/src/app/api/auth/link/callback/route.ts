import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/utils/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import {
  exchangeCodeForTokens,
  linkIdentity,
  getProviderDisplayName,
  identitySubject,
  subjectToUserId,
} from "@/lib/auth0-management";
import type { LinkedAccount } from "@/lib/auth0-providers";
import {
  LINK_STATE_COOKIE,
  LINK_RETURN_PATH,
  appBaseUrl,
  linkResultRedirect,
  linkStateCookieDeleteOptions,
  parseLinkState,
} from "@/lib/auth0-link-state";

/**
 * GET /api/auth/link/callback
 *
 * Handles the Auth0 OAuth callback after a user authenticates with a
 * secondary provider (GitHub, LinkedIn, etc.). Exchanges the auth code
 * for tokens, links the identities via Auth0 Management API, and
 * syncs the linked accounts to Supabase.
 *
 * Query params: code, state
 * Redirects to: LINK_RETURN_PATH?linked=success:PROVIDER
 *               or LINK_RETURN_PATH?linked=error:MESSAGE
 */
export const GET = withRateLimit(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle Auth0 error (user cancelled or auth failed)
  if (errorParam) {
    logger.warn("[auth/link/callback] Auth error", {
      error: errorParam,
      description: errorDescription,
    });
    return NextResponse.redirect(
      linkResultRedirect("error", errorDescription || "Authentication was cancelled or failed.")
    );
  }

  if (!code || !returnedState) {
    logger.warn("[auth/link/callback] Missing code or state");
    return NextResponse.redirect(
      linkResultRedirect("error", "Missing authorization parameters. Please try again.")
    );
  }

  try {
    // Verify state from cookie
    const cookieStore = await cookies();
    const storedState = cookieStore.get(LINK_STATE_COOKIE)?.value;

    if (!storedState) {
      logger.warn("[auth/link/callback] No stored state cookie - possible CSRF or expired link");
      return NextResponse.redirect(
        linkResultRedirect("error", "Link request expired. Please try again.")
      );
    }

    const state = parseLinkState(storedState);
    if (!state) {
      logger.warn("[auth/link/callback] Malformed state cookie");
      return NextResponse.redirect(
        linkResultRedirect("error", "Invalid link state. Please try again.")
      );
    }

    // Verify the returned state matches exactly (CSRF check)
    if (returnedState !== storedState) {
      logger.warn("[auth/link/callback] State mismatch - possible CSRF");
      return NextResponse.redirect(
        linkResultRedirect("error", "Security check failed. Please try again.")
      );
    }

    const { primaryUserId, provider } = state;

    // Clear the state cookie using the SAME path it was set with. Deleting
    // without the path silently no-ops on a path-scoped cookie, which left the
    // state replayable for the rest of its 10-minute window.
    cookieStore.delete(linkStateCookieDeleteOptions());

    // Exchange the authorization code for tokens
    const redirectUri = `${appBaseUrl()}/api/auth/link/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Decode the ID token to get secondary user info.
    // Signature is not verified here on purpose: the token was just received
    // over TLS directly from Auth0's token endpoint, and we only read claims
    // that Auth0 itself then re-validates when we present it to /identities.
    const idTokenPayload = decodeJwtPayload(tokens.id_token);
    const secondarySub = idTokenPayload["sub"];

    if (typeof secondarySub !== "string" || !secondarySub) {
      throw new Error("Could not read the user ID from the provider's token.");
    }

    // Auth0 can link by email on its own when the tenant has automatic account
    // linking enabled for the connection. In that case the token belongs to
    // the primary user already and POSTing it to /identities would fail with
    // "already linked". Detect that and report success instead of an error.
    if (secondarySub === primaryUserId) {
      logger.info("[auth/link/callback] Identity already attached to this user", {
        primaryUserId,
        provider,
      });
      return NextResponse.redirect(
        linkResultRedirect("success", getProviderDisplayName(provider))
      );
    }

    // Link the identities via Auth0 Management API
    await linkIdentity(primaryUserId, tokens.id_token);

    // Sync linked accounts to Supabase profile
    const supabase = createServiceClient();

    const { data: profile, error: profileReadError } = await supabase
      .from("profiles")
      .select("linked_accounts, socials")
      .eq("auth0_user_id", primaryUserId)
      .single();

    if (profileReadError) {
      const { diagnostic, userMessage } = describeSupabaseError(profileReadError);
      logger.error(`[auth/link/callback] Profile read failed: ${diagnostic}`);
      return NextResponse.redirect(linkResultRedirect("error", userMessage));
    }

    const existingLinked: LinkedAccount[] =
      (profile?.linked_accounts as LinkedAccount[]) ?? [];
    const existingSocials: Record<string, string> =
      (profile?.socials as Record<string, string> | null) ?? {};

    const nickname = (idTokenPayload["nickname"] as string | null) ?? null;

    const newLinkedAccount: LinkedAccount = {
      provider,
      connection: provider,
      user_id: subjectToUserId(secondarySub),
      email: (idTokenPayload["email"] as string | null) ?? null,
      name: (idTokenPayload["name"] as string | null) ?? nickname ?? null,
      linked_at: new Date().toISOString(),
    };

    // Replace any existing entry for this provider+user so re-linking is idempotent
    const updatedLinked = existingLinked.filter(
      (l) => !(l.provider === provider && l.user_id === newLinkedAccount.user_id)
    );
    updatedLinked.push(newLinkedAccount);

    const profileUpdate: Record<string, unknown> = {
      linked_accounts: JSON.parse(JSON.stringify(updatedLinked)),
    };

    // Auto-populate social URL from the linked identity (only if field is empty)
    if (provider === "github" && nickname && !existingSocials["github"]) {
      existingSocials["github"] = `https://github.com/${nickname}`;
      profileUpdate["socials"] = existingSocials;
    }

    if (provider === "linkedin" && nickname && !existingSocials["linkedin"]) {
      // LinkedIn's ID token provides a numeric ID, not the vanity URL name.
      // Skip auto-population if the nickname is purely numeric (dead link).
      if (!/^\d+$/.test(nickname)) {
        existingSocials["linkedin"] = `https://linkedin.com/in/${nickname}`;
        profileUpdate["socials"] = existingSocials;
      } else {
        logger.info("[auth/link/callback] Skipped LinkedIn auto-population (numeric ID)");
      }
    }

    // This update's error was previously discarded, so a failed cache sync
    // looked like a successful link and the row silently drifted.
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("auth0_user_id", primaryUserId);

    if (profileUpdateError) {
      const { diagnostic } = describeSupabaseError(profileUpdateError);
      logger.error(`[auth/link/callback] Profile cache sync failed: ${diagnostic}`);
      // The Auth0 link itself succeeded, so tell the user that specifically.
      return NextResponse.redirect(
        linkResultRedirect(
          "error",
          "Your account was connected, but saving it to your profile failed. Please contact a maintainer."
        )
      );
    }

    revalidatePath(LINK_RETURN_PATH);

    logger.info("[auth/link/callback] Account linked successfully", {
      primaryUserId,
      provider,
      autoPopulatedUrl: Object.keys(profileUpdate).includes("socials"),
    });

    return NextResponse.redirect(
      linkResultRedirect("success", getProviderDisplayName(provider))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to link account";
    logger.error("[auth/link/callback] Error:", err);
    return NextResponse.redirect(linkResultRedirect("error", message));
  }
}, "sensitive");

/**
 * Decode the payload of a JWT without verifying the signature.
 * Used to read the secondary user's claims from the ID token.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format.");
  }
  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    throw new Error("Failed to read the provider's token.");
  }
}

export { identitySubject };
