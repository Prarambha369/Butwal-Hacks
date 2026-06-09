import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(5),
  message: z.string().min(10),
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
          from: "contact@butwalhacks.com",
          to: [CONTACT_EMAIL],
          reply_to: data.email,
          subject: `[Contact] ${data.subject}`,
          text: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone ?? "—"}\n\n${data.message}`,
        }),
      })
      if (!res.ok) throw new Error("Email provider error")
    } else {
      // Fallback until email provider is configured — logs to server
      console.info("[contact]", { to: CONTACT_EMAIL, from: data.email, subject: data.subject })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    console.error("[contact route]", err)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
