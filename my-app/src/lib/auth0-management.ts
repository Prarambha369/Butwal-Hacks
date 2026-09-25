/**
 * Auth0 Management API helper (SERVER ONLY -- never import from a client component).
 *
 * Wraps the Auth0 Management API v2 for identity linking, unlinking,
 * and retrieving user identities. Requires an M2M app configured in
 * the Auth0 dashboard with the `read:users` and `update:users` scopes.
 *
 * Environment variables required:
 * - AUTH0_DOMAIN         (e.g., "auth.butwalhacks.com" or "tenant.auth0.com")
 * - AUTH0_M2M_CLIENT_ID    (M2M app client ID)
 * - AUTH0_M2M_CLIENT_SECRET (M2M app client secret)
 * - AUTH0_MANAGEMENT_API_AUDIENCE (optional; defaults to `https://${AUTH0_DOMAIN}/api/v2/`)
 *
 * Client-safe helpers (types, provider display names) live in
 * `@/lib/auth0-providers` and are re-exported here for convenience.
 */

import { logger } from "@/lib/logger";
import {
  identitySubject,
  type Auth0Identity,
  type LinkedAccount,
} from "@/lib/auth0-providers";

export type { Auth0Identity, LinkedAccount };
export {
  identitiesToLinkedAccounts,
  getProviderDisplayName,
  getProviderIconPath,
  identitySubject,
  subjectToUserId,
} from "@/lib/auth0-providers";

/**
 * An error whose message is safe to show a user.
 *
 * Route handlers surface `err.message` in a toast, so anything thrown as a
 * plain Error risks leaking env var names, tenant hosts, or upstream status
 * codes into the UI. Throw this instead when the message is genuinely for the
 * user; anything else gets replaced with a generic message and logged.
 */
export class Auth0UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Auth0UserError";
  }
}

// ─── Host resolution ─────────────────────────────────────────────────

/**
 * Resolve every Auth0 host we need from a single source.
 *
 * These used to be derived independently and disagree:
 *   - the token request used the Management API audience's *origin* (the
 *     tenant domain, e.g. `tenant.auth0.com`) because custom-domain tokens are
 *     rejected by the Management API with 401 "Bad issuer";
 *   - but every API call used `https://${AUTH0_DOMAIN}` (the custom domain).
 *
 * That inconsistency is exactly what produced the intermittent "Bad issuer"
 * 401s: it only reproduced when the token happened to be issued by whichever
 * host was configured. Resolving once keeps the issuer and the API host
 * provably in agreement.
 */
function resolveAuth0Config() {
  const domain = process.env.AUTH0_DOMAIN;
  if (!domain) {
    throw new Error(
      "Auth0 is not configured. Set AUTH0_DOMAIN (e.g. \"auth.butwalhacks.com\")."
    );
  }

  const audience = (
    process.env.AUTH0_MANAGEMENT_API_AUDIENCE ?? `https://${domain}/api/v2/`
  ).replace(/\/+$/, "");

  // The token endpoint lives on the *tenant* host, not behind /api/v2.
  const tokenBase = new URL(audience).origin;
  // All Management API v2 endpoints hang off the audience path.
  const apiBase = audience;

  return { domain, audience, tokenBase, apiBase };
}

// ─── Token Management ────────────────────────────────────────────────

let cachedToken: { access_token: string; expires_at: number } | null = null;

/**
 * Get an Auth0 Management API v2 access token using Client Credentials flow.
 * Caches the token until it expires, refreshing with a 1h buffer.
 */
async function getManagementToken(): Promise<string> {
  const clientId = process.env.AUTH0_M2M_CLIENT_ID;
  const clientSecret = process.env.AUTH0_M2M_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Auth0 Management API not configured. Set AUTH0_M2M_CLIENT_ID and AUTH0_M2M_CLIENT_SECRET environment variables."
    );
  }

  const { audience, tokenBase } = resolveAuth0Config();

  // Return cached token if still valid (with 1h buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 3600_000) {
    return cachedToken.access_token;
  }

  const res = await fetch(`${tokenBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error("[auth0-mgmt] Token request failed", {
      status: res.status,
      error: errorText.slice(0, 300),
    });
    throw new Error(`Auth0 Management API token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

/** Shared response guard: logs and throws with a useful message. */
async function assertOk(
  res: Response,
  context: Record<string, unknown>,
  message: string
): Promise<void> {
  if (res.ok) return;

  const errorText = await res.text();
  logger.error(`[auth0-mgmt] ${context.op as string}`, {
    ...context,
    status: res.status,
    error: errorText.slice(0, 300),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Auth0 rejected the request. This usually means the Management API token's audience or issuer does not match the tenant."
    );
  }

  throw new Error(`${message}: ${res.status}`);
}

// ─── API Calls ───────────────────────────────────────────────────────

/**
 * Get all identities for a user, including the primary one.
 */
export async function getUserIdentities(
  auth0UserId: string
): Promise<Auth0Identity[]> {
  const token = await getManagementToken();
  const { apiBase } = resolveAuth0Config();

  const res = await fetch(
    `${apiBase}/users/${encodeURIComponent(auth0UserId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  await assertOk(res, { op: "getUserIdentities", userId: auth0UserId }, "Failed to get user");

  const user = (await res.json()) as { identities?: Auth0Identity[] };
  return user.identities ?? [];
}

/**
 * Get all linked identities for a given Auth0 user.
 * Excludes the primary identity (the one matching the user ID).
 */
export async function getLinkedIdentities(auth0UserId: string): Promise<Auth0Identity[]> {
  const identities = await getUserIdentities(auth0UserId);
  return identities.filter((id) => identitySubject(id.provider, id.user_id) !== auth0UserId);
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
  const { apiBase } = resolveAuth0Config();

  const res = await fetch(
    `${apiBase}/users/${encodeURIComponent(primaryUserId)}/identities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ link_with: secondaryUserToken }),
    }
  );

  if (res.ok) return;

  const errorText = await res.text();
  logger.error("[auth0-mgmt] Failed to link identity", {
    primaryUserId,
    status: res.status,
    error: errorText.slice(0, 300),
  });

  if (res.status === 400 && /already (linked|exists)/i.test(errorText)) {
    throw new Auth0UserError("That account is already connected to a profile.");
  }
  if (res.status === 409) {
    throw new Auth0UserError("That account is already connected to a different profile.");
  }
  if (res.status === 401 || res.status === 403) {
    throw new Auth0UserError("Auth0 rejected the link request. Please contact a maintainer.");
  }

  throw new Error(`Failed to link account: ${res.status}`);
}

/**
 * Unlink a secondary identity from the primary user account.
 *
 * @param primaryUserId - The Auth0 user ID to unlink FROM (e.g., "auth0|abc123")
 * @param provider - The provider of the identity to unlink (e.g., "github", "linkedin")
 * @param identityUserId - The provider-side id of the identity to unlink
 */
export async function unlinkIdentity(
  primaryUserId: string,
  provider: string,
  identityUserId: string
): Promise<void> {
  const token = await getManagementToken();
  const { apiBase } = resolveAuth0Config();

  const res = await fetch(
    `${apiBase}/users/${encodeURIComponent(primaryUserId)}/identities/${encodeURIComponent(provider)}/${encodeURIComponent(identityUserId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );

  await assertOk(
    res,
    { op: "unlinkIdentity", primaryUserId, provider, identityUserId },
    "Failed to unlink account"
  );
}

/**
 * Exchange an authorization code for tokens (used in the linking callback).
 * Returns the full token response including id_token.
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
  const { domain } = resolveAuth0Config();
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Auth0 is not configured. Set AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET.");
  }

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
      error: errorText.slice(0, 300),
    });
    throw new Error("Failed to exchange authorization code");
  }

  return res.json();
}

/**
 * Resend the Auth0 email-verification link to a user.
 * Requires the M2M app to have the `update:users` scope.
 */
export async function sendVerificationEmail(auth0UserId: string): Promise<void> {
  const token = await getManagementToken();
  const { apiBase } = resolveAuth0Config();

  const res = await fetch(`${apiBase}/jobs/verification-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: auth0UserId }),
  });

  await assertOk(
    res,
    { op: "sendVerificationEmail", userId: auth0UserId },
    "Failed to resend verification email"
  );
}

/**
 * Build the Auth0 authorization URL used to authenticate a secondary provider.
 *
 * This is step 1 of a two-step Management API link: the user authenticates
 * with the secondary connection, we exchange the code for an ID token, then
 * POST that token to `/identities` to perform the actual link.
 */
export function buildLinkAuthUrl(
  provider: string,
  state: string,
  redirectUri: string
): string {
  const { domain } = resolveAuth0Config();
  const clientId = process.env.AUTH0_CLIENT_ID;

  if (!clientId) {
    throw new Error("Auth0 is not configured. Set AUTH0_CLIENT_ID.");
  }

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
