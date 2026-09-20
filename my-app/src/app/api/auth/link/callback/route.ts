import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/utils/supabase";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";
import {
  exchangeCodeForTokens,
  linkIdentity,
  getProviderDisplayName,
} from "@/lib/auth0-management";
import type { LinkedAccount } from "@/lib/auth0-management";

const LINK_STATE_COOKIE = "bh_link_state";

/**
 * GET /api/auth/link/callback
 *
 * Handles the Auth0 OAuth callback after a user authenticates with a
 * secondary provider (GitHub, LinkedIn, etc.). Exchanges the auth code
 * for tokens, links the identities via Auth0 Management API, and
 * syncs the linked accounts to Supabase.
 *
 * Query params: code, state
 * Redirects to: /dashboard/hacker/profile?linked=success:PROVIDER
 *               or /dashboard/hacker/profile?linked=error:MESSAGE
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
    const redirectUrl = new URL("/dashboard/hacker/profile", process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    redirectUrl.searchParams.set("linked", `error:${encodeURIComponent(errorDescription || "Authentication was cancelled or failed")}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !returnedState) {
    logger.warn("[auth/link/callback] Missing code or state");
    const redirectUrl = new URL("/dashboard/hacker/profile", process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    redirectUrl.searchParams.set("linked", "error:Missing+authorization+parameters");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Verify state from cookie
    const cookieStore = await cookies();
    const storedState = cookieStore.get(LINK_STATE_COOKIE)?.value;

    if (!storedState) {
      logger.warn("[auth/link/callback] No stored state cookie - possible CSRF or expired link");
      const redirectUrl = new URL("/dashboard/hacker/profile", process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
      redirectUrl.searchParams.set("linked", "error:Link+request+expired.+Please+try+again");
      return NextResponse.redirect(redirectUrl);
    }

    // Parse state: nonce:primaryUserId:provider
    const stateParts = storedState.split(":");
    if (stateParts.length < 3) {
      logger.warn("[auth/link/callback] Malformed state cookie");
      const redirectUrl = new URL("/dashboard/hacker/profile", process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
      redirectUrl.searchParams.set("linked", "error:Invalid+link+state.+Please+try+again");
      return NextResponse.redirect(redirectUrl);
    }

    const primaryUserId = stateParts[1];
    const provider = stateParts.slice(2).join(":"); // provider might contain colons

    // Verify the returned state matches (nonce comparison)
    if (returnedState !== storedState) {
      logger.warn("[auth/link/callback] State mismatch - possible CSRF");
      const redirectUrl = new URL("/dashboard/hacker/profile", process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
      redirectUrl.searchParams.set("linked", "error:Security+check+failed.+Please+try+again");
      return NextResponse.redirect(redirectUrl);
    }

    // Clean up the state cookie
    cookieStore.delete(LINK_STATE_COOKIE);

    // Exchange the authorization code for tokens
    const baseUrl = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/auth/link/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Decode the ID token to get secondary user info (just extract the payload)
    const idTokenPayload = decodeJwtPayload(tokens.id_token);
    const secondaryUserId = idTokenPayload["sub"] as string | undefined;

    if (!secondaryUserId) {
      throw new Error("Could not extract user ID from secondary identity token");
    }

    // Link the identities via Auth0 Management API
    await linkIdentity(primaryUserId, tokens.id_token);

    // Sync linked accounts to Supabase profile
    const supabase = createServiceClient();

    // Get current linked accounts AND existing socials
    const { data: profile } = await supabase
      .from("profiles")
      .select("linked_accounts, socials")
      .eq("auth0_user_id", primaryUserId)
      .single();

    const existingLinked: LinkedAccount[] = (profile?.linked_accounts as LinkedAccount[]) ?? [];
    const existingSocials = (profile?.socials as Record<string, string> | null) ?? {};

    // Extract nickname from the ID token
    const nickname = (idTokenPayload["nickname"] as string | null) ?? null;

    // Add new linked account
    const newLinkedAccount: LinkedAccount = {
      provider,
      connection: provider,
      user_id: secondaryUserId.replace(`${provider}|`, ""),
      email: (idTokenPayload["email"] as string | null) ?? null,
      name: (idTokenPayload["name"] as string | null) ?? nickname ?? null,
      linked_at: new Date().toISOString(),
    };

    // Avoid duplicates
    const updatedLinked = existingLinked.filter(
      (l) => !(l.provider === provider && l.user_id === newLinkedAccount.user_id)
    );
    updatedLinked.push(newLinkedAccount);

    // Auto-populate social URL from linked identity (only if field is empty)
    const profileUpdate: Record<string, unknown> = {
      linked_accounts: JSON.parse(JSON.stringify(updatedLinked)),
    };

    if (provider === "github" && nickname && !existingSocials["github"]) {
      const githubUrl = `https://github.com/${nickname}`;
      existingSocials["github"] = githubUrl;
      profileUpdate["socials"] = existingSocials;
      logger.info("[auth/link/callback] Auto-populated GitHub URL", {
        url: githubUrl,
      });
    }

    if (provider === "linkedin" && nickname && !existingSocials["linkedin"]) {
      // LinkedIn's ID token provides a numeric ID, not the vanity URL name.
      // Skip auto-population if the nickname is purely numeric (dead link).
      if (!/^\d+$/.test(nickname)) {
        const linkedinUrl = `https://linkedin.com/in/${nickname}`;
        existingSocials["linkedin"] = linkedinUrl;
        profileUpdate["socials"] = existingSocials;
        logger.info("[auth/link/callback] Auto-populated LinkedIn URL", {
          url: linkedinUrl,
        });
      } else {
        logger.info("[auth/link/callback] Skipped LinkedIn auto-population (numeric ID)", {
          nickname,
        });
      }
    }

    await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("auth0_user_id", primaryUserId);

    // Revalidate the profile page so the new URL shows immediately
    revalidatePath("/dashboard/hacker/profile");

    const displayName = getProviderDisplayName(provider);
    logger.info("[auth/link/callback] Account linked successfully", {
      primaryUserId,
      provider,
      auto_populated_url: !!nickname,
    });

    // Redirect back to profile with success
    const redirectUrl = new URL("/dashboard/hacker/profile", process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    redirectUrl.searchParams.set("linked", `success:${displayName}`);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to link account";
    logger.error("[auth/link/callback] Error:", err);

    const redirectUrl = new URL("/dashboard/hacker/profile", process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    redirectUrl.searchParams.set("linked", `error:${encodeURIComponent(message)}`);
    return NextResponse.redirect(redirectUrl);
  }
}, "sensitive")

/**
 * Decode the payload of a JWT without verifying the signature.
 * Used to extract the secondary user's info from the ID token.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload);
  } catch {
    throw new Error("Failed to decode JWT payload");
  }
}
