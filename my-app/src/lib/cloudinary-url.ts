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
 * format. vc_h264 keeps the gallery playable everywhere while bounding
 * bandwidth on a phone.
 *
 * The `.mp4` extension is forced, and that is load-bearing rather than
 * cosmetic. The Daydream clips were uploaded as `.mov`, so Cloudinary stores
 * them with that extension and serves `Content-Type: video/quicktime;codecs=avc1`.
 * Firefox refuses H.264 in a QuickTime container outright — the <video> element
 * fails with "No video with supported format and MIME type found" while Chrome
 * and Safari happily play it, so the bug looks browser-specific and passes a
 * casual test. Asking Cloudinary for the same asset as `.mp4` returns
 * `video/mp4;codecs=avc1`, which every browser accepts. Do not "simplify" this
 * back to passing the stored extension through.
 *
 * `c_limit` is deliberately absent: it needs both dimensions to constrain
 * anything, and with width alone it is a byte-for-byte no-op on these assets.
 */
export function videoPlaybackUrl(url: string, width: number): string {
  if (!isVideoUrl(url)) return url;
  const match = CLOUDINARY_VIDEO_DELIVERY.exec(url);
  if (!match) return url;
  const [, cloud, path] = match;
  if (TRANSFORM_SEGMENT.test(path.split("/")[0])) return url;
  const w = Number.isFinite(width) && width > 0 ? Math.round(width) : 800;
  const asMp4 = path.replace(/\.[a-z0-9]+$/i, "") + ".mp4";
  return `https://res.cloudinary.com/${cloud}/video/upload/w_${w},vc_h264,q_auto/${asMp4}`;
}

/**
 * Ordered `<source>` list for a gallery `<video>`: H.264 MP4 first, VP9 WebM
 * as the fallback.
 *
 * A correct `video/mp4;codecs=avc1` response is still not enough everywhere.
 * Firefox on Linux decodes H.264 through the system's ffmpeg/libavcodec, and
 * when that library is missing or a version it does not support (common on
 * rolling distros and in sandboxed builds) it shows the same "No video with
 * supported format and MIME type found" error. VP9 is decoded by the browser
 * itself, so it always works there.
 *
 * The codecs parameter on the MP4 `type` is what makes this work:
 * `canPlayType` then reports whether an H.264 decoder actually exists, and a
 * browser without one skips straight to the WebM. Every other browser stops at
 * the MP4, so the WebM rendition (an on-the-fly transcode) is only generated
 * for the viewers who need it.
 */
export function videoSources(url: string, width: number): { src: string; type?: string }[] {
  const mp4 = videoPlaybackUrl(url, width);
  if (mp4 === url) return [{ src: url }];
  const webm = mp4.replace(",vc_h264,", ",vc_vp9,").replace(/\.mp4$/, ".webm");
  return [
    { src: mp4, type: 'video/mp4; codecs="avc1.42E01E"' },
    { src: webm, type: 'video/webm; codecs="vp9"' },
  ];
}

/**
 * Social-preview card URL: a 1200×630 JPEG crop for Open Graph and Twitter.
 *
 * Deliberately not `f_auto`. `f_auto` negotiates the format from the
 * requester's Accept header, and the requester here is a link-preview crawler
 * (Slack, X, WhatsApp, Facebook), not a browser — several of them reject or
 * mishandle WebP/AVIF and fall back to a blank card. A fixed `f_jpg` is the one
 * format every scraper decodes, and the card is fetched once per share, so the
 * extra bytes do not matter.
 *
 * `g_auto` picks the subject for the crop rather than slicing the middle out
 * of a group photo. Video resolves to its `so_1` poster frame for the same
 * reason videoPosterUrl exists: an Open Graph image has to be a still.
 *
 * Already-transformed URLs keep their transforms and get the card crop
 * chained after them, so the final c_fill and f_jpg make the reported
 * 1200×630 JPEG true either way (an image passed through as `w_600,f_auto`
 * would be neither). Video additionally resolves to a poster frame, because
 * passing an .mp4 through would put a video in og:image.
 */
export function socialCardUrl(url: string): { url: string; width: number; height: number } | null {
  const width = 1200;
  const height = 630;
  if (!url) return null;

  const video = CLOUDINARY_VIDEO_DELIVERY.exec(url);
  if (video) {
    const [, cloud, path] = video;
    // A video can never pass through as-is: og:image must be an image. Keep
    // any hand-applied transforms and chain the poster crop after them, so the
    // final c_fill makes the reported 1200×630 true either way.
    const segments = path.split("/");
    let t = 0;
    while (t < segments.length - 1 && TRANSFORM_SEGMENT.test(segments[t])) t++;
    const chain = segments.slice(0, t).map((s) => `${s}/`).join("");
    const withoutExt = segments.slice(t).join("/").replace(/\.[a-z0-9]+$/i, "");
    return {
      url: `https://res.cloudinary.com/${cloud}/video/upload/${chain}so_1,c_fill,g_auto,w_${width},h_${height},f_jpg,q_auto:good/${withoutExt}.jpg`,
      width,
      height,
    };
  }

  const image = CLOUDINARY_DELIVERY.exec(url);
  if (!image) return null;
  const [, cloud, path] = image;
  const segments = path.split("/");
  let t = 0;
  while (t < segments.length - 1 && TRANSFORM_SEGMENT.test(segments[t])) t++;
  const chain = segments.slice(0, t).map((s) => `${s}/`).join("");
  const rest = segments.slice(t).join("/");
  return {
    url: `https://res.cloudinary.com/${cloud}/image/upload/${chain}c_fill,g_auto,w_${width},h_${height},f_jpg,q_auto:good/${rest}`,
    width,
    height,
  };
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
  if (CLOUDINARY_VIDEO_DELIVERY.test(url)) {
    // Videos download as an H.264 .mp4 at full resolution instead of the
    // stored original: a 61 MB camera .mov becomes ~3 MB and opens on every
    // phone. Same .mp4-not-.mov reasoning as videoPlaybackUrl. A URL that
    // already carries transforms is left alone rather than stacked.
    if (TRANSFORM_SEGMENT.test(path.split("/")[0])) return url;
    const asMp4 = path.replace(/\.[a-z0-9]+$/i, "") + ".mp4";
    return `https://res.cloudinary.com/${cloud}/video/upload/fl_attachment/vc_h264,q_auto/${asMp4}`;
  }
  return `https://res.cloudinary.com/${cloud}/image/upload/fl_attachment/${path}`;
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

/**
 * next/image loader that asks Cloudinary for each srcset width directly.
 *
 * Without it, next/image routed every gallery image through Vercel's image
 * optimizer: the browser fetched /_next/image, Vercel pulled the Cloudinary
 * file, re-encoded it, and sent it on — two transfers and an optimizer charge
 * per image, for bytes Cloudinary already resizes and format-negotiates
 * (q_auto,f_auto) at its own CDN edge. The optimizer's srcset also reaches
 * 3840w on a wide retina screen; `maxWidth` caps what we ever request.
 *
 * Non-Cloudinary URLs come back unchanged (displayPhotoUrl passes them through).
 */
export function cloudinaryImageLoader(
  recipe: string | null,
  maxWidth: number,
): (p: { src: string; width: number }) => string {
  return ({ src, width }) => displayPhotoUrl(src, recipe, Math.min(width, maxWidth));
}
