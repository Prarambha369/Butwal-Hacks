import { NextResponse } from "next/server"
import { z } from "zod"
import { sanitizeName, sanitizeEmail, sanitizeDescription, rejectOversized } from "@/lib/validation"
import { contactNotificationHtml } from "@/lib/emails/contact-notification"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { captureServerEvent } from "@/lib/analytics/server"
import { posthogLog } from "@/lib/posthog-logger"

const schema = z.object({
  name: z.string().min(2).transform(v => sanitizeName(v)),
  email: z.string().email().transform(v => sanitizeEmail(v) ?? v),
  phone: z.string().optional().transform(v => v ? v.replace(/[<>"'&]/g, "").trim().slice(0, 30) : v),
  subject: z.string().min(5).transform(v => sanitizeName(v)),
  message: z.string().min(10).transform(v => sanitizeDescription(v)),
})

export const POST = withRateLimit(async (request: Request) => {
  try {
    // ponytail: reject oversized payloads before parsing — 1 MB limit
    const oversized = rejectOversized(request); if (oversized) return oversized
    const body = await request.json()
    const data = schema.parse(body)

    const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "hello@butwalhacks.com"

    if (process.env.RESEND_API_KEY) {
      // ponytail: 5s timeout — user-facing contact form. Slow email API shouldn't block the response.
      const res = await fetch("https://api.resend.com/emails", {
        signal: AbortSignal.timeout(5_000),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "contact@butwalhacks.com",
          to: [CONTACT_EMAIL],
          reply_to: data.email,
          subject: `[Contact] ${data.subject}`,
          html: contactNotificationHtml(data.name, data.email, data.phone ?? null, data.subject, data.message),
          text: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone ?? "—"}\n\n${data.message}`,
        }),
      })
      if (!res.ok) throw new Error("Email provider error")
    } else {
      // Fallback until email provider is configured — logs to server
      logger.info("[contact]", { to: CONTACT_EMAIL, from: data.email, subject: data.subject })
    }

    posthogLog.info("Contact form submitted", {
      subject: data.subject,
      has_phone: !!data.phone,
      email: data.email,
    });

    await captureServerEvent('contact_form_submitted', 'anonymous', { has_phone: !!data.phone });
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    posthogLog.error("Contact form failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error("[contact route]", err)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
})
