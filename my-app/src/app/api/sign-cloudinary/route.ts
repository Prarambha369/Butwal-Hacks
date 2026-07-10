import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { rejectOversized } from "@/lib/validation"

/**
 * POST /api/sign-cloudinary
 *
 * Generates a Cloudinary upload signature for client-side uploads.
 * Requires authentication — only logged-in users can upload media.
 *
 * Response:
 *   { signature, timestamp, cloudName, apiKey, folder }
 *
 * The client uses these values to POST directly to Cloudinary's upload API
 * (https://api.cloudinary.com/v1_1/{cloudName}/auto/upload).
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

    const timestamp = Math.round(Date.now() / 1000)
    const folder = `butwal-hacks/${userId}`

    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, ...(uploadPreset ? { upload_preset: uploadPreset } : {}) },
      apiSecret,
    )

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
      ...(uploadPreset ? { uploadPreset } : {}),
    })
  } catch (error) {
    logger.error("Cloudinary signature error:", error)
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 },
    )
  }
})
