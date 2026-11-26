/**
 * Event banner rules, shared by the uploader (client) and the save actions
 * (server) so both refuse the same files.
 *
 * Banners are 16:9. The uploader crops to that before upload; older banners
 * of any shape are framed with `object-cover` in a fixed 16:9 box, so the
 * page never shifts.
 */
import { cloudinaryImageLoader } from "@/lib/cloudinary-url";

export const BANNER_MAX_BYTES = 5 * 1024 * 1024;
export const BANNER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** The same set as Cloudinary reports `format` (jpeg is stored as jpg). */
export const BANNER_FORMATS = ["jpg", "png", "webp"] as const;
export const BANNER_ACCEPT = BANNER_MIME_TYPES.join(",");
export const BANNER_ASPECT = 16 / 9;
/** Recommended source size, shown as the crop hint. */
export const BANNER_RECOMMENDED = "1920 × 1080";

export function bannerFileError(file: { type: string; size: number }): string | null {
  if (!(BANNER_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Banners must be a JPG, PNG or WebP image.";
  }
  if (file.size > BANNER_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `This image is ${mb} MB. Banners can be at most 5 MB.`;
  }
  return null;
}

/**
 * next/image loader for banners: Cloudinary resizes each srcset width itself
 * (`w_<n>,q_auto,f_auto`), so Vercel's optimizer is never involved. Widths
 * above 1600 collapse to one URL, which caps the derived variants per banner
 * and keeps the free-plan transformation count small.
 */
export const bannerLoader = cloudinaryImageLoader(null, 1600);

/** True for a URL the banner loader can resize (our Cloudinary delivery URLs). */
export function isCloudinaryImage(url: string | null | undefined): url is string {
  return typeof url === "string" && /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url);
}
