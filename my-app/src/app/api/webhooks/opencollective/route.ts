import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { logger } from "@/lib/logger";
import { captureServerEvent } from "@/lib/analytics/server";
import { withRateLimit, withPayloadLimit } from "@/lib/rate-limiter";

/**
 * POST /api/webhooks/opencollective
 *
 * Receives webhook events from Open Collective when expenses are created,
 * approved, or paid. Used to automatically update bounty board status
 * and award XP to hackers who complete bounty tasks.
 *
 * SECURITY: HMAC-SHA256 signature verification.
 *
 * Open Collective signs webhook payloads with a shared secret. The signature
 * is sent in the `x-webhook-signature` header as a hex-encoded HMAC-SHA256
 * of the raw request body. We verify this before processing the payload.
 *
 * If OC_WEBHOOK_SECRET is not set (dev/staging), verification is skipped.
 * In production, OC_WEBHOOK_SECRET MUST be set, and unverified requests are
 * rejected with 401.
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
export const POST = withRateLimit(withPayloadLimit(async (req: NextRequest) => {
  try {
    // ── Payload size check ────────────────────────────────────
    const rawLength = req.headers.get("content-length");
    const contentLength = parseInt(rawLength ?? "0", 10);
    if (!isNaN(contentLength) && contentLength > 1_048_576) {
      logger.warn("[oc-webhook] Rejected oversized payload");
      return new NextResponse("Payload too large", { status: 413 });
    }

    // ── HMAC signature verification (C-01) ────────────────────
    // Open Collective signs webhook payloads with a shared secret.
    // In production, OC_WEBHOOK_SECRET MUST be set. In dev/staging,
    // the secret may be absent — verification is skipped.
    const webhookSecret = process.env.OC_WEBHOOK_SECRET;
    let body: Record<string, unknown>;

    if (webhookSecret) {
      const signatureHeader = req.headers.get("x-webhook-signature");
      if (!signatureHeader) {
        logger.warn("[oc-webhook] Missing x-webhook-signature header");
        return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
      }

      // Read raw body as text for signature verification (before JSON parse)
      const rawBody = await req.text();

      const computedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody, "utf8")
        .digest("hex");

      // Constant-time comparison to prevent timing attacks
      const expectedLen = Buffer.byteLength(signatureHeader, "utf8");
      const computedBuf = Buffer.from(computedSignature, "utf8");
      const receivedBuf = Buffer.from(signatureHeader, "utf8");

      if (
        expectedLen !== computedBuf.length ||
        !crypto.timingSafeEqual(computedBuf, receivedBuf)
      ) {
        logger.warn("[oc-webhook] Invalid webhook signature — possible forgery attempt");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }

      // Parse the verified body as JSON
      body = JSON.parse(rawBody);
    } else {
      logger.warn("[oc-webhook] OC_WEBHOOK_SECRET not set — skipping signature verification");
      body = await req.json();
    }

    const eventType: string = (body.type as string) || "";
    const expense = (body?.data as Record<string, unknown>)?.expense as Record<string, unknown> | undefined;
    const collective = (body?.data as Record<string, unknown>)?.collective as Record<string, unknown> | undefined;

    if (!eventType || !expense || (collective?.slug as string) !== "butwal-hacks") {
      return NextResponse.json({ received: true });
    }

    // Check if this expense matches a bounty by looking for BH-ID or bounty title in description
    const description: string = (expense?.description as string) || "";
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
      const payee = expense?.payee as Record<string, unknown> | undefined;
      const payeeEmail = (payee?.email as string) || "";
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
}), "bulk");
