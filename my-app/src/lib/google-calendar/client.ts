/**
 * google-calendar/client.ts -- server-only Google Calendar REST client.
 *
 * Hand-rolled rather than using `googleapis`. The surface we need is three
 * endpoints plus a token refresh; the npm package adds a large dependency and
 * a transitive tree for that. Swapping later means changing this file only.
 */

import { getOAuthConfig } from "./config";
import type { GoogleTokens } from "./types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_BASE = "https://www.googleapis.com/calendar/v3";

export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message);
    this.name = "GoogleApiError";
  }

  /** 404 on an event we thought existed means the user deleted it. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** 403 with a quota/rate reason means back off, not that the token is bad. */
  get isRateLimited(): boolean {
    return this.status === 429 || (this.status === 403 && /rate|quota/i.test(this.body));
  }
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

/** Exchange an authorization code for tokens. */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new GoogleApiError("Token exchange failed", res.status, await res.text());
  }

  return res.json();
}

/**
 * Exchange a refresh token for a fresh access token.
 *
 * Google omits `refresh_token` from the response when the grant is unchanged,
 * so callers must keep using the token they already hold.
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getOAuthConfig();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new GoogleApiError("Token refresh failed", res.status, await res.text());
  }

  return res.json();
}

function authHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
}

export interface GoogleEventResource {
  id: string;
  htmlLink?: string;
  summary?: string;
  [key: string]: unknown;
}

/** Fetch one event by id. Throws `GoogleApiError(404)` when it is gone. */
export async function getEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<GoogleEventResource> {
  const res = await fetch(
    `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new GoogleApiError("Failed to read event", res.status, await res.text());
  }

  return res.json();
}

/**
 * Create an event with a caller-supplied id.
 *
 * Supplying the id is what makes the sync idempotent: a retried create after a
 * network timeout targets the same event instead of duplicating it.
 */
export async function createEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  body: unknown
): Promise<GoogleEventResource> {
  const res = await fetch(
    `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify({ ...(body as object), id: eventId }),
    }
  );

  if (!res.ok) {
    throw new GoogleApiError("Failed to create event", res.status, await res.text());
  }

  return res.json();
}

/** Patch an existing event in place. */
export async function patchEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  body: unknown
): Promise<GoogleEventResource> {
  const res = await fetch(
    `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new GoogleApiError("Failed to update event", res.status, await res.text());
  }

  return res.json();
}

export type { GoogleTokens };
