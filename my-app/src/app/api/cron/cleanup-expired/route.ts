/**
 * Cron: Check Expired Claims
 *
 * Vercel Cron Job — runs hourly.
 * Cleans up expired trust marker claim tokens that are past their expiry date.
 *
 * Cron config in vercel.json:
 *   "crons": [{
 *     "path": "/api/cron/cleanup-expired",
 *     "schedule": "0 * * * *"
 *   }]
 *
 * Protected by CRON_SECRET environment variable.
 *
 * ponytail: Deletes expired claims in one batch query.
 * Upgrade path: Add soft-delete + audit trail for compliance.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { logger } from "@/lib/logger";
import { posthogLog } from "@/lib/posthog-logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Delete expired ghost marker claim tokens
    const { data: deleted, error } = await supabase
      .from("trust_markers")
      .delete()
      .eq("is_claimed", false)
      .lt("claim_expires_at", new Date().toISOString())
      .select("id");

    if (error) throw error;

    const count = deleted?.length ?? 0;

    if (count > 0) {
      posthogLog.info("Cron: expired claims cleaned", { count });
    }

    return NextResponse.json({ ok: true, cleaned: count });
  } catch (err) {
    logger.error("[cron-cleanup] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
