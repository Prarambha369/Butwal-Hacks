import type { Metadata } from "next"
import { SITE_URL } from "@/lib/constants"
const SITE_NAME = "Butwal Hacks"
const DEFAULT_KEYWORDS = ["Butwal Hacks", "youth tech community Nepal", "hackathons Western Nepal", "student innovation Lumbini", "nonprofit technology Nepal", "mentorship for youth Nepal"]

export const siteName = SITE_NAME
export const siteUrl = SITE_URL
export const siteKeywords = DEFAULT_KEYWORDS

/**
 * Build the metadata for a public page.
 *
 * `image` and `robots` are opt-in so the ~40 existing call sites keep emitting
 * exactly the defaults they emitted before: no empty `images` arrays (which
 * Next renders as nothing but tools flag as a broken card) and no robots
 * change. When an image is supplied the whole `openGraph` object is re-emitted
 * rather than patched, because Next replaces `openGraph` shallowly and a
 * partial object would drop `siteName`/`locale` from the shared card.
 */
export function buildPageMetadata({ title, description, path, keywords = [], image, robots }: {
  title: string
  description: string
  path: string
  keywords?: string[]
  image?: { url: string; alt: string; width?: number; height?: number }
  robots?: Metadata["robots"]
}): Metadata {
  const canonical = path === "/" ? SITE_URL : `${SITE_URL}${path}`
  const ogImage = image
    ? [{
        url: image.url,
        alt: image.alt,
        ...(image.width !== undefined ? { width: image.width } : {}),
        ...(image.height !== undefined ? { height: image.height } : {}),
      }]
    : undefined

  return {
    title, description,
    applicationName: SITE_NAME,
    category: "nonprofit technology community",
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    alternates: { canonical },
    robots: robots ?? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: {
      title, description, url: canonical, siteName: SITE_NAME, locale: "en_US", type: "website",
      ...(ogImage ? { images: ogImage } : {}),
    },
    twitter: {
      card: "summary_large_image", title, description,
      ...(image ? { images: [image.url] } : {}),
    },
  }
}
