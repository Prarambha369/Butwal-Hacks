import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth0 } from "@/lib/auth0";
import { buildLinkAuthUrl } from "@/lib/auth0-management";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import crypto from "crypto";

const LINK_STATE_COOKIE = "bh_link_state";
const LINK_STATE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/auth/link/initiate
 *
 * Initiates the Auth0 account linking flow for a given provider.
 * Returns an authorization URL to redirect the user to.
 *
 * Request body: { provider: "github" | "linkedin" | "google-oauth2" }
 * Response: { url: string }
 */
export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.sub;

    const { provider } = await request.json();

    // Validate provider
    const allowedProviders = ["github", "linkedin", "google-oauth2"];
    if (!provider || typeof provider !== "string" || !allowedProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${allowedProviders.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate a state token to prevent CSRF
    // Format: random_nonce:primaryUserId:provider
    const nonce = crypto.randomBytes(16).toString("hex");
    const state = `${nonce}:${userId}:${provider}`;

    // Store state in a signed cookie so the callback can verify it
    const cookieStore = await cookies();
    cookieStore.set(LINK_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/link",
      maxAge: LINK_STATE_TTL / 1000, // 10 minutes
    });

    // Build the redirect URL
    const baseUrl = process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/auth/link/callback`;
    const authUrl = buildLinkAuthUrl(provider, state, redirectUri);

    logger.info("[auth/link/initiate] Linking initiated", {
      provider,
      userId: session.user.sub,
    });

    return NextResponse.json({ url: authUrl });
  } catch (err) {
    logger.error("[auth/link/initiate] Error:", err);
    return NextResponse.json({ error: "Failed to initiate account linking" }, { status: 500 });
  }
}, "sensitive");
