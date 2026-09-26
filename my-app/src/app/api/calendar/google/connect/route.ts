import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { buildConsentUrl, GoogleNotConfiguredError } from "@/lib/google-calendar/config";
import { setOAuthState } from "@/lib/google-calendar/oauth-state";

/**
 * GET /api/calendar/google/connect
 *
 * Starts the Google consent flow. Returns the consent URL for the client to
 * navigate to, rather than redirecting, so the UI can show its own loading
 * state and handle a failure without a round trip.
 */
export const GET = withRateLimit(async () => {
  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nonce = await setOAuthState(session.user.sub);
    const url = buildConsentUrl(nonce);

    logger.info("[gcal] Consent flow started", { userId: session.user.sub });

    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof GoogleNotConfiguredError) {
      logger.warn("[gcal] Connect requested but not configured");
      return NextResponse.json(
        { error: "Google Calendar sync is not available right now." },
        { status: 503 }
      );
    }
    logger.error("[gcal] Failed to start consent flow:", err);
    return NextResponse.json(
      { error: "Failed to start Google Calendar connection." },
      { status: 500 }
    );
  }
}, "sensitive");
