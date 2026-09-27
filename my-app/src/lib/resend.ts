import { logger } from "@/lib/logger";

/**
 * sendResendEmail — single Resend transport for every server-side email.
 *
 * All five call sites previously inlined the same fetch: same URL, same
 * Authorization header, same JSON body, same `AbortSignal.timeout`. Only
 * `from`, `timeout`, and the error policy differ, so those stay parameters.
 *
 * Never throws. Returns `ok` plus the HTTP status so callers can branch on
 * delivery (the error-report route surfaces it to the client; the rest log).
 */

export interface ResendEmail {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
}

export interface ResendResult {
  ok: boolean;
  status: number;
}

export async function sendResendEmail(
  email: ResendEmail,
  opts: { timeoutMs?: number; label?: string } = {},
): Promise<ResendResult> {
  const { timeoutMs = 5_000, label = "resend" } = opts;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, status: 0 };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      signal: AbortSignal.timeout(timeoutMs),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(email),
    });
    if (!res.ok) logger.warn(`[${label}] resend rejected`, res.status);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    logger.error(`[${label}] send failed`, err instanceof Error ? err.message : err);
    return { ok: false, status: 0 };
  }
}
