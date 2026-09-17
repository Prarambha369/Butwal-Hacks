/**
 * Sized Cloudinary delivery URLs.
 *
 * Stored photo URLs are plain delivery URLs (incoming transforms are baked
 * into the asset at upload). This helper injects a lightweight delivery
 * transform — width cap + auto format/quality — matched to the rendered
 * size. First view per variant costs 1 transformation, then CDN-cached;
 * repeat views cost bandwidth only, at ~10-30% of full-size bytes.
 *
 * Safety: only rewrites our own res.cloudinary.com image URLs. Anything
 * else (videos, external URLs, already-transformed URLs) passes through
 * untouched — never feed user-supplied URLs into a fetch-type transform.
 */

const CLOUDINARY_DELIVERY = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/;

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
  const match = CLOUDINARY_DELIVERY.exec(url);
  if (!match) return url;
  const [, cloud, path] = match;
  if (path.split("/")[0] === "fl_attachment") return url;
  return `https://res.cloudinary.com/${cloud}/image/upload/fl_attachment/${path}`;
}
// A transform segment looks like "w_600,q_auto,f_auto" or "l_logo/..." —
// commas, or known transform prefixes. Version segments look like "v123".
const TRANSFORM_SEGMENT = /[,]|^(w|h|c|q|f|e|l|fl|g|x|y|o|r|a|b|d|p|t|u|w)_/;

export function cloudinaryUrl(url: string, width: number): string {
  if (!url || !Number.isFinite(width) || width <= 0) return url;
  const match = CLOUDINARY_DELIVERY.exec(url);
  if (!match) return url;
  const [, cloud, path] = match;
  const [first] = path.split("/");
  // Already carries a transform (or an unrecognized shape) — leave alone.
  if (TRANSFORM_SEGMENT.test(first)) return url;
  const w = Math.round(width);
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},q_auto,f_auto/${path}`;
}
