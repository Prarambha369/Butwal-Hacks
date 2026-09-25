/**
 * google-calendar/plan.ts -- the one-way conflict policy.
 *
 * ── The policy, stated once ────────────────────────────────────────────────
 * Direction is ONE-WAY: Butwal Hacks is the single source of truth. Google
 * never wins, and we never delete anything on the user's side.
 *
 *   create   no Google event with our id exists          -> insert
 *   update   it exists and our managed payload differs   -> patch in place
 *   skip     it exists and our payload already matches  -> no-op
 *   orphan   it was synced before but is no longer
 *            published                                  -> DO NOTHING
 *
 * Three decisions in there are deliberate and worth defending:
 *
 * 1. WHY NO DELETE. Removing an event from someone's real calendar is the one
 *    irreversible operation here, and the wrong way round it destroys data the
 *    user may have annotated. A BH event being unpublished or deleted leaves
 *    the pushed copy in place. We record it as an orphan so the state is
 *    visible, and a human can clean up. Flipping this to delete-on-unpublish
 *    is a one-line change to `buildSyncPlan` once someone owns the decision.
 *
 * 2. WHY UPDATE ON CHANGE. One-way does not mean write-once. If a BH event
 *    moves and we do not patch it, every user's calendar is wrong forever and
 *    there is no way for them to tell it apart from a stale import. BH wins.
 *
 * 3. WHY THE HASH IS OVER OUR PAYLOAD ONLY. See `GoogleEventRef.managedHash`.
 *    Hashing the whole Google event would make every user edit look like drift
 *    and re-write their calendar on every run. This keeps the loop stable.
 *
 * The Google event id is derived from the BH slug, so a repeat sync is
 * idempotent by construction and does not depend on a stored mapping to work.
 */

import { createHash } from "crypto";
import type { BhEvent, GoogleEventRef, SyncPlan, SyncPlanItem, SyncAction } from "./types";
import { BH_TIMEZONE } from "./config";

/** Default length when an event has no end date. Matches the iCal feed. */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * Deterministic Google event id.
 *
 * Google requires `[a-z0-9_-]{5,1024}`. Deriving it from the slug means the
 * same BH event always maps to the same Google id, so re-syncing after a
 * dropped row in our own mapping still updates in place instead of creating a
 * duplicate.
 */
export function googleEventIdForSlug(slug: string): string {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const suffix = createHash("sha256").update(slug).digest("hex").slice(0, 12);
  return `bh-${safe || "event"}-${suffix}`;
}

export interface EventPayload {
  summary: string;
  description: string;
  location: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  htmlLink?: string;
}

/** Fallback end time when the event has no end date. */
export function resolveEnd(event: BhEvent): Date {
  if (event.endDate) {
    const parsed = new Date(event.endDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(new Date(event.startDate).getTime() + DEFAULT_DURATION_MS);
}

/**
 * Build the Google event body BH owns.
 *
 * `htmlLink` is deliberately omitted: it is set on first write and carried
 * forward by Google, but recomputing it would make the managed hash unstable
 * across syncs.
 */
export function buildEventPayload(event: BhEvent): EventPayload {
  return {
    summary: event.title || "Butwal Hacks event",
    description: event.description ?? "",
    location: event.location ?? "",
    start: { dateTime: new Date(event.startDate).toISOString(), timeZone: BH_TIMEZONE },
    end: { dateTime: resolveEnd(event).toISOString(), timeZone: BH_TIMEZONE },
  };
}

/**
 * Hash of the fields we manage, ignoring key order.
 *
 * Recomputed from the same builder used for the write, so "hash matches" and
 * "nothing to do" cannot disagree.
 */
export function managedHashFor(event: BhEvent): string {
  const payload = buildEventPayload(event);
  return createHash("sha256")
    .update(
      JSON.stringify([
        payload.summary,
        payload.description,
        payload.location,
        payload.start.dateTime,
        payload.end.dateTime,
      ])
    )
    .digest("hex");
}

export function buildSyncPlan(
  published: BhEvent[],
  existing: Map<string, GoogleEventRef>
): SyncPlan {
  const items: SyncPlanItem[] = [];
  const counts: Record<SyncAction, number> = {
    create: 0,
    update: 0,
    skip: 0,
    orphan: 0,
  };

  const seen = new Set<string>();

  for (const event of published) {
    const key = event.slug;
    seen.add(key);

    const googleEventId = googleEventIdForSlug(key);
    const ref = existing.get(key);
    const wanted = managedHashFor(event);

    let action: SyncAction;
    let reason: string;

    if (!ref) {
      action = "create";
      reason = "no existing Google event for this slug";
    } else if (ref.managedHash !== wanted) {
      action = "update";
      reason = "BH event changed since the last sync";
    } else {
      action = "skip";
      reason = "already up to date";
    }

    counts[action] += 1;
    items.push({ action, slug: key, reason, event, googleEventId });
  }

  // Previously synced, but no longer in the published set.
  for (const [slug, ref] of existing) {
    if (seen.has(slug)) continue;
    counts.orphan += 1;
    items.push({
      action: "orphan",
      slug,
      reason: "no longer published in BH; left in place on purpose (one-way never deletes)",
      // Only the slug is meaningful here; carry a minimal placeholder so the
      // item shape stays uniform for logging.
      event: {
        id: "",
        slug,
        title: "",
        description: null,
        location: null,
        startDate: "",
        endDate: null,
        updatedAt: null,
      },
      googleEventId: ref.id,
    });
  }

  return { items, counts };
}
