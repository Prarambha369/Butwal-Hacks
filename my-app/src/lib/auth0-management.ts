/**
 * Auth0 Management API helper.
 *
 * Wraps the Auth0 Management API v2 for identity linking, unlinking,
 * and retrieving user identities. Requires an M2M app configured in
 * the Auth0 dashboard with the `read:users` and `update:users` scopes.
 *
 * Environment variables required:
 * - AUTH0_DOMAIN         (e.g., "auth.butwalhacks.com" or "tenant.auth0.com")
 * - AUTH0_M2M_CLIENT_ID    (M2M app client ID)
 * - AUTH0_M2M_CLIENT_SECRET (M2M app client secret)
 */

import { logger } from "@/lib/logger";

// ─── Types ───────────────────────────────────────────────────────────

export interface Auth0Identity {
  provider: string;
  connection: string;
  user_id: string;
  isSocial: boolean;
  profileData?: {
    email?: string;
    name?: string;
    nickname?: string;
    avatar_url?: string;
  };
}

export interface LinkedAccount {
  provider: string;
  connection: string;
  user_id: string;
  email?: string | null;
  name?: string | null;
  linked_at: string;
}

// ─── Token Management ────────────────────────────────────────────────

let cachedToken: { access_token: string; expires_at: number } | null = null;

/**
 * Get an Auth0 Management API v2 access token using Client Credentials flow.
 * Caches the token until it expires (default 24h, but we refresh after 23h).
 */
async function getManagementToken(): Promise<string> {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_M2M_CLIENT_ID;
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      "Auth0 Management API not configured. Set AUTH0_DOMAIN, AUTH0_M2M_CLIENT_ID, and AUTH0_M2M_CLIENT_SECRET environment variables."
    );
  }

  // Return cached token if still valid (with 1h buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 3600_000) {
    return cachedToken.access_token;
  }

  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Auth0 Management API token request failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

// ─── API Calls ───────────────────────────────────────────────────────

/**
 * Get all linked identities for a given Auth0 user.
 * Excludes the primary identity (the one matching the user ID).
 */
export async function getLinkedIdentities(auth0UserId: string): Promise<Auth0Identity[]> {
  const token = await getManagementToken();
  const domain = process.env.AUTH0_DOMAIN!;

  const res = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(auth0UserId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("[auth0-mgmt] Failed to get user identities", {
      userId: auth0UserId,
      status: res.status,
      error: errorText.slice(0, 200),
    });
    throw new Error(`Failed to get user identities: ${res.status}`);
  }

  const user = await res.json();
  const identities: Auth0Identity[] = (user.identities ?? []).filter(
    (id: Auth0Identity) => {
      // Filter out the primary identity (the one matching the user's sub)
      const fullId = `${id.provider}|${id.user_id}`;
      return fullId !== auth0UserId;
    }
  );

  return identities;
}

/**
 * Link a secondary identity to the primary user account.
 *
 * @param primaryUserId - The Auth0 user ID to link TO (e.g., "auth0|abc123")
 * @param secondaryUserToken - The ID token of the secondary account to link
 */
export async function linkIdentity(
  primaryUserId: string,
  secondaryUserToken: string
): Promise<void> {
  const token = await getManagementToken();
  const domain = process.env.AUTH0_DOMAIN!;

  const res = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(primaryUserId)}/identities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        link_with: secondaryUserToken,
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("[auth0-mgmt] Failed to link identity", {
      primaryUserId,
      status: res.status,
      error: errorText.slice(0, 300),
    });

    // Check for common errors
    if (res.status === 409) {
      throw new Error("This account is already linked to another user.");
    }
    if (res.status === 400 && errorText.includes("already linked")) {
      throw new Error("This account is already linked to your profile.");
    }
    throw new Error(`Failed to link account: ${res.status}`);
  }
}

/**
 * Unlink a secondary identity from the primary user account.
 *
 * @param primaryUserId - The Auth0 user ID to unlink FROM (e.g., "auth0|abc123")
 * @param provider - The provider of the identity to unlink (e.g., "github", "linkedin")
 * @param identityUserId - The user_id of the identity to unlink (e.g., "12345" from "github|12345")
 */
export async function unlinkIdentity(
  primaryUserId: string,
  provider: string,
  identityUserId: string
): Promise<void> {
  const token = await getManagementToken();
  const domain = process.env.AUTH0_DOMAIN!;

  const res = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(primaryUserId)}/identities/${provider}/${encodeURIComponent(identityUserId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("[auth0-mgmt] Failed to unlink identity", {
      primaryUserId,
      provider,
      identityUserId,
      status: res.status,
      error: errorText.slice(0, 200),
    });
    throw new Error(`Failed to unlink account: ${res.status}`);
  }
}

/**
 * Exchange an authorization code for tokens (used in the linking callback).
 * Returns the full token response including id_token and access_token.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}> {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET!;

  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("[auth0-mgmt] Token exchange failed", {
      status: res.status,
      error: errorText.slice(0, 200),
    });
    throw new Error("Failed to exchange authorization code");
  }

  return res.json();
}

/**
 * Extract linked accounts info from identities and sync to Supabase profile.
 * Returns an array of LinkedAccount objects suitable for storing in the
 * profiles.linked_accounts JSONB column.
 */
export function identitiesToLinkedAccounts(
  identities: Auth0Identity[],
  primaryUserId?: string
): LinkedAccount[] {
  return identities
    .filter((id) => {
      // Exclude the primary identity
      const fullId = `${id.provider}|${id.user_id}`;
      return fullId !== primaryUserId;
    })
    .map((id) => ({
      provider: id.provider,
      connection: id.connection,
      user_id: id.user_id,
      email: id.profileData?.email ?? null,
      name: id.profileData?.name ?? null,
      linked_at: new Date().toISOString(),
    }));
}

/**
 * Get the display name for a provider.
 */
export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    github: "GitHub",
    linkedin: "LinkedIn",
    "google-oauth2": "Google",
    twitter: "Twitter",
    discord: "Discord",
    auth0: "Email",
  };
  return names[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Get the icon SVG path for a provider.
 */
export function getProviderIconPath(provider: string): string {
  const icons: Record<string, string> = {
    github: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
    linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    "google-oauth2": "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
    auth0: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  };
  return icons[provider] ?? "";
}

/**
 * Build the Auth0 authorization URL for linking a new identity.
 */
export function buildLinkAuthUrl(
  provider: string,
  state: string,
  redirectUri: string
): string {
  const domain = process.env.AUTH0_DOMAIN!;
  const clientId = process.env.AUTH0_CLIENT_ID!;

  const params = new URLSearchParams({
    client_id: clientId,
    connection: provider,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    state,
    prompt: "login",
  });

  return `https://${domain}/authorize?${params.toString()}`;
}
