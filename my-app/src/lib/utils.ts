import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Apply Cloudinary auto-optimization transforms to an image URL. */
export function cloudinaryUrl(url: string | null | undefined, width = 800): string {
  if (!url || !url.includes("res.cloudinary.com")) return url ?? "";
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return `${url.slice(0, idx + marker.length)}q_auto,f_auto,w_${width}/${url.slice(idx + marker.length)}`;
}
