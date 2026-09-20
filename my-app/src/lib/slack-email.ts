import { logger } from "@/lib/logger";

/**
 * sendSlackEmail — best-effort email via Resend to the Slack
 * email-to-channel address (SLACK_EMAIL_CHANNEL). Anything emailed there
 * auto-posts in the mapped Slack channel (e.g. #feedback-from-site).
 *
 * Never throws; returns whether the email was accepted. Skips quietly
 * when Resend or the channel address is unconfigured (local dev, CI).
 */
export async function sendSlackEmail(opts: {
  from: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const channel = process.env.SLACK_EMAIL_CHANNEL ?? "";
  const apiKey = process.env.RESEND_API_KEY ?? "";
  if (!channel || !apiKey) {
    logger.warn("[slack-email] skipped — SLACK_EMAIL_CHANNEL or RESEND_API_KEY unset");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      signal: AbortSignal.timeout(5_000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: opts.from,
        to: [channel],
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) logger.warn("[slack-email] resend rejected", res.status);
    return res.ok;
  } catch (err) {
    logger.error("[slack-email] send failed", err instanceof Error ? err.message : err);
    return false;
  }
}
