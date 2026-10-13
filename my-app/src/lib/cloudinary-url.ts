/**
 * Sized Cloudinary delivery URLs.
 *
 * Stored photo URLs are plain delivery URLs (incoming transforms are baked
 * into the asset at upload). This helper injects a lightweight delivery
 * transform — width cap + auto format/quality — matched to the rendered
 * size. First view per variant costs 1 transformation, then CDN-cached;
 * repeat views cost bandwidth only, at ~10-30% of full-size bytes.
 *
 * Safety: only rewrites our own res.cloudinary.com URLs. Anything else
 * (external URLs, already-transformed URLs) passes through untouched — never
 * feed user-supplied URLs into a fetch-type transform.
 *
 * Video is handled explicitly rather than falling through the image path. An
 * image transform string spliced into a `/video/upload/` URL is either ignored
 * or a 404, and the failure looks like a broken image rather than a bug, so
 * video gets its own detection and its own helpers below.
 */

// A transform segment looks like "w_600,q_auto,f_auto" or "l_logo/..." —
// commas, or known transform prefixes. Version segments look like "v123".
const TRANSFORM_SEGMENT = /[,]|^(w|h|c|q|f|e|l|fl|g|x|y|o|r|a|b|d|p|t|u|w)_/;

const CLOUDINARY_DELIVERY = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/;
const CLOUDINARY_VIDEO_DELIVERY = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/video\/upload\/(.+)$/;

/**
 * Is this a Cloudinary video delivery URL?
 *
 * Detect from the URL rather than trusting `photos.media_type`. The URL is what
 * the browser will actually request, so it is the thing that must not be fed
 * to an image transform — and it is the property that survives a hand-edited
 * row. media_type is the renderer's hint; the URL is the truth.
 */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return CLOUDINARY_VIDEO_DELIVERY.test(url);
}

/**
 * Poster frame for a video, so a gallery tile can render as a still image.
 *
 * Cloudinary derives a still from a video by swapping the delivery path to
 * `.jpg` and adding `so_<n>` to pick the frame. This is what makes 19 videos
 * cost the same as 19 images on first paint instead of forcing the browser to
 * download and decode every video just to draw a thumbnail.
 *
 * `so_0` is the first frame, which for a camera-rolled clip is usually a
 * black frame mid-fade-in. `so_1` is a better default for that reason and
 * costs nothing extra.
 */
export function videoPosterUrl(url: string, width: number, startOffset = 1): string | null {
  if (!isVideoUrl(url)) return null;
  const match = CLOUDINARY_VIDEO_DELIVERY.exec(url);
  if (!match) return null;
  const [, cloud, path] = match;
  // Strip the stored extension; the poster is always .jpg regardless of
  // whether the source was .mov or .mp4.
  const withoutExt = path.replace(/\.[a-z0-9]+$/i, "");
  const w = Number.isFinite(width) && width > 0 ? Math.round(width) : 800;
  return `https://res.cloudinary.com/${cloud}/video/upload/so_${startOffset},w_${w},c_limit,q_auto,f_jpg/${withoutExt}.jpg`;
}

/**
 * Transcoded playback URL for a video.
 *
 * Deliberately NOT `f_auto`: for video that would pick a container the browser
 * may not decode, and the poster/thumbnail path already handles delivery
 * format. vc_h264 + vc_auto_720p keeps the gallery playable everywhere while
 * bounding bandwidth on a phone.
 */
export function videoPlaybackUrl(url: string, width: number): string {
  if (!isVideoUrl(url)) return url;
  const match = CLOUDINARY_VIDEO_DELIVERY.exec(url);
  if (!match) return url;
  const [, cloud, path] = match;
  if (TRANSFORM_SEGMENT.test(path.split("/")[0])) return url;
  const w = Number.isFinite(width) && width > 0 ? Math.round(width) : 800;
  return `https://res.cloudinary.com/${cloud}/video/upload/w_${w},c_limit,vc_h264,q_auto/${path}`;
}

/**
 * Forced-download URL at the stored asset's best quality.
 *
 * Inserts the `fl_attachment` delivery flag — the browser downloads the
 * file with its original name instead of navigating to it. No transforms:
 * the bytes are exactly what was stored at upload (already capped at
 * 1920px + q_auto + watermarked by the signed incoming transform).
 * Costs bandwidth only, zero transformations.
 *
 * Gate: only ever render this for signed-in users (server decides).
 */
export function cloudinaryDownloadUrl(url: string): string {
  if (!url) return url;
  const match = CLOUDINARY_DELIVERY.exec(url) ?? CLOUDINARY_VIDEO_DELIVERY.exec(url);
  if (!match) return url;
  const [, cloud, path] = match;
  if (path.split("/")[0] === "fl_attachment") return url;
  // Preserve the asset type: splicing an image fl_attachment onto a video URL
  // would 404.
  const assetType = CLOUDINARY_VIDEO_DELIVERY.test(url) ? "video" : "image";
  return `https://res.cloudinary.com/${cloud}/${assetType}/upload/fl_attachment/${path}`;
}
/** Fixed recipe set maintainers can apply per photo. No freeform input. */
export const OPTIMIZE_RECIPES = {
  balanced: "q_auto,f_auto",
  eco: "q_auto:eco,f_auto",
  enhanced: "q_auto,f_auto,e_auto_enhance",
} as const;

export type OptimizeRecipe = keyof typeof OPTIMIZE_RECIPES;

// Stored recipes are allowlist-validated before write; re-validated here
// so a hand-edited row can never inject arbitrary transforms into URLs.
const RECIPE_PATTERN = /^q_auto(?::(?:eco|good|best|low))?,f_auto(?:,e_auto_enhance)?$/;

export function isValidRecipe(recipe: string): recipe is string {
  return RECIPE_PATTERN.test(recipe);
}

/**
 * Apply a width transform to a Cloudinary delivery URL, skipping any URL
 * that already carries a transform segment. Shared by displayPhotoUrl for
 * both the default and recipe paths.
 */
function withWidthTransform(url: string, width: number, transform: string): string {
  if (!url || !Number.isFinite(width) || width <= 0) return url;
  const match = CLOUDINARY_DELIVERY.exec(url);
  if (!match) return url;
  const [, cloud, path] = match;
  if (TRANSFORM_SEGMENT.test(path.split("/")[0])) return url;
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${Math.round(width)},${transform}/${path}`;
}

/**
 * Public display URL honoring a maintainer-chosen recipe.
 * Falls back to default sized delivery for null/invalid recipes.
 *
 * For video this returns the POSTER frame, not the video. Callers rendering
 * into an `<img>` (or next/image) need a still; handing them a `.mp4` produces
 * a silently broken tile. Video playback goes through videoPlaybackUrl().
 */
export function displayPhotoUrl(url: string, recipe: string | null, width: number): string {
  if (isVideoUrl(url)) return videoPosterUrl(url, width) ?? url;
  if (!recipe || !isValidRecipe(recipe)) return withWidthTransform(url, width, "q_auto,f_auto");
  return withWidthTransform(url, width, recipe);
}
