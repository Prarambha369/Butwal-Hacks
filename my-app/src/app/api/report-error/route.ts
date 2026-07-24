import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";

const SLACK_EMAIL_CHANNEL = process.env.SLACK_EMAIL_CHANNEL ?? "";
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://butwalhacks.com";

/**
 * POST /api/report-error
 *
 * Enhanced error reporter. Sends a rich-format email to the Slack email-to-channel
 * address so errors appear in #maintainer-web-log. Includes full debugging context:
 * browser, device, OS, user identity, unique error ID, timestamps.
 *
 * Called by the error.tsx boundary.
 *
 * No auth required — errors can happen on any page regardless of login state.
 * ponytail: Single Resend email, no retry, no queue. Best-effort only.
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  if (!SLACK_EMAIL_CHANNEL) {
    return NextResponse.json({ ok: false, reason: "slack_email_not_configured" });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ ok: false, reason: "resend_not_configured" });
    }

    const body = await req.json() as {
      error_id?: string;
      message?: string;
      digest?: string;
      url?: string;
      timestamp?: string;
      user_id?: string;
      user_agent?: string;
      browser?: string;
      os?: string;
      device?: string;
      screen?: string;
      language?: string;
    };

    // Thread the client-generated error ID into the server-side logger
    const errorId = body.error_id || null;
    const log = errorId ? logger.withErrorId(errorId) : logger;

    // Log the error server-side for Axiom/console traceability
    log.error("CLIENT_ERROR", {
      message: body.message,
      url: body.url,
      user_id: body.user_id,
      browser: body.browser,
      os: body.os,
      device: body.device,
      timestamp: body.timestamp,
    });

    const blockedLines = [
      "Module not found: Can't resolve", // build-time errors
      "Cannot find module",              // missing dependency
    ];
    if (body.message && blockedLines.some((l) => body.message!.includes(l))) {
      return NextResponse.json({ ok: false, reason: "blocked" });
    }

    // ── Build rich email body with sections ─────────────────────────────────
    const sections: string[] = [];

    // Header
    sections.push("═" .repeat(50));
    sections.push(`ERROR REPORT  #${body.error_id || "N/A"}`);
    sections.push("═" .repeat(50));
    sections.push("");

    // 1. Core error info
    sections.push("CORE INFO");
    sections.push("─" .repeat(30));
    sections.push(`Error ID:   ${body.error_id || "N/A"}`);
    sections.push(`Message:    ${body.message || "unknown"}`);
    sections.push(`Digest:     ${body.digest || "N/A"}`);
    sections.push(`URL:        ${body.url || "unknown"}`);
    sections.push(`Timestamp:  ${body.timestamp || new Date().toISOString()}`);
    sections.push(`App:        ${APP_URL}`);
    sections.push("");

    // 2. User info
    sections.push("USER");
    sections.push("─" .repeat(30));
    sections.push(`User ID:    ${body.user_id || "anonymous"}`);
    sections.push(`Language:   ${body.language || "N/A"}`);
    sections.push("");

    // 3. Environment / device
    sections.push("ENVIRONMENT");
    sections.push("─" .repeat(30));
    sections.push(`Browser:    ${body.browser || "N/A"}`);
    sections.push(`OS:         ${body.os || "N/A"}`);
    sections.push(`Device:     ${body.device || "N/A"}`);
    sections.push(`Screen:     ${body.screen || "N/A"}`);
    sections.push(`User Agent: ${body.user_agent || "N/A"}`);
    sections.push("");

    // 4. Raw error message
    sections.push("RAW ERROR");
    sections.push("─" .repeat(30));
    sections.push(body.message || "unknown");
    if (body.digest) {
      sections.push("");
      sections.push(`Digest: ${body.digest}`);
    }

    const emailBody = sections.join("\n");

    // Fire-and-forget — never block the error page render
    const res = await fetch("https://api.resend.com/emails", {
      signal: AbortSignal.timeout(5_000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "errors@mail.butwalhacks.com",
        to: [SLACK_EMAIL_CHANNEL],
        subject: `Error #${body.error_id || "???"} on Butwal Hacks`,
        text: emailBody,
      }),
    });

    return NextResponse.json({
      ok: true,
      slack_status: res.ok ? "sent" : `http_${res.status}`,
    });
  } catch {
    // Silent failure — the error page already loaded
    return NextResponse.json({ ok: false });
  }
});
