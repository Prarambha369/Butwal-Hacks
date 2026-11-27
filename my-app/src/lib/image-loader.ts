/**
 * next/image loader for the static export (Cloudflare Pages).
 *
 * Cloudflare image resizing needs a paid Cloudflare Images plan, so instead
 * of routing images through /_next/image we let each host size them:
 *
 * - res.cloudinary.com: append `w_<width>,c_limit,f_auto,q_<q|auto>` as the
 *   last transformation, so Cloudinary resizes and picks AVIF/WebP. Existing
 *   transformations in the URL (crops, overlays) are kept and run first.
 * - images.unsplash.com: its own `w`/`q`/`auto=format` query params.
 * - Everything else (files in /public, avatars, SVG): served as is.
 *
 * Wired in next.config.ts only when the build is not on Vercel.
 */

type LoaderArgs = { src: string; width: number; quality?: number };

// One Cloudinary transformation component, e.g. "c_fill,g_face,w_400". Only
// real parameter keys count, so a folder such as "bh_photos" is not mistaken
// for a transformation.
const PARAM =
  "(?:a|ac|af|ar|b|bo|br|c|co|cs|d|dl|dn|dpr|du|e|eo|f|fl|fn|fps|g|h|ki|l|o|p|pg|q|r|so|sp|t|u|vc|vs|w|x|y|z)_[^/,]+";
const TRANSFORMATION_SEGMENT = new RegExp(`^${PARAM}(?:,${PARAM})*$`);

export function cloudinaryUrl(src: string, width: number, quality?: number): string {
  const marker = "/image/upload/";
  const at = src.indexOf(marker);
  if (at === -1) return src;

  const head = src.slice(0, at + marker.length);
  const segments = src.slice(at + marker.length).split("/");
  let i = 0;
  while (i < segments.length - 1 && TRANSFORMATION_SEGMENT.test(segments[i])) i++;

  const ours = `w_${width},c_limit,f_auto,q_${quality ?? "auto"}`;
  return head + [...segments.slice(0, i), ours, ...segments.slice(i)].join("/");
}

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  let url: URL | null = null;
  try {
    url = new URL(src);
  } catch {
    return src; // relative path → static file from /public
  }

  if (url.hostname === "res.cloudinary.com") return cloudinaryUrl(src, width, quality);

  if (url.hostname === "images.unsplash.com") {
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    return url.toString();
  }

  return src;
}
