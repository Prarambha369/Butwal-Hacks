import { Hono } from "https://deno.land/x/hono@v3.12.11/mod.ts";

const app = new Hono();

/**
 * Resend Email Edge Function
 *
 * Centralized transactional email service using Resend API.
 * Supports multiple email types via the `type` field in the payload.
 *
 * POST /send
 * Body: {
 *   type: "contact" | "sponsor" | "marker_claim" | "welcome" | "custom",
 *   to: string | string[],
 *   subject: string,
 *   // type-specific fields:
 *   name?: string,
 *   email?: string,
 *   company?: string,
 *   tier?: string,
 *   message?: string,
 *   phone?: string,
 *   issuerName?: string,
 *   markerTitle?: string,
 *   claimUrl?: string,
 *   // custom type:
 *   html?: string,
 *   text?: string,
 * }
 *
 * ponytail: No email template engine — inline HTML builders for each type.
 * Upgrade path: Add React Email / MJML for richer templates.
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const DEFAULT_FROM = "Butwal Hacks <noreply@butwalhacks.com>";
const CONTACT_EMAIL = Deno.env.get("CONTACT_EMAIL") ?? "hello@butwalhacks.com";

// ─── Template Builders ───────────────────────────────────────────────────────

function contactHtml(name: string, email: string, phone: string | null, subject: string, message: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family:sans-serif;padding:32px;background:#f5f5f5;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px;">
    <h2 style="margin:0 0 20px;font-size:20px;">New Contact Form Submission</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#666;">Name</td><td style="font-weight:600;">${name}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Email</td><td style="font-weight:600;">${email}</td></tr>
      ${phone ? `<tr><td style="padding:8px 0;color:#666;">Phone</td><td style="font-weight:600;">${phone}</td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#666;">Subject</td><td style="font-weight:600;">${subject}</td></tr>
    </table>
    <hr style="margin:20px 0;border:none;border-top:1px solid #eee;" />
    <p style="color:#333;line-height:1.6;">${message}</p>
  </div>
</body></html>`;
}

function sponsorHtml(name: string, email: string, company: string, tier: string, message: string | null): string {
  return `<!DOCTYPE html>
<html><body style="font-family:sans-serif;padding:32px;background:#f5f5f5;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px;">
    <h2 style="margin:0 0 20px;font-size:20px;">New Sponsorship Inquiry</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#666;">Name</td><td style="font-weight:600;">${name}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Email</td><td style="font-weight:600;">${email}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Company</td><td style="font-weight:600;">${company}</td></tr>
      <tr><td style="padding:8px 0;color:#666;">Tier</td><td style="font-weight:600;">${tier}</td></tr>
    </table>
    ${message ? `<hr style="margin:20px 0;border:none;border-top:1px solid #eee;" /><p style="color:#333;">${message}</p>` : ""}
  </div>
</body></html>`;
}

function markerClaimHtml(recipientEmail: string, issuerName: string, markerTitle: string, description: string | null, claimUrl: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#242424;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#242424;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#434343;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:40px 32px 32px;text-align:center;">
          <h1 style="margin:0;font-size:22px;color:#fff;">You've Received a Trust Marker</h1>
          <p style="margin:8px 0 0;color:#898989;">${issuerName} issued you a credential on Butwal Hacks.</p>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <table width="100%" style="background:#242424;border-radius:12px;border:1px solid #656565;">
            <tr><td style="padding:20px;">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;color:#898989;">Credential</p>
              <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#fff;">${markerTitle}</p>
              ${description ? `<p style="margin:12px 0 0;color:#d6d6d6;">${description}</p>` : ""}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:32px;text-align:center;">
          <a href="${claimUrl}" style="display:inline-block;background:#FE0000;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 24px;border-radius:9999px;">Claim Your Trust Marker</a>
          <p style="margin:16px 0 0;font-size:12px;color:#898989;">The link expires in 7 days.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function welcomeHtml(name: string, bhId: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#242424;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#242424;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#434343;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:40px 32px;text-align:center;">
          <h1 style="margin:0;font-size:22px;color:#fff;">Welcome to Butwal Hacks!</h1>
          <p style="margin:12px 0 0;color:#d6d6d6;line-height:1.6;">
            Hey ${name}, your hacker profile is ready.<br />
            Your BH-ID: <strong style="color:#FE0000;">${bhId}</strong>
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <a href="https://butwalhacks.com/dashboard" style="display:inline-block;background:#FE0000;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 24px;border-radius:9999px;">Go to Dashboard</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─── Email Sender ────────────────────────────────────────────────────────────

async function sendEmail(payload: {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
}): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: payload.from ?? DEFAULT_FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? undefined,
      reply_to: payload.reply_to ?? undefined,
    }),
  });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.post("/send", async (c) => {
  try {
    if (!RESEND_API_KEY) {
      return c.json({ error: "RESEND_API_KEY not configured" }, 500);
    }

    const body = await c.req.json();
    const { type, to, subject, name, email, phone, company, tier, message, issuerName, markerTitle, claimUrl, html, text } = body;

    if (!type || !to || !subject) {
      return c.json({ error: "type, to, and subject are required" }, 400);
    }

    let emailHtml: string;
    let emailText: string | undefined;
    let replyTo: string | undefined;

    switch (type) {
      case "contact": {
        const contactName = name ?? "Anonymous";
        const contactEmail = email ?? "unknown@example.com";
        emailHtml = contactHtml(contactName, contactEmail, phone ?? null, subject, message ?? "");
        emailText = `Name: ${contactName}\nEmail: ${contactEmail}\nPhone: ${phone ?? "—"}\n\n${message ?? ""}`;
        replyTo = contactEmail;
        break;
      }

      case "sponsor": {
        const sponsorName = name ?? "Anonymous";
        const sponsorEmail = email ?? "unknown@example.com";
        const sponsorCompany = company ?? "Unknown";
        const sponsorTier = tier ?? "Unknown";
        emailHtml = sponsorHtml(sponsorName, sponsorEmail, sponsorCompany, sponsorTier, message ?? null);
        emailText = `Name: ${sponsorName}\nEmail: ${sponsorEmail}\nCompany: ${sponsorCompany}\nTier: ${sponsorTier}\n\n${message ?? ""}`;
        replyTo = sponsorEmail;
        break;
      }

      case "marker_claim": {
        const rcptEmail = to as string;
        const issuer = issuerName ?? "Butwal Hacks";
        const marker = markerTitle ?? "Trust Marker";
        const claim = claimUrl ?? "https://butwalhacks.com";
        emailHtml = markerClaimHtml(rcptEmail, issuer, marker, message ?? null, claim);
        emailText = `You've received a Trust Marker from ${issuer}: ${marker}\n\nClaim it here: ${claim}`;
        break;
      }

      case "welcome": {
        const userName = name ?? "Hacker";
        const bhId = message ?? "BH-25-001";
        emailHtml = welcomeHtml(userName, bhId);
        emailText = `Welcome to Butwal Hacks, ${userName}! Your BH-ID is ${bhId}.`;
        break;
      }

      case "custom": {
        emailHtml = html ?? "<p>No content</p>";
        emailText = text ?? undefined;
        break;
      }

      default:
        return c.json({ error: `Unknown email type: ${type}` }, 400);
    }

    const res = await sendEmail({
      to,
      subject,
      html: emailHtml,
      text: emailText,
      reply_to: replyTo,
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[resend-email] API error:", res.status, errBody);
      return c.json({ error: "Failed to send email" }, 502);
    }

    const result = await res.json();
    return c.json({ ok: true, id: result.id, type });
  } catch (err) {
    console.error("[resend-email] Error:", err);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "resend-email" }));

Deno.serve(app.fetch);
