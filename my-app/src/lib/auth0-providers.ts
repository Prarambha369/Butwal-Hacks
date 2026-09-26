/**
 * auth0-providers.ts -- client-safe Auth0 identity helpers.
 *
 * These used to live in `auth0-management.ts`, which reads
 * `AUTH0_M2M_CLIENT_SECRET` and calls the Management API. `linked-accounts.tsx`
 * is a `"use client"` component that only needed `getProviderDisplayName`, so
 * bundling that import dragged the whole Management API module (and its secret
 * lookups) into the browser bundle.
 *
 * Everything here is pure and safe to import from a client component.
 */

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

/**
 * Providers a user is allowed to link. Keep this as the single source of
 * truth: the initiate route used to validate against its own inline array
 * while the UI listed a slightly different set, so the two could drift.
 */
export const LINKABLE_PROVIDERS = ["github", "linkedin", "google-oauth2"] as const;

export type LinkableProvider = (typeof LINKABLE_PROVIDERS)[number];

export function isLinkableProvider(value: unknown): value is LinkableProvider {
  return (
    typeof value === "string" &&
    (LINKABLE_PROVIDERS as readonly string[]).includes(value)
  );
}

// ─── Display helpers ─────────────────────────────────────────────────

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  "google-oauth2": "Google",
  twitter: "Twitter",
  discord: "Discord",
  auth0: "Email",
};

export function getProviderDisplayName(provider: string): string {
  return (
    PROVIDER_DISPLAY_NAMES[provider] ??
    provider.charAt(0).toUpperCase() + provider.slice(1)
  );
}

const PROVIDER_ICON_PATHS: Record<string, string> = {
  github: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.063 2.063 0 1.139-.925 2.065-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  "google-oauth2": "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
  auth0: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
};

export function getProviderIconPath(provider: string): string {
  return PROVIDER_ICON_PATHS[provider] ?? "";
}

/**
 * The composite Auth0 subject for an identity, e.g. `github|12345`.
 * This is the format Auth0 uses for `user_id` inside a `sub` claim.
 */
export function identitySubject(provider: string, userId: string): string {
  return `${provider}|${userId}`;
}

/**
 * Strip the `provider|` prefix from a subject, returning the bare provider-side
 * user id. Tolerates subjects that are already bare.
 */
export function subjectToUserId(subject: string): string {
  const pipe = subject.indexOf("|");
  return pipe === -1 ? subject : subject.slice(pipe + 1);
}

/**
 * Convert Auth0 identities to the `LinkedAccount` shape stored in
 * `profiles.linked_accounts`, excluding the primary identity.
 */
export function identitiesToLinkedAccounts(
  identities: Auth0Identity[],
  primaryUserId?: string
): LinkedAccount[] {
  return identities
    .filter((id) => identitySubject(id.provider, id.user_id) !== primaryUserId)
    .map((id) => ({
      provider: id.provider,
      connection: id.connection,
      user_id: id.user_id,
      email: id.profileData?.email ?? null,
      name: id.profileData?.name ?? null,
      linked_at: new Date().toISOString(),
    }));
}
