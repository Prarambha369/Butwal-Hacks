import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"
import { z } from "zod"
import { auth0 } from "@/lib/auth0"
import { encodeCloudinaryMetadata, pickDefinedMetadata } from "@/lib/cloudinary-metadata"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { createServiceClient } from "@/utils/supabase"

/**
 * External IDs of the structured metadata fields that exist in this product
 * environment, cached per instance. Cloudinary rejects an upload whose
 * `metadata` names an undefined field, and a misconfigured console must not
 * cost a member their profile picture — so the payload is filtered against
 * this set and dropped entirely if the lookup fails.
 */
const FIELD_CACHE_TTL_MS = 10 * 60 * 1000
let fieldCache: { ids: Set<string>; at: number } | null = null

async function definedMetadataIds(): Promise<Set<string> | null> {
  if (fieldCache && Date.now() - fieldCache.at < FIELD_CACHE_TTL_MS) {
    return fieldCache.ids
  }
  try {
    const result = await cloudinary.api.list_metadata_fields()
    const ids = new Set(result.metadata_fields.map((field) => field.external_id))
    fieldCache = { ids, at: Date.now() }
    return ids
  } catch (error) {
    logger.error("Cloudinary metadata field lookup failed:", error)
    return null
  }
}

/**
 * POST /api/cloudinary-signature
 *
 * Generates a Cloudinary upload signature for client-side uploads.
 * Accepts optional metadata fields for backend moderation and filtering.
 * Requires authentication — only logged-in users can upload media.
 *
 * Request body (JSON):
 *   entity_type?: "avatar" | "event_banner" | "project_cover" | "blog_cover" | "gallery_photo" | "gallery_video"
 *   bh_id?: string          — BH-ID of the user (e.g. "BH-24-001"); kept only
 *                             when it matches the signed-in profile
 *   event_slug?: string     — Event slug for event-related uploads
 *   project_id?: string     — Project UUID for project cover images
 *
 * `uploader_auth0_id` is not accepted from the client. It is derived from the
 * session, so an upload can never be attributed to another member.
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

    // Parse and validate optional metadata fields
    const metadataSchema = z.object({
      entity_type: z.enum(["avatar", "event_banner", "project_cover", "blog_cover", "gallery_photo", "gallery_video", "sponsor_logo"]).optional(),
      bh_id: z.string().max(20).optional(),
      event_slug: z.string().max(200).optional(),
      project_id: z.string().uuid().optional(),
    })

    const metadata: Record<string, string> = {}
    try {
      const body = await request.json()
      const valid = metadataSchema.parse(body)
      for (const [key, value] of Object.entries(valid)) {
        if (value) {
          metadata[key] = value
        }
      }
    } catch {
      // Zod error or parse failure — proceed without metadata
    }

    // Identity is server-derived. `uploader_auth0_id` used to be accepted from
    // the request body, which let any signed-in member attribute an upload to
    // someone else; the session is the only source of truth here.
    metadata.uploader_auth0_id = userId

    // `bh_id` is a public identifier, so a client can type any member's BH-ID.
    // Keep the supplied value only when it matches the signed-in user's stored
    // profile. Every failure path (lookup error, missing row, mismatch) drops
    // the field rather than failing the upload — metadata must never cost a
    // member their upload. The session check above is the authorization for
    // the service-role client below.
    if (metadata.bh_id) {
      try {
        const supabase = createServiceClient()
        const { data, error } = await supabase
          .from("profiles")
          .select("bh_id")
          .eq("auth0_user_id", userId)
          .maybeSingle()
        const stored = data as { bh_id?: string | null } | null
        if (error) {
          logger.error("Cloudinary bh_id lookup failed:", error)
          delete metadata.bh_id
        } else if (!stored || stored.bh_id !== metadata.bh_id) {
          delete metadata.bh_id
        }
      } catch (error) {
        logger.error("Cloudinary bh_id lookup failed:", error)
        delete metadata.bh_id
      }
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = `butwal-hacks/${userId}`

    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    // Gallery photos: one signed incoming transformation does four jobs —
    // cap phone-photo dimensions, cut bytes, bake the logo watermark, and
    // strip EXIF/GPS. One transformation per upload (~0.001 credits);
    // delivery of the stored asset costs nothing extra. Signed, so members
    // can neither strip the watermark nor invent their own transforms.
    // Overlay public_id uses ":" for "/" (butwal-hacks/watermark).
    //
    // Ordering matters and is not cosmetic. Cloudinary requires positioning
    // params to sit in the `fl_layer_apply` component, NOT in the layer
    // component. With them in the layer component the request still returns
    // HTTP 200 with a correctly resized image and NO watermark — a silent
    // failure that looks like a successful upload. Verified against
    // res.cloudinary.com: see __tests__/cloudinary-watermark.test.ts.
    const galleryTransformation = [
      "w_1920,c_limit,q_auto:good",
      "l_butwal-hacks:watermark,w_140",
      "fl_layer_apply,g_south_east,x_24,y_24,o_65",
    ].join("/")

    // Video: same jobs, different mechanics.
    //
    //  - `vc_h264` forces an H.264 rendition so the browser can play it; .mov
    //    from an iPhone is ProRes/HEVC and will not play in Chrome or Firefox
    //    without it.
    //  - `vc_auto` lets Cloudinary pick the resolution from `w_`, keeping
    //    phone-shot 4K clips from being stored at full size.
    //  - `so_auto` renders the watermark across the WHOLE timeline. A bare
    //    `o_65`/overlay on video defaults to appearing only for a single
    //    frame's worth of time, which produces a logo that blinks in and out.
    const galleryVideoTransformation = [
      "w_1920,c_limit,vc_h264,vc_auto,q_auto",
      "l_butwal-hacks:watermark,w_140",
      "fl_layer_apply,g_south_east,x_24,y_24,o_65,so_auto",
    ].join("/")
    const transformation = metadata.entity_type === "gallery_photo"
      ? galleryTransformation
      : metadata.entity_type === "gallery_video"
        ? galleryVideoTransformation
        : undefined

    // Video is a separate resource_type. Signing an image upload for a .mov
    // makes Cloudinary store it as `image/upload` with a video extension, and
    // every /video/upload delivery transform then 404s.
    const resourceType = metadata.entity_type === "gallery_video" ? "video" : "image"

    // Build params to sign — include metadata if present
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
      ...(uploadPreset ? { upload_preset: uploadPreset } : {}),
      ...(transformation ? { transformation } : {}),
    }
    // NOTE: resource_type is deliberately NOT signed. Cloudinary takes it from
    // the endpoint path (/v1_1/<cloud>/<resource_type>/upload) and excludes it
    // from the string-to-sign. Including it here yields "Invalid Signature"
    // for every upload. It is returned to the client below purely so the
    // browser knows which endpoint to POST to.

    // Structured metadata travels as `external_id=value|external_id=value`,
    // not JSON, and only for fields this environment actually defines.
    const knownFields = await definedMetadataIds()
    const attachedMetadata = knownFields
      ? pickDefinedMetadata(metadata, knownFields)
      : {}
    const metadataStr = Object.keys(attachedMetadata).length > 0
      ? encodeCloudinaryMetadata(attachedMetadata)
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
      resourceType,
      ...(uploadPreset ? { uploadPreset } : {}),
      ...(transformation ? { transformation } : {}),
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
