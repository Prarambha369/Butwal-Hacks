import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createServiceClient } from "@/utils/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import { logger } from "@/lib/logger";
import { syncUserCalendar } from "@/lib/google-calendar/sync";

/**
 * GET /api/calendar/google/cron
 *
 * Refreshes every connected user's calendar. This is what exercises the
 * refresh token: Google access tokens live one hour, so without a scheduled
 * refresh the sync only works for an hour after each consent.
 *
 * Authenticated with `CRON_SECRET` via the Authorization header, which is how
 * Vercel Cron authenticates. The comparison is length-safe and constant-time.
 */
export const dynamic = "force-dynamic";

/** Cap per run so one invocation cannot run past the function timeout. */
const MAX_USERS_PER_RUN = 50;

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  // timingSafeEqual throws on a length mismatch, so compare lengths first.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    logger.error("[gcal-cron] CRON_SECRET is not set; refusing to run");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("google_calendar_connections")
    .select("auth0_user_id")
    .eq("sync_enabled", true)
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(MAX_USERS_PER_RUN);

  if (error) {
    const { diagnostic } = describeSupabaseError(error);
    logger.error(`[gcal-cron] Failed to list connections: ${diagnostic}`);
    return NextResponse.json({ error: "Failed to list connections" }, { status: 500 });
  }

  const userIds = ((data ?? []) as Array<{ auth0_user_id: string }>).map(
    (r) => r.auth0_user_id
  );

  const results = await Promise.allSettled(
    userIds.map((id) => syncUserCalendar(id))
  );

  let ok = 0;
  let failed = 0;
  let needsReconnect = 0;
  const totals = { create: 0, update: 0, skip: 0, orphan: 0 };

  results.forEach((r) => {
    if (r.status === "rejected") {
      failed += 1;
      return;
    }
    const outcome = r.value;
    if (outcome.fatal === "revoked") needsReconnect += 1;
    else if (outcome.ok) ok += 1;
    else failed += 1;

    for (const key of Object.keys(totals) as Array<keyof typeof totals>) {
      totals[key] += outcome.counts[key];
    }
  });

  logger.info("[gcal-cron] Sync sweep complete", {
    users: userIds.length,
    ok,
    failed,
    needsReconnect,
    totals,
  });

  return NextResponse.json({ users: userIds.length, ok, failed, needsReconnect, totals });
}
