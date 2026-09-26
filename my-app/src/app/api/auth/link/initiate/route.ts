import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth0 } from "@/lib/auth0";
import { buildLinkAuthUrl } from "@/lib/auth0-management";
import { LINKABLE_PROVIDERS, isLinkableProvider } from "@/lib/auth0-providers";
import {
  LINK_STATE_COOKIE,
  buildLinkState,
  linkStateCookieOptions,
} from "@/lib/auth0-link-state";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import crypto from "crypto";

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

    // request.json() throws on a malformed body; treat that as a bad request
    // rather than a 500.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const provider = (body as { provider?: unknown })?.provider;
    if (!isLinkableProvider(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${LINKABLE_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate a state token to prevent CSRF
    // Format: random_nonce:primaryUserId:provider
    const nonce = crypto.randomBytes(16).toString("hex");
    const state = buildLinkState(nonce, userId, provider);

    // Store state in a signed cookie so the callback can verify it.
    // Path/attributes come from the shared helper so the callback can delete it.
    const cookieStore = await cookies();
    cookieStore.set(LINK_STATE_COOKIE, state, linkStateCookieOptions());

    // Build the redirect URL (APP_BASE_URL is canonical; AUTH0_BASE_URL kept as legacy fallback)
    const baseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/auth/link/callback`;
    const authUrl = buildLinkAuthUrl(provider, state, redirectUri);

    logger.info("[auth/link/initiate] Linking initiated", {
      provider,
      userId,
    });

    return NextResponse.json({ url: authUrl });
  } catch (err) {
    logger.error("[auth/link/initiate] Error:", err);
    return NextResponse.json({ error: "Failed to initiate account linking" }, { status: 500 });
  }
}, "sensitive");
