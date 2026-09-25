/**
 * google-calendar/oauth-state.ts -- CSRF state for the Google consent hop.
 *
 * The Google callback is a top-level browser navigation back to us, so the
 * same cookie-path problem as the Auth0 linking flow applies: set and delete
 * must use the same path or the delete silently no-ops and the state stays
 * replayable.
 */

import crypto from "crypto";
import { cookies } from "next/headers";

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
    path: GOOGLE_OAUTH_STATE_PATH,
    maxAge: TTL_MS / 1000,
  });

  return nonce;
}

export async function consumeOAuthState(
  returned: string | null
): Promise<{ ok: true; auth0UserId: string } | { ok: false; reason: string }> {
  if (!returned) return { ok: false, reason: "missing_state" };

  const store = await cookies();
  const stored = store.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  // Delete with the SAME path the cookie was set with.
  store.delete({ name: GOOGLE_OAUTH_STATE_COOKIE, path: GOOGLE_OAUTH_STATE_PATH });

  if (!stored) return { ok: false, reason: "expired_state" };
  if (returned !== stored) return { ok: false, reason: "state_mismatch" };

  const idx = stored.indexOf(":");
  if (idx === -1) return { ok: false, reason: "malformed_state" };

  const auth0UserId = stored.slice(idx + 1);
  if (!auth0UserId) return { ok: false, reason: "malformed_state" };

  return { ok: true, auth0UserId };
}
