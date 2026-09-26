/**
 * auth0-link-state.ts -- shared state handling for the account-linking flow.
 *
 * The `bh_link_state` cookie is written by `/api/auth/link/initiate` and
 * consumed by `/api/auth/link/callback`. Both halves must agree on the cookie
 * **name, path, and attributes**, so they are defined once here.
 *
 * The bug this replaces: `initiate` set the cookie with `path: "/api/auth/link"`
 * but `callback` called `cookieStore.delete(NAME)` with no path. A delete
 * without a path targets `/`, which does not match, so the cookie survived
 * every linking attempt and could be replayed inside its 10-minute window.
 */

import { PROFILE_SETTINGS_PATH } from "@/lib/routes";

export const LINK_STATE_COOKIE = "bh_link_state";

/**
 * Must match on set and delete. Any subpath under /api/auth/link can read
 * this cookie, which is exactly the set of routes that need it.
 */
export const LINK_STATE_COOKIE_PATH = "/api/auth/link";

/** 10 minutes. */
export const LINK_STATE_TTL_MS = 10 * 60 * 1000;

export function linkStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: LINK_STATE_COOKIE_PATH,
    maxAge: LINK_STATE_TTL_MS / 1000,
  };
}

/**
 * Delete the state cookie using the exact same path it was created with.
 * Without the path this is a silent no-op on a path-scoped cookie.
 *
 * Returned in the object form because `cookies().delete()` takes either a bare
 * key (which implies path `/`) or an options object, not a (key, options) pair.
 */
export function linkStateCookieDeleteOptions() {
  return { name: LINK_STATE_COOKIE, path: LINK_STATE_COOKIE_PATH };
}

export interface ParsedLinkState {
  nonce: string;
  primaryUserId: string;
  provider: string;
}

/**
 * Serialize link state as `nonce:primaryUserId:provider`.
 *
 * The primary user id is an Auth0 subject and can itself contain no colon,
 * but providers theoretically could, so the provider is stored last and
 * re-joined on parse.
 */
export function buildLinkState(
  nonce: string,
  primaryUserId: string,
  provider: string
): string {
  return `${nonce}:${primaryUserId}:${provider}`;
}

export function parseLinkState(raw: string): ParsedLinkState | null {
  const parts = raw.split(":");
  if (parts.length < 3) return null;

  const [nonce, primaryUserId] = parts;
  const provider = parts.slice(2).join(":");

  if (!nonce || !primaryUserId || !provider) return null;
  return { nonce, primaryUserId, provider };
}

// ─── Redirect result encoding ────────────────────────────────────────

/**
 * Encode the `?linked=` result that the callback hands back to the UI.
 *
 * This previously mixed conventions: some branches passed
 * `encodeURIComponent(msg)` (double-encoded, because `URLSearchParams.set`
 * already encodes) and others hardcoded `+` for spaces. The client then ran
 * `decodeURIComponent` on the result, so `+` survived as a literal plus
 * instead of a space and messages were unreadable.
 *
 * Encoding once, here, keeps the wire format a single documented shape.
 */
export function encodeLinkResult(kind: "success" | "error", message: string): string {
  return `${kind}:${encodeURIComponent(message)}`;
}

// ─── Return navigation ───────────────────────────────────────────────

/**
 * Where the linking callback sends the user back to.
 *
 * Role-neutral on purpose: the hacker-scoped path sits under the hacker
 * layout, which bounces organizer and sponsor users away, so linking an
 * account as a non-hacker would have landed them on a redirect.
 * Centralised so there is a single place to change it.
 */
export const LINK_RETURN_PATH = PROFILE_SETTINGS_PATH;

/** The app's canonical origin, with the legacy env names kept as fallbacks. */
export function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.AUTH0_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

/** Build the post-link redirect URL carrying a `?linked=` result. */
export function linkResultRedirect(kind: "success" | "error", message: string): URL {
  const url = new URL(LINK_RETURN_PATH, appBaseUrl());
  url.searchParams.set("linked", encodeLinkResult(kind, message));
  return url;
}
