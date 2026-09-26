import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { syncUserCalendar } from "@/lib/google-calendar/sync";

/**
 * POST /api/calendar/google/sync
 *
 * Triggers a one-way sync for the signed-in user. Also the handler the
 * scheduled job calls, scoped to a single user id.
 */
export const POST = withRateLimit(async () => {
  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const outcome = await syncUserCalendar(session.user.sub);

    return NextResponse.json({
      ok: outcome.ok,
      counts: outcome.counts,
      fatal: outcome.fatal ?? null,
      failures: outcome.failures,
    });
  } catch (err) {
    logger.error("[gcal] Manual sync failed:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}, "sensitive");
