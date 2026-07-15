import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"

/**
 * POST /api/cloudinary-signature
 *
 * Generates a Cloudinary upload signature for client-side uploads.
 * Accepts optional metadata fields for backend moderation and filtering.
 * Requires authentication — only logged-in users can upload media.
 *
 * Request body (JSON):
 *   entity_type?: "avatar" | "event_banner" | "project_cover" | "blog_cover" | "gallery_photo"
 *   bh_id?: string          — BH-ID of the user (e.g. "BH-24-001")
 *   event_slug?: string     — Event slug for event-related uploads
 *   project_id?: string     — Project UUID for project cover images
 *   uploader_auth0_id?: string — Auth0 user ID of the uploader
 *
 * Response:
 *   { signature, timestamp, cloudName, apiKey, folder, metadata, uploadPreset? }
 */
export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.sub

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 500 },
      )
    }

    // Lazy config — skips re-configuration on warm serverless invocations
    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      })
    }

    // Parse optional metadata fields from request body
    let metadata: Record<string, string> = {}
    try {
      const body = await request.json()
      const { entity_type, bh_id, event_slug, project_id, uploader_auth0_id } = body
      metadata = { entity_type, bh_id, event_slug, project_id, uploader_auth0_id }
      // Strip undefined values
      for (const key of Object.keys(metadata)) {
        if (!metadata[key]) delete metadata[key]
      }
    } catch {
      // No body or invalid JSON — proceed without metadata
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = `butwal-hacks/${userId}`

    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    // Build params to sign — include metadata if present
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
      ...(uploadPreset ? { upload_preset: uploadPreset } : {}),
    }

    // Stringified metadata for Cloudinary structured metadata
    const metadataStr = Object.keys(metadata).length > 0
      ? JSON.stringify(metadata)
      : undefined

    if (metadataStr) {
      paramsToSign.metadata = metadataStr
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    )

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
      ...(uploadPreset ? { uploadPreset } : {}),
      ...(metadataStr ? { metadata: metadataStr } : {}),
    })
  } catch (error) {
    logger.error("Cloudinary signature error:", error)
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 },
    )
  }
}, "frequent")
