import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `/verify/[id]` resolves two different credentials.
 *
 * Historically it only understood `trust_markers`, but the PDF we print tells
 * recipients to verify a `certificates.id` — so every certificate we ever
 * issued pointed at a 404. Both tables use random UUIDs, so there is no
 * collision risk in checking one and falling back to the other.
 */

export type VerifiedProfile = {
  id: string;
  full_name?: string | null;
  bh_id?: string | null;
  avatar_url?: string | null;
  email?: string | null;
} | null;

export type VerifiedEvent = { id: string; title?: string | null } | null;

export type VerifiedMarker = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  is_revoked: boolean;
  revocation_reason?: string | null;
  crypto_signature?: string | null;
  created_at: string;
  profile: VerifiedProfile;
  issuer: VerifiedProfile;
  events: VerifiedEvent;
};

export type VerifiedCertificate = {
  id: string;
  issue_date: string;
  /** Free-text status; 'issued' is the default set by the table. */
  status?: string | null;
  created_at: string;
  profile: VerifiedProfile;
  events: VerifiedEvent;
};

export type Verifiable = { kind: "marker"; marker: VerifiedMarker } | { kind: "certificate"; certificate: VerifiedCertificate };

/**
 * A certificate is only trustworthy if it has not been revoked. `certificates.status`
 * predates a CHECK constraint, so anything other than an explicit revocation
 * state counts as active -- unknown values must not silently read as revoked.
 */
const REVOKED_STATUSES = new Set(["revoked", "void", "cancelled", "canceled"]);

export function isCertificateActive(status?: string | null): boolean {
  if (!status) return true;
  return !REVOKED_STATUSES.has(status.trim().toLowerCase());
}

/**
 * Resolve an id printed on a credential to the row that backs it.
 *
 * Markers are checked first because they are the credential type with the
 * richest public surface (revocation + signature); a certificate and a marker
 * never share a UUID in practice, so ordering only affects which page renders
 * for an id that somehow exists in both.
 *
 * Returns null when neither table has the id, so callers can 404 once.
 */
export async function resolveVerifiable(
  supabase: SupabaseClient,
  id: string,
): Promise<Verifiable | null> {
  if (!id || typeof id !== "string") return null;

  const { data: marker } = await supabase
    .from("trust_markers")
    .select(`
      id, title, description, type, is_revoked, revocation_reason, crypto_signature, created_at,
      events ( id, title ),
      profile:profiles!trust_markers_profile_id_fkey ( id, full_name, bh_id, avatar_url ),
      issuer:profiles!trust_markers_issuer_id_fkey ( id, full_name, bh_id, avatar_url )
    `)
    .eq("id", id)
    .maybeSingle();

  // PostgREST types nested embeds as arrays; the single-row embeds used here
  // are objects at runtime.
  if (marker) return { kind: "marker", marker: marker as unknown as VerifiedMarker };

  const { data: certificate } = await supabase
    .from("certificates")
    .select(`
      id, issue_date, status, created_at,
      events ( id, title ),
      profile:profiles!certificates_profile_id_fkey ( id, full_name, bh_id, avatar_url )
    `)
    .eq("id", id)
    .maybeSingle();

  if (certificate) {
    return { kind: "certificate", certificate: certificate as unknown as VerifiedCertificate };
  }

  return null;
}
