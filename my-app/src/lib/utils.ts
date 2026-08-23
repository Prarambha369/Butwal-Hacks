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

/**
 * Build a generic DiceBear placeholder URL for any style.
 * Defaults to `shapes` (abstract geometric patterns), which is appropriate
 * for photo/image fallbacks. For avatars, use `getDiceBearUrl` which uses
 * the `avataaars` style.
 *
 * @param seed - Deterministic seed string (photo ID, name, etc.)
 * @param style - DiceBear style name (default: "shapes")
 * @returns Full DiceBear URL with the seed encoded
 */
export function getDiceBearPlaceholder(
  seed: string | null | undefined,
  style = "shapes",
): string {
  const safeSeed = (seed || "default").trim().toLowerCase().replace(/\s+/g, "-");
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(safeSeed)}`;
}

/**
 * Build a DiceBear avatar URL from a seed string.
 * Uses the `avataaars` style for cartoon-style face avatars.
 */
export function getDiceBearUrl(seed: string | null | undefined): string {
  return getDiceBearPlaceholder(seed, "avataaars");
}

/**
 * Get the best available avatar URL for a user.
 *
 * Priority:
 *   1. Uploaded avatar (Cloudinary, etc.)
 *   2. DiceBear generated avatar (deterministic by name/BH-ID)
 *
 * @param avatarUrl - The uploaded avatar URL or null
 * @param seed - DiceBear seed (full_name, bh_id, or auth0UserId)
 * @returns The avatar URL to try first
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
  seed: string | null | undefined,
): string {
  if (avatarUrl) return avatarUrl;
  return getDiceBearUrl(seed);
}
