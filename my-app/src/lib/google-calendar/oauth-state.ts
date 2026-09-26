/**
 * google-calendar/oauth-state.ts -- CSRF state for the Google consent hop.
 *
 * The Google callback is a top-level browser navigation back to us, so the
 * same cookie-path problem as the Auth0 linking flow applies: set and delete
 * must use the same path or the delete silently no-ops and the state stays
 * replayable.
 *
 * Two properties this must get right, both of which used to be broken:
 *
 * 1. The consent hop leaves `calendar.<host>` and returns to
 *    `calendar.<host>`, but the connect button that mints the state lives on
 *    the app host. A host-only cookie is never sent back across that hop, so
 *    the cookie has to carry the shared domain.
 *
 * 2. Only the nonce round-trips through Google. The cookie holds
 *    `nonce:auth0UserId` so a state minted for one account cannot complete a
 *    link for another, but comparing Google's echo against the whole cookie
 *    value can never match. The nonce is compared; the suffix is the payload.
 */

import crypto from "crypto";
import { cookies } from "next/headers";
import { sharedCookieDomain } from "@/lib/cookie-domain";

export const GOOGLE_OAUTH_STATE_COOKIE = "gcal_oauth_state";
export const GOOGLE_OAUTH_STATE_PATH = "/api/calendar/google";
const TTL_MS = 10 * 60 * 1000;

export async function setOAuthState(auth0UserId: string): Promise<string> {
  const nonce = crypto.randomBytes(16).toString("hex");
  // Bound to the user so a state minted for one account cannot complete a
  // link for another.
  const value = `${nonce}:${auth0UserId}`;

  const store = await cookies();
  store.set(GOOGLE_OAUTH_STATE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Required for the app. -> calendar. hop; undefined falls back to a
    // host-only cookie, which is what localhost and previews need.
    domain: sharedCookieDomain(),
    path: GOOGLE_OAUTH_STATE_PATH,
    maxAge: TTL_MS / 1000,
  });

  return nonce;
}

/**
 * Constant-time nonce comparison.
 *
 * `timingSafeEqual` throws on a length mismatch, so the lengths are compared
 * first. The early return leaks only the length, which is not secret.
 */
function nonceMatches(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export async function consumeOAuthState(
  returned: string | null
): Promise<{ ok: true; auth0UserId: string } | { ok: false; reason: string }> {
  if (!returned) return { ok: false, reason: "missing_state" };

  const store = await cookies();
  const stored = store.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  // Delete with the SAME path (and domain) the cookie was set with.
  store.delete({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    path: GOOGLE_OAUTH_STATE_PATH,
    domain: sharedCookieDomain(),
  });

  if (!stored) return { ok: false, reason: "expired_state" };

  // Split before comparing: Google echoes the nonce only, never the suffix.
  const idx = stored.indexOf(":");
  if (idx === -1) return { ok: false, reason: "malformed_state" };

  const expectedNonce = stored.slice(0, idx);
  const auth0UserId = stored.slice(idx + 1);
  if (!expectedNonce || !auth0UserId) return { ok: false, reason: "malformed_state" };

  if (!nonceMatches(returned, expectedNonce)) {
    return { ok: false, reason: "state_mismatch" };
  }

  return { ok: true, auth0UserId };
}
