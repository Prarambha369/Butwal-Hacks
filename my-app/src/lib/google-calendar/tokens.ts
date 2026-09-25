/**
 * google-calendar/tokens.ts -- server-only encrypted token persistence.
 *
 * Tokens are encrypted inside the database by migration 124's
 * `encrypt_google_token` / `decrypt_google_token` RPCs, whose key lives in
 * Supabase Vault. The plaintext token and the key are therefore never in the
 * same process, and the key is never in application memory at all.
 *
 * This module only ever calls the service-role client. It must never be
 * imported from a client component.
 */

import { createServiceClient } from "@/utils/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import { logger } from "@/lib/logger";
import type { GoogleTokens } from "./types";

export interface StoredConnection {
  auth0UserId: string;
  calendarId: string;
  scopes: string | null;
  googleEmail: string | null;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  /** Decrypted, server-side only. Never returns to a client. */
  tokens: GoogleTokens | null;
  /** slug -> { id, managedHash } */
  googleEventIds: Record<string, { id: string; managedHash: string | null }>;
}

interface ConnectionRow {
  auth0_user_id: string;
  refresh_token_enc: string | null;
  access_token_enc: string | null;
  access_token_expires_at: string | null;
  scopes: string | null;
  google_email: string | null;
  calendar_id: string;
  sync_enabled: boolean;
  last_synced_at: string | null;
  last_sync_error: string | null;
  google_event_ids: Record<string, { id: string; managedHash: string | null }> | null;
}

const RPC = "google_calendar_connections";

async function decrypt(value: string | null): Promise<string | null> {
  if (!value) return null;
  const db = createServiceClient();
  const { data, error } = await db.rpc("decrypt_google_token", { ciphertext: value });
  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    // Most likely a rotated Vault key. Worth an alert: every token for this
    // project is unreadable and users must reconnect.
    logger.error(`[gcal] Token decrypt failed: ${diagnostic}`);
    return null;
  }
  return (data as string | null) ?? null;
}

async function encrypt(value: string): Promise<string | null> {
  const db = createServiceClient();
  const { data, error } = await db.rpc("encrypt_google_token", { plaintext: value });
  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    logger.error(`[gcal] Token encrypt failed: ${diagnostic}`);
    return null;
  }
  return (data as string | null) ?? null;
}

export async function getConnection(
  auth0UserId: string
): Promise<StoredConnection | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from(RPC)
    .select(
      "auth0_user_id, refresh_token_enc, access_token_enc, access_token_expires_at, scopes, google_email, calendar_id, sync_enabled, last_synced_at, last_sync_error, google_event_ids"
    )
    .eq("auth0_user_id", auth0UserId)
    .maybeSingle();

  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    logger.error(`[gcal] Failed to load connection: ${diagnostic}`);
    return null;
  }
  if (!data) return null;

  const row = data as unknown as ConnectionRow;
  const refreshToken = await decrypt(row.refresh_token_enc);
  const accessToken = await decrypt(row.access_token_enc);

  return {
    auth0UserId: row.auth0_user_id,
    calendarId: row.calendar_id,
    scopes: row.scopes,
    googleEmail: row.google_email,
    syncEnabled: row.sync_enabled,
    lastSyncedAt: row.last_synced_at,
    lastSyncError: row.last_sync_error,
    tokens:
      refreshToken || accessToken
        ? {
            accessToken: accessToken ?? "",
            refreshToken: refreshToken ?? "",
            expiresAt: row.access_token_expires_at
              ? new Date(row.access_token_expires_at).getTime()
              : null,
            scope: row.scopes,
          }
        : null,
    googleEventIds: row.google_event_ids ?? {},
  };
}

/**
 * Create or replace a connection.
 *
 * Only the refresh token is required: Google omits the refresh token on a
 * re-consent when the grant is unchanged, and discarding the stored one would
 * silently break background refresh.
 */
export async function upsertConnection(params: {
  auth0UserId: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: number | null;
  scopes: string | null;
  googleEmail: string | null;
  calendarId?: string;
}): Promise<boolean> {
  const encRefresh = await encrypt(params.refreshToken);
  const encAccess = await encrypt(params.accessToken);
  if (!encRefresh) return false;

  const db = createServiceClient();
  const { error } = await db.from(RPC).upsert(
    {
      auth0_user_id: params.auth0UserId,
      refresh_token_enc: encRefresh,
      access_token_enc: encAccess,
      access_token_expires_at: params.expiresAt
        ? new Date(params.expiresAt).toISOString()
        : null,
      scopes: params.scopes,
      google_email: params.googleEmail,
      calendar_id: params.calendarId ?? "primary",
    },
    { onConflict: "auth0_user_id" }
  );

  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    logger.error(`[gcal] Failed to store connection: ${diagnostic}`);
    return false;
  }
  return true;
}

/**
 * Persist a rotated access token.
 *
 * The refresh token is untouched: rotating it would require re-reading the
 * plaintext and re-encrypting on every single sync.
 */
export async function updateAccessToken(
  auth0UserId: string,
  accessToken: string,
  expiresAt: number | null
): Promise<void> {
  const encAccess = await encrypt(accessToken);
  if (!encAccess) return;

  const db = createServiceClient();
  const { error } = await db
    .from(RPC)
    .update({
      access_token_enc: encAccess,
      access_token_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
    .eq("auth0_user_id", auth0UserId);

  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    logger.error(`[gcal] Failed to persist rotated access token: ${diagnostic}`);
  }
}

export async function recordSyncResult(params: {
  auth0UserId: string;
  googleEventIds: Record<string, { id: string; managedHash: string | null }>;
  error?: string | null;
}): Promise<void> {
  const db = createServiceClient();
  const { error } = await db
    .from(RPC)
    .update({
      google_event_ids: params.googleEventIds,
      last_synced_at: new Date().toISOString(),
      last_sync_error: params.error ?? null,
    })
    .eq("auth0_user_id", params.auth0UserId);

  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    logger.error(`[gcal] Failed to record sync result: ${diagnostic}`);
  }
}

export async function appendSyncLog(rows: Array<{
  auth0UserId: string;
  slug: string;
  action: "created" | "updated" | "skipped" | "failed";
  googleEventId?: string | null;
  detail?: string | null;
}>): Promise<void> {
  if (rows.length === 0) return;

  const db = createServiceClient();
  const { error } = await db.from("google_calendar_sync_log").insert(
    rows.map((r) => ({
      auth0_user_id: r.auth0UserId,
      bh_event_slug: r.slug,
      action: r.action,
      google_event_id: r.googleEventId ?? null,
      detail: r.detail ?? null,
    }))
  );

  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    logger.error(`[gcal] Failed to append sync log: ${diagnostic}`);
  }
}

/** Remove the connection and every trace of the synced events. */
export async function deleteConnection(auth0UserId: string): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db.from(RPC).delete().eq("auth0_user_id", auth0UserId);

  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    logger.error(`[gcal] Failed to delete connection: ${diagnostic}`);
    return false;
  }
  return true;
}
