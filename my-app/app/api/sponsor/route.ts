import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(1),
  tier: z.string().min(1),
  message: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "hello@butwalhacks.com"

    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
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
          text: `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company}\nTier: ${data.tier}\n\n${data.message ?? ""}`,
        }),
      })
      if (!res.ok) throw new Error("Email provider error")
    } else {
      console.info("[sponsor inquiry]", { to: CONTACT_EMAIL, from: data.email, company: data.company, tier: data.tier })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    console.error("[sponsor route]", err)
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 })
  }
}
