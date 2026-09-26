/**
 * google-calendar/sync.ts -- executes a sync plan against Google.
 *
 * The decision of *what* to do lives in `plan.ts` and is pure. This file only
 * performs it, which keeps the policy reviewable without any network or
 * database in the picture.
 */

import { createServiceClient } from "@/utils/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import { logger } from "@/lib/logger";
import { buildSyncPlan, buildEventPayload, managedHashFor, googleEventIdForSlug } from "./plan";
import { createEvent, patchEvent, refreshAccessToken, GoogleApiError } from "./client";
import {
  getConnection,
  updateAccessToken,
  recordSyncResult,
  appendSyncLog,
  type StoredConnection,
} from "./tokens";
import type { BhEvent, GoogleEventRef, SyncPlan } from "./types";

export interface SyncOutcome {
  ok: boolean;
  counts: SyncPlan["counts"];
  /** Set when the sync could not run at all (no connection, revoked grant). */
  fatal?: string;
  /** Per-item failures that did not stop the run. */
  failures: Array<{ slug: string; detail: string }>;
}

/** Treat an access token as stale slightly early to avoid racing expiry. */
const TOKEN_EXPIRY_SKEW_MS = 60_000;

async function loadPublishedEvents(): Promise<BhEvent[]> {
  const db = createServiceClient();
  // Same published set as the homepage calendar and the iCal feed: publishing
  // an event is the single switch that makes it appear everywhere.
  const { data, error } = await db
    .from("events")
    .select("id, title, description, location, slug, start_date, end_date, updated_at")
    .eq("is_published", true);

  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    throw new Error(`Failed to load events: ${diagnostic}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .filter((r) => typeof r.slug === "string" && r.slug)
    .map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title ?? ""),
      description: (r.description as string | null) ?? null,
      location: (r.location as string | null) ?? null,
      startDate: String(r.start_date),
      endDate: (r.end_date as string | null) ?? null,
      updatedAt: (r.updated_at as string | null) ?? null,
    }));
}

/**
 * Return a usable access token, refreshing if needed.
 *
 * Also persists a rotated token so the next run does not refresh again. On
 * `invalid_grant` the user revoked access, which is not retryable and should
 * surface as a prompt to reconnect.
 */
async function ensureAccessToken(
  connection: StoredConnection
): Promise<{ accessToken: string } | { revoked: true }> {
  const { tokens } = connection;
  if (!tokens?.refreshToken) return { revoked: true };

  const fresh =
    !tokens.accessToken ||
    tokens.expiresAt === null ||
    tokens.expiresAt - TOKEN_EXPIRY_SKEW_MS <= Date.now();

  if (!fresh) return { accessToken: tokens.accessToken };

  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken);
    const expiresAt = Date.now() + refreshed.expires_in * 1000;
    await updateAccessToken(connection.auth0UserId, refreshed.access_token, expiresAt);
    return { accessToken: refreshed.access_token };
  } catch (err) {
    if (
      err instanceof GoogleApiError &&
      /invalid_grant|revoked|unauthorized_client/i.test(err.body)
    ) {
      logger.warn("[gcal] Refresh token was revoked; user must reconnect");
      return { revoked: true };
    }
    throw err;
  }
}

export async function syncUserCalendar(
  auth0UserId: string
): Promise<SyncOutcome> {
  const emptyCounts = { create: 0, update: 0, skip: 0, orphan: 0 };
  const connection = await getConnection(auth0UserId);

  if (!connection) {
    return { ok: false, counts: emptyCounts, fatal: "not_connected", failures: [] };
  }
  if (!connection.syncEnabled) {
    return { ok: true, counts: emptyCounts, fatal: "sync_disabled", failures: [] };
  }

  const auth = await ensureAccessToken(connection);
  if ("revoked" in auth) {
    await recordSyncResult({ auth0UserId, googleEventIds: connection.googleEventIds, error: "revoked" });
    return { ok: false, counts: emptyCounts, fatal: "revoked", failures: [] };
  }

  const published = await loadPublishedEvents();
  const existing = new Map<string, GoogleEventRef>(
    Object.entries(connection.googleEventIds).map(([slug, v]) => [
      slug,
      { id: v.id, managedHash: v.managedHash },
    ])
  );

  const plan = buildSyncPlan(published, existing);
  const nextIds = { ...connection.googleEventIds };
  const failures: SyncOutcome["failures"] = [];
  const logRows: Parameters<typeof appendSyncLog>[0] = [];

  // Disconnect deletes the row, but this sync is already holding a decrypted
  // access token and would otherwise keep writing events to a calendar the user
  // just unlinked. Re-read the connection before the first mutation so an
  // in-flight sync stops rather than finishing against a revoked connection.
  // This narrows the window to a disconnect that lands mid-loop; closing that
  // fully would mean a check per event, which is not worth a query each.
  const stillConnected = await getConnection(auth0UserId);
  if (!stillConnected) {
    logger.info("[gcal-sync] Connection disappeared mid-sync; aborting", { auth0UserId });
    await recordSyncResult({ auth0UserId, googleEventIds: {}, error: "disconnected_mid_sync" });
    return { ok: false, counts: emptyCounts, fatal: "disconnected", failures: [] };
  }

  for (const item of plan.items) {
    if (item.action === "orphan") {
      // Recorded, never deleted. See plan.ts for why.
      logRows.push({
        auth0UserId,
        slug: item.slug,
        action: "skipped",
        googleEventId: item.googleEventId,
        detail: item.reason,
      });
      continue;
    }

    if (item.action === "skip") {
      logRows.push({
        auth0UserId,
        slug: item.slug,
        action: "skipped",
        googleEventId: item.googleEventId,
        detail: item.reason,
      });
      continue;
    }

    const payload = buildEventPayload(item.event);
    const hash = managedHashFor(item.event);

    try {
      if (item.action === "create") {
        try {
          const created = await createEvent(
            auth.accessToken,
            connection.calendarId,
            item.googleEventId,
            payload
          );
          nextIds[item.slug] = { id: created.id ?? item.googleEventId, managedHash: hash };
          logRows.push({ auth0UserId, slug: item.slug, action: "created", googleEventId: created.id, detail: item.reason });
        } catch (err) {
          // 409 means our deterministic id is already taken, which happens
          // whenever we lost the mapping while the event survived: a
          // disconnect drops google_event_ids but leaves the events in place,
          // and a lost recordSyncResult write drops a single entry. Google also
          // reserves the id of a deleted event, so the recreate path below hits
          // this too. Updating in place recovers instead of failing forever.
          if (err instanceof GoogleApiError && err.isConflict) {
            const updated = await patchEvent(
              auth.accessToken,
              connection.calendarId,
              item.googleEventId,
              { ...payload, status: "confirmed" }
            );
            nextIds[item.slug] = { id: updated.id ?? item.googleEventId, managedHash: hash };
            logRows.push({
              auth0UserId,
              slug: item.slug,
              action: "updated",
              googleEventId: updated.id,
              detail: "id already existed on Google; updated in place",
            });
          } else {
            throw err;
          }
        }
      } else {
        try {
          const updated = await patchEvent(
            auth.accessToken,
            connection.calendarId,
            item.googleEventId,
            payload
          );
          nextIds[item.slug] = { id: updated.id ?? item.googleEventId, managedHash: hash };
          logRows.push({ auth0UserId, slug: item.slug, action: "updated", googleEventId: updated.id, detail: item.reason });
        } catch (err) {
          // The user deleted the event on their side. Self-heal by recreating
          // rather than leaving a permanently broken entry.
          if (err instanceof GoogleApiError && err.isNotFound) {
            try {
              const created = await createEvent(
                auth.accessToken,
                connection.calendarId,
                googleEventIdForSlug(item.slug),
                payload
              );
              nextIds[item.slug] = { id: created.id, managedHash: hash };
              logRows.push({
                auth0UserId,
                slug: item.slug,
                action: "created",
                googleEventId: created.id,
                detail: "previous event was deleted on the user's side; recreated",
              });
            } catch (recreateErr) {
              // The id stays reserved after a delete, so recreating can 409.
              // Fall back to updating the tombstoned event, which restores it.
              if (recreateErr instanceof GoogleApiError && recreateErr.isConflict) {
                const restored = await patchEvent(
                  auth.accessToken,
                  connection.calendarId,
                  googleEventIdForSlug(item.slug),
                  { ...payload, status: "confirmed" }
                );
                nextIds[item.slug] = { id: restored.id, managedHash: hash };
                logRows.push({
                  auth0UserId,
                  slug: item.slug,
                  action: "updated",
                  googleEventId: restored.id,
                  detail: "previous event was deleted on the user's side; restored in place",
                });
              } else {
                throw recreateErr;
              }
            }
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      // One bad event must not abort the rest of the calendar.
      const detail = err instanceof Error ? err.message : String(err);
      failures.push({ slug: item.slug, detail });
      logRows.push({ auth0UserId, slug: item.slug, action: "failed", detail });
    }
  }

  const fatalError =
    failures.length > 0 ? `${failures.length} event(s) failed` : null;
  await recordSyncResult({
    auth0UserId,
    googleEventIds: nextIds,
    error: fatalError,
  });
  await appendSyncLog(logRows);

  return { ok: failures.length === 0, counts: plan.counts, failures };
}
