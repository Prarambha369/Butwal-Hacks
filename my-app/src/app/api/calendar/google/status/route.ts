import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import { getConnection } from "@/lib/google-calendar/tokens";

/**
 * GET /api/calendar/google/status
 *
 * Connection state for the settings UI. Deliberately omits every token and the
 * token metadata beyond "is there a refresh token" -- nothing secret should
 * ever reach a client.
 */
export const GET = withRateLimit(async () => {
  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await getConnection(session.user.sub);

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      syncEnabled: connection.syncEnabled,
      hasRefreshToken: Boolean(connection.tokens?.refreshToken),
      scopes: connection.scopes,
      googleEmail: connection.googleEmail,
      calendarId: connection.calendarId,
      lastSyncedAt: connection.lastSyncedAt,
      lastSyncError: connection.lastSyncError,
      syncedEventCount: Object.keys(connection.googleEventIds).length,
    });
  } catch (err) {
    logger.error("[gcal] Status failed:", err);
    return NextResponse.json({ error: "Failed to read connection status" }, { status: 500 });
  }
}, "frequent");
