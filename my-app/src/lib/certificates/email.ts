import { sendResendEmail } from "@/lib/resend";
import { logger } from "@/lib/logger";
import { SITE_URL } from "@/lib/constants";

/**
 * Certificate delivery email.
 *
 * Deliberately NOT a PDF attachment. Two reasons:
 *
 *  1. Resend's attachment path is not what we want here, and a personalised
 *     PDF per recipient is better generated on demand from the template than
 *     rendered at send time — a template fix then applies to every message
 *     still queued, instead of leaving stale artwork inside sent mail.
 *  2. The link is the durable artefact. An emailed PDF is a file that can be
 *     forwarded, edited and re-uploaded; a link to a signed verification page
 *     stays checkable forever and reflects revocation.
 *
 * The existing `lib/ghost-marker-email.ts` attaches a PDF, so this is a
 * deliberate difference rather than an oversight.
 */

const FROM = "Butwal Hacks <notifications@butwalhacks.com>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type CertificateEmailInput = {
  to: string;
  name?: string | null;
  verifyUrl: string;
  eventId?: string;
  certificateId?: string;
};

export type CertificateEmailResult = { ok: boolean; error?: string; status?: number };

export function buildCertificateEmail(input: CertificateEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greetingName = input.name?.trim();
  const subject = "Your Butwal Hacks certificate";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf9f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">
            <tr>
              <td style="background:#fe0000;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.02em;">Butwal Hacks</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#1c1917;">
                  ${greetingName ? `Congratulations, ${escapeHtml(greetingName)}` : "Congratulations"}
                </h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#44403c;">
                  Your certificate of participation is ready. Anyone can confirm it is genuine using the
                  link below &mdash; no account or sign-in needed.
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${escapeHtml(input.verifyUrl)}"
                     style="display:inline-block;background:#fe0000;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 22px;border-radius:999px;">
                    View my certificate
                  </a>
                </p>
                <p style="margin:0 0 8px;font-size:12px;color:#78716c;">
                  If the button does not work, copy this address into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
                  <a href="${escapeHtml(input.verifyUrl)}" style="color:#b91c1c;">${escapeHtml(input.verifyUrl)}</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#78716c;">
                  Keep this link. It is the permanent record of your award, and it will show the
                  certificate as revoked if we ever have to withdraw it.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f5f5f4;border-top:1px solid #e7e5e4;">
                <p style="margin:0;font-size:11px;color:#a8a29e;">
                  Butwal Hacks &middot; ${escapeHtml(SITE_URL)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    greetingName ? `Congratulations, ${greetingName}` : "Congratulations",
    "",
    "Your certificate of participation is ready. Anyone can confirm it is genuine",
    "using the link below — no account or sign-in needed.",
    "",
    input.verifyUrl,
    "",
    "Keep this link. It is the permanent record of your award.",
    "",
    `Butwal Hacks · ${SITE_URL}`,
  ].join("\n");

  return { subject, html, text };
}

export async function sendCertificateEmail(
  input: CertificateEmailInput,
): Promise<CertificateEmailResult> {
  if (!input.to || !input.to.includes("@")) {
    return { ok: false, error: "recipient has no usable email address" };
  }

  const { subject, html, text } = buildCertificateEmail(input);

  const res = await sendResendEmail(
    { from: FROM, to: [input.to], subject, html, text },
    { timeoutMs: 10_000, label: "certificate" },
  );

  if (!res.ok) {
    logger.warn("[certificate] resend rejected", { to: input.to, status: res.status });
    return {
      ok: false,
      status: res.status,
      error: res.status === 0 ? "email transport unavailable or timed out" : `email rejected: ${res.status}`,
    };
  }

  return { ok: true, status: res.status };
}
