/**
 * Server-side verification of an uploaded event banner.
 *
 * The browser hands back a Cloudinary public_id after a signed upload. Nothing
 * about that id is trusted: the asset is looked up with the Admin API, and the
 * stored URL is built from what Cloudinary reports, never from the client.
 *
 *  - The asset must live in the caller's own signed upload folder
 *    (`butwal-hacks/<auth0 sub>/`), so nobody can attach someone else's upload
 *    or an arbitrary image in the account.
 *  - Format must be jpg/png/webp and size at most 5 MB. The client checks the
 *    same rules, but a hand-built request skips the client.
 *
 * One Admin API call per banner save (the free plan allows 500/hour); nothing
 * on the public read path touches it.
 */
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { BANNER_FORMATS, BANNER_MAX_BYTES } from "@/lib/event-banner";
import { logger } from "@/lib/logger";

export type BannerVerification =
  | { ok: true; publicId: string; url: string }
  | { ok: false; error: string };

// Cloudinary public ids: path segments of word characters, dots, dashes and
// the `|` that Auth0 subs carry (github|123). No `..`, no scheme, no query.
const publicIdSchema = z
  .string()
  .min(1)
  .max(300)
  .regex(/^[A-Za-z0-9_|.\-]+(\/[A-Za-z0-9_|.\-]+)*$/)
  .refine((v) => !v.split("/").includes(".."));

function configured(): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return false;
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  }
  return true;
}

interface ResourceInfo {
  public_id: string;
  format?: string;
  bytes?: number;
  secure_url?: string;
  resource_type?: string;
  type?: string;
}

export async function verifyBannerUpload(
  rawPublicId: unknown,
  uploaderSub: string,
): Promise<BannerVerification> {
  const parsed = publicIdSchema.safeParse(rawPublicId);
  if (!parsed.success) return { ok: false, error: "That upload could not be found." };
  const publicId = parsed.data;

  if (!publicId.startsWith(`butwal-hacks/${uploaderSub}/`)) {
    return { ok: false, error: "Banners must be uploaded with the banner uploader." };
  }
  if (!configured()) return { ok: false, error: "Image uploads are not configured." };

  let info: ResourceInfo;
  try {
    info = (await cloudinary.api.resource(publicId, { resource_type: "image" })) as ResourceInfo;
  } catch (error) {
    logger.warn("[events] banner lookup failed", { error: error instanceof Error ? error.message : String(error) });
    return { ok: false, error: "That upload could not be found." };
  }

  if (info.type && info.type !== "upload") {
    return { ok: false, error: "That upload could not be found." };
  }
  const format = (info.format ?? "").toLowerCase();
  if (!(BANNER_FORMATS as readonly string[]).includes(format)) {
    return { ok: false, error: "Banners must be a JPG, PNG or WebP image." };
  }
  if (typeof info.bytes !== "number" || info.bytes > BANNER_MAX_BYTES) {
    return { ok: false, error: "Banners can be at most 5 MB." };
  }
  const url = info.secure_url ?? "";
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!url.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`)) {
    return { ok: false, error: "That upload could not be found." };
  }
  return { ok: true, publicId: info.public_id, url };
}
