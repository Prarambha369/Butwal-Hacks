/**
 * google-calendar/config.ts -- server-only Google Calendar configuration.
 *
 * NEVER import this from a client component. It reads client secrets.
 */

import type { Scope } from "./types";

/**
 * Scopes requested at consent.
 *
 * `calendar.events.owned` — not `calendar.events` — is deliberate. The
 * non-suffixed scope grants read/write across calendars the user can see,
 * including shared team and holiday calendars. One-way sync only ever writes
 * events we created in the user's own calendar, so the narrower scope is both
 * sufficient and far easier to justify to Google, which matters because this
 * is a *sensitive* scope and triggers OAuth verification.
 */
export const GOOGLE_SCOPES: Scope[] = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events.owned",
];

export const GOOGLE_SCOPE_STRING = GOOGLE_SCOPES.join(" ");

/**
 * Timezone BH events are authored in. Stored instants are absolute, so this
 * only affects how we *render* them in the payload for readability; Google
 * localises for display regardless.
 */
export const BH_TIMEZONE = "Asia/Kathmandu";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(
      `Google Calendar is not configured. Missing: ${missing.join(", ")}. ` +
        `Set these in Vercel (and locally in .env.local).`
    );
    this.name = "GoogleNotConfiguredError";
  }
}

/** Origin the calendar app is served from. */
export function calendarOrigin(): string {
  return (
    process.env.CALENDAR_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    "http://calendar.localhost:3000"
  );
}

export function getOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const missing: string[] = [];
  if (!clientId) missing.push("GOOGLE_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
  if (missing.length > 0) throw new GoogleNotConfiguredError(missing);

  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    redirectUri: `${calendarOrigin()}/api/calendar/google/callback`,
  };
}

/**
 * Build the consent URL.
 *
 * `access_type=offline` is what produces a refresh token. `prompt=consent`
 * forces one on every connect so a user who revoked access can re-grant it
 * without clearing app data.
 */
export function buildConsentUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE_STRING,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
