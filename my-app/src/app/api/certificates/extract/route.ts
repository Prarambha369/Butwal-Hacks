import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { bustCache } from "@/lib/cache"

/**
 * POST /api/certificates/extract
 *
 * Accepts a Cloudinary URL of a certificate image, sends it to Groq's vision
 * model for OCR/extraction, and creates a trust_marker from the structured data.
 *
 * Request body: { cloudinaryUrl: string }
 * Response: { success: true, marker: { id, title, description, type } }
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.sub

    const extractSchema = z.object({
      cloudinaryUrl: z.string().url("cloudinaryUrl must be a valid URL"),
    })

    let cloudinaryUrl: string
    try {
      const body = await req.json()
      const parsed = extractSchema.parse(body)
      cloudinaryUrl = parsed.cloudinaryUrl
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: "cloudinaryUrl is required and must be a valid URL" }, { status: 400 })
      }
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 })
    }

    // ── 1. Send the certificate image to Groq vision for OCR ──────────
    // ponytail: 30s timeout — AI vision inference takes longer. Falls back gracefully.
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      signal: AbortSignal.timeout(30_000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Extract certificate information from this image.",
                  "Return ONLY a JSON object with these fields (no markdown, no explanation):",
                  "{",
                  '  "title": "Certificate title (max 200 chars)",',
                  '  "issuer": "Organization or person who issued it",',
                  '  "date": "Date issued (YYYY-MM-DD or text description)",',
                  '  "description": "Brief description of what was accomplished (max 500 chars)",',
                  '  "type": "achievement | participation | verification | special_recognition"',
                  "}",
                  "If the date is unclear, use null. If the type is unclear, default to 'achievement'.",
                ].join("\n"),
              },
              {
                type: "image_url",
                image_url: { url: cloudinaryUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!groqRes.ok) {
      const errorText = await groqRes.text()
      logger.error("[certificates/extract] Groq API error:", { status: groqRes.status, body: errorText })
      return NextResponse.json({ error: "AI extraction failed" }, { status: 502 })
    }

    const groqJson = await groqRes.json()
    const raw = groqJson.choices?.[0]?.message?.content?.trim() ?? ""

    // Strip markdown code block wrapping if present
    const cleaned = raw.replace(/```(?:json)?\n?/gi, "").trim()
    let extracted: { title: string; issuer: string; date: string | null; description: string; type: string }

    try {
      extracted = JSON.parse(cleaned)
    } catch {
      logger.error("[certificates/extract] Failed to parse Groq response:", cleaned)
      return NextResponse.json({ error: "Failed to parse extracted data" }, { status: 502 })
    }

    if (!extracted.title || extracted.title.length < 2) {
      return NextResponse.json({ error: "Could not extract a valid certificate title from this image. Try a clearer image." }, { status: 422 })
    }

    // ── 2. Create a trust_marker for this certificate ─────────────────
    const supabase = createServiceClient()

    // Resolve profile UUID for the current user
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, bh_id")
      .eq("auth0_user_id", userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const safeTitle = extracted.title.trim().slice(0, 200)
    const safeDescription = [
      extracted.description?.trim().slice(0, 500),
      extracted.issuer ? `Issued by: ${extracted.issuer.trim().slice(0, 200)}` : null,
      extracted.date ? `Date: ${extracted.date.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" | ")

    const markerType = ["achievement", "participation", "verification", "special_recognition"].includes(extracted.type)
      ? extracted.type
      : "achievement"

    const { data: marker, error: insertError } = await supabase
      .from("trust_markers")
      .insert({
        profile_id: profile.id,
        issuer_id: profile.id, // Self-issued — verified by the certificate image
        title: safeTitle,
        description: safeDescription,
        type: markerType,
      })
      .select("id, title, description, type")
      .single()

    if (insertError) {
      logger.error("[certificates/extract] Failed to create trust_marker:", insertError)
      return NextResponse.json({ error: "Failed to save certificate as trust marker" }, { status: 500 })
    }

    // Bust Redis cache for the user's profile
    await bustCache(`profile:bh_id:${profile.bh_id}`);

    logger.info(`[certificates/extract] Created trust_marker ${marker.id} for user ${userId}: ${safeTitle}`)

    return NextResponse.json({
      success: true,
      marker: {
        id: marker.id,
        title: marker.title,
        description: marker.description,
        issuer: extracted.issuer,
        date: extracted.date,
        type: marker.type,
      },
    })
  } catch (err) {
    logger.error("[certificates/extract] Unexpected error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}, "sensitive")
