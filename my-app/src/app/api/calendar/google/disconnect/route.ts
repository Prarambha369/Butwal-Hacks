import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { deleteConnection } from "@/lib/google-calendar/tokens";

/**
 * POST /api/calendar/google/disconnect
 *
 * Forgets the connection and the synced-event map.
 *
 * It does NOT delete the events already created in the user's Google
 * calendar. That is the same deliberate choice the sync policy makes: see
 * `plan.ts`. A disconnect should never destroy data on someone's real
 * calendar -- they are told exactly what to clean up instead.
 */
export const POST = withRateLimit(async () => {
  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const removed = await deleteConnection(session.user.sub);
    if (!removed) {
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    logger.info("[gcal] Connection removed", { userId: session.user.sub });

    return NextResponse.json({
      success: true,
      message:
        "Google Calendar disconnected. Events already added to your calendar were left in place — delete them from Google if you no longer want them.",
    });
  } catch (err) {
    logger.error("[gcal] Disconnect failed:", err);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}, "sensitive");
