import { NextResponse } from "next/server"
import { z } from "zod"
import { sanitizeEmail, sanitizeString, escapeHtml } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"

const schema = z.object({
  name: z.string().min(2).transform(v => sanitizeString(v, 100)),
  email: z.string().email().transform(v => sanitizeEmail(v) ?? v),
  company: z.string().min(1).transform(v => sanitizeString(v, 100)),
  tier: z.string().min(1).transform(v => sanitizeString(v, 50)),
  message: z.string().optional().transform(v => v ? sanitizeString(v, 2000) : v),
})

export const POST = withRateLimit(async (request: Request) => {
  try {
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
          from: "sponsors@mail.butwalhacks.com",
          to: [CONTACT_EMAIL],
          reply_to: data.email,
          subject: `[Sponsor Inquiry] ${data.company} — ${data.tier}`,
          // SECURITY: escape HTML to prevent injection in email client rendering
          html: `<h1 style="color:#FE0000;">New Sponsorship Inquiry</h1>
               <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
               <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
               <p><strong>Company:</strong> ${escapeHtml(data.company)}</p>
               <p><strong>Tier:</strong> ${escapeHtml(data.tier)}</p>
               ${data.message ? `<p><strong>Message:</strong> ${escapeHtml(data.message)}</p>` : ""}`.replace(/\s{2,}/g, " "),
          text: `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company}\nTier: ${data.tier}\n\n${data.message ?? ""}`,
        }),
      })
      if (!res.ok) throw new Error("Email provider error")
    } else {
      logger.info("[sponsor inquiry]", { to: CONTACT_EMAIL, from: data.email, company: data.company, tier: data.tier })
    }

    logger.info("Sponsor inquiry submitted", {
      company: data.company,
      tier: data.tier,
      email: data.email,
    });

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    logger.error("Sponsor inquiry failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error("[sponsor route]", err)
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 })
  }
}, "public_form")
