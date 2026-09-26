import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { exchangeCode, GoogleApiError } from "@/lib/google-calendar/client";
import { consumeOAuthState } from "@/lib/google-calendar/oauth-state";
import { getConnection, upsertConnection } from "@/lib/google-calendar/tokens";
import { syncUserCalendar } from "@/lib/google-calendar/sync";
import { linkResultRedirect, appBaseUrl } from "@/lib/auth0-link-state";
import { PROFILE_SETTINGS_PATH } from "@/lib/routes";

/**
 * GET /api/calendar/google/callback
 *
 * Google's redirect target. Exchanges the code, stores the tokens encrypted,
 * then runs a first sync so the user sees their events immediately.
 *
 * The state cookie -- not the query string -- decides which user the tokens
 * belong to, so a leaked or replayed callback cannot attach someone else's
 * calendar to the wrong account.
 */
export const GET = withRateLimit(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const fail = (message: string) =>
    NextResponse.redirect(linkResultRedirect("error", message));

  if (errorParam) {
    logger.warn("[gcal] User declined consent", { error: errorParam });
    return fail("Google Calendar was not connected.");
  }

  const parsed = await consumeOAuthState(state);
  if (!parsed.ok) {
    logger.warn("[gcal] OAuth state rejected", { reason: parsed.reason });
    return fail("That connection request expired. Please try again.");
  }

  if (!code) {
    return fail("Google did not return an authorization code.");
  }

  try {
    const tokens = await exchangeCode(code);

    if (!tokens.refresh_token) {
      // Should not happen with access_type=offline + prompt=consent, but if it
      // does we must not overwrite the stored refresh token with nothing.
      const existing = await getConnection(parsed.auth0UserId);
      if (!existing?.tokens?.refreshToken) {
        logger.error("[gcal] No refresh token returned and none stored");
        return fail("Google did not grant offline access. Please try again.");
      }

      // false means the encrypt RPC or the upsert itself failed. Reporting
      // success here would show "connected" with nothing stored.
      const refreshed = await upsertConnection({
        auth0UserId: parsed.auth0UserId,
        refreshToken: existing.tokens.refreshToken,
        accessToken: tokens.access_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scopes: tokens.scope ?? null,
        googleEmail: existing.googleEmail,
      });
      if (!refreshed) {
        logger.error("[gcal] Failed to persist refreshed tokens", {
          userId: parsed.auth0UserId,
        });
        return fail("Failed to save your Google Calendar connection.");
      }
    } else {
      const stored = await upsertConnection({
        auth0UserId: parsed.auth0UserId,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scopes: tokens.scope ?? null,
        googleEmail: null,
      });
      if (!stored) {
        logger.error("[gcal] Failed to persist new connection", {
          userId: parsed.auth0UserId,
        });
        return fail("Failed to save your Google Calendar connection.");
      }
    }

    // First sync inline so the calendar is populated on arrival.
    const outcome = await syncUserCalendar(parsed.auth0UserId);
    logger.info("[gcal] Initial sync complete", {
      userId: parsed.auth0UserId,
      counts: outcome.counts,
      ok: outcome.ok,
    });

    const url = new URL(PROFILE_SETTINGS_PATH, appBaseUrl());
    url.searchParams.set("gcal", "connected");
    url.searchParams.set("gcal_counts", JSON.stringify(outcome.counts));
    return NextResponse.redirect(url);
  } catch (err) {
    if (err instanceof GoogleApiError) {
      logger.error("[gcal] Token exchange failed", {
        status: err.status,
        body: err.body.slice(0, 200),
      });
    } else {
      logger.error("[gcal] Callback failed:", err);
    }
    return fail("Failed to connect Google Calendar. Please try again.");
  }
}, "sensitive");
