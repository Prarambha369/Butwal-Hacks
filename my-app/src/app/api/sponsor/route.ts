import { NextResponse } from "next/server"
import { z } from "zod"
import { sanitizeName, sanitizeEmail, sanitizeString, rejectOversized } from "@/lib/validation"
import { sponsorInquiryHtml } from "@/lib/emails/sponsor-inquiry"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { captureServerEvent } from "@/lib/analytics/server"
import { posthogLog } from "@/lib/posthog-logger"

const schema = z.object({
  name: z.string().min(2).transform(v => sanitizeName(v)),
  email: z.string().email().transform(v => sanitizeEmail(v) ?? v),
  company: z.string().min(1).transform(v => sanitizeName(v)),
  tier: z.string().min(1).transform(v => sanitizeString(v, 50)),
  message: z.string().optional().transform(v => v ? sanitizeString(v, 2000) : v),
})

export const POST = withRateLimit(async (request: Request) => {
  try {
    // ponytail: reject oversized payloads before parsing — 1 MB limit
    const oversized = rejectOversized(request); if (oversized) return oversized
    const body = await request.json()
    const data = schema.parse(body)

    const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "hello@butwalhacks.com"

    if (process.env.RESEND_API_KEY) {
      // ponytail: 5s timeout — user-facing sponsor form. Slow email shouldn't block the response.
      const res = await fetch("https://api.resend.com/emails", {
        signal: AbortSignal.timeout(5_000),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "sponsors@butwalhacks.com",
          to: [CONTACT_EMAIL],
          reply_to: data.email,
          subject: `[Sponsor Inquiry] ${data.company} — ${data.tier}`,
          html: sponsorInquiryHtml(data.name, data.email, data.company, data.tier, data.message ?? null),
          text: `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company}\nTier: ${data.tier}\n\n${data.message ?? ""}`,
        }),
      })
      if (!res.ok) throw new Error("Email provider error")
    } else {
      logger.info("[sponsor inquiry]", { to: CONTACT_EMAIL, from: data.email, company: data.company, tier: data.tier })
    }

    posthogLog.info("Sponsor inquiry submitted", {
      company: data.company,
      tier: data.tier,
      email: data.email,
    });

    await captureServerEvent('sponsor_inquiry_submitted', 'anonymous', { tier: data.tier });
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    posthogLog.error("Sponsor inquiry failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error("[sponsor route]", err)
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 })
  }
})
