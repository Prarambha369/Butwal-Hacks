export { twMerge as cn } from "tailwind-merge"

/**
 * Applies Cloudinary automatic optimization transforms to an image URL.
 *
 * @param url - The image URL to optimize.
 * @param width - The requested transformation width.
 * @returns The transformed Cloudinary URL, or the original URL when it is not a supported Cloudinary URL.
 */
export function cloudinaryUrl(url: string | null | undefined, width = 800): string {
  if (!url || !url.includes("res.cloudinary.com")) return url ?? "";
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return `${url.slice(0, idx + marker.length)}q_auto,f_auto,w_${width}/${url.slice(idx + marker.length)}`;
}
