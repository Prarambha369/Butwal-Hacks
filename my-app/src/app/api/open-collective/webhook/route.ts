import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { logger } from "@/lib/logger";
import { captureServerEvent } from "@/lib/analytics/server";

/**
 * POST /api/open-collective/webhook
 *
 * Receives webhook events from Open Collective when expenses are created,
 * approved, or paid. Used to automatically update bounty board status
 * and award XP to hackers who complete bounty tasks.
 *
 * ponytail: No signature verification — Open Collective Enterprise has webhook
 * signing. For the community tier, we rely on the webhook URL being secret.
 * Add OC_WEBHOOK_SECRET environment variable verification for production.
 *
 * Expected payload (from OC Expense events):
 * {
 *   "type": "expense.created" | "expense.approved" | "expense.paid",
 *   "data": {
 *     "expense": { "id": "expense-uuid", "description": "...", "amount": 50000, "currency": "USD" },
 *     "collective": { "slug": "butwal-hacks" }
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // ponytail: content-length check before parsing
    const rawLength = req.headers.get("content-length");
    const contentLength = parseInt(rawLength ?? "0", 10);
    if (!isNaN(contentLength) && contentLength > 1_048_576) {
      return new NextResponse("Payload too large", { status: 413 });
    }

    const body = await req.json();
    const eventType: string = body.type || "";
    const expense = body?.data?.expense;
    const collective = body?.data?.collective;

    if (!eventType || !expense || collective?.slug !== "butwal-hacks") {
      return NextResponse.json({ received: true });
    }

    // Check if this expense matches a bounty by looking for BH-ID or bounty title in description
    const description: string = expense.description || "";
    const bountyMatch = description.match(/BOUNTY:\s*(.+)/i);
    const bhIdMatch = description.match(/BH-\d{2}-\d{3}/i);

    if (!bountyMatch && !bhIdMatch) {
      // Not a bounty-related expense — still log it
      logger.info("[oc-webhook] Non-bounty expense event", { eventType, expenseId: expense.id });
      return NextResponse.json({ received: true, bounty: false });
    }

    const bountyTitle = bountyMatch ? bountyMatch[1].trim() : null;
    const supabase = createServiceClient();

    // Find matching bounty opportunity
    let opportunityQuery = supabase
      .from("sponsor_opportunities")
      .select("id, title, bounty_amount")
      .eq("is_bounty", true);

    if (bountyTitle) {
      opportunityQuery = opportunityQuery.ilike("title", `%${bountyTitle}%`);
    }

    const { data: bounty } = await opportunityQuery.maybeSingle();

    if (!bounty) {
      logger.info("[oc-webhook] No matching bounty found for expense", { description });
      return NextResponse.json({ received: true, matched: false });
    }

    // Update bounty as completed on payout
    if (eventType === "expense.paid") {
      await supabase
        .from("sponsor_opportunities")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", bounty.id);

      // Find the hacker who submitted the expense — look up by email in expense
      const payeeEmail = expense.payee?.email || "";
      if (payeeEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, auth0_user_id")
          .eq("email", payeeEmail)
          .maybeSingle();

        if (profile) {
          // Award XP for bounty completion
          await supabase.rpc("increment_xp", {
            p_profile_id: profile.id,
            p_amount: 100,
            p_reason: `Bounty completed: ${bounty.title}`,
          });
        }
      }

      await captureServerEvent("bounty_completed", "open_collective", {
        bounty_id: bounty.id,
        bounty_title: bounty.title,
        amount: expense.amount,
        currency: expense.currency,
      });

      logger.info("[oc-webhook] Bounty paid & marked complete", {
        bountyId: bounty.id,
        title: bounty.title,
      });
    }

    return NextResponse.json({ received: true, matched: true });
  } catch (err) {
    logger.error("[oc-webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
