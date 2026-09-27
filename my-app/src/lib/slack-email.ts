import { logger } from "@/lib/logger";
import { sendResendEmail } from "@/lib/resend";

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
  if (!channel) {
    logger.warn("[slack-email] skipped — SLACK_EMAIL_CHANNEL unset");
    return false;
  }
  const res = await sendResendEmail(
    { from: opts.from, to: [channel], subject: opts.subject, text: opts.text },
    { label: "slack-email" },
  );
  return res.ok;
}
