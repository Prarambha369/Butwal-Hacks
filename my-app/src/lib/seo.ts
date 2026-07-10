import type { Metadata } from "next"

const SITE_URL = "https://butwalhacks.com"
const SITE_NAME = "Butwal Hacks"
const DEFAULT_KEYWORDS = ["Butwal Hacks", "youth tech community Nepal", "hackathons Western Nepal", "student innovation Lumbini", "nonprofit technology Nepal", "mentorship for youth Nepal"]

export const siteName = SITE_NAME
export const siteUrl = SITE_URL
export const siteKeywords = DEFAULT_KEYWORDS

export function buildPageMetadata({ title, description, path, keywords = [] }: {
  title: string; description: string; path: string; keywords?: string[]
}): Metadata {
  const canonical = path === "/" ? SITE_URL : `${SITE_URL}${path}`
  return {
    title, description,
    applicationName: SITE_NAME,
    category: "nonprofit technology community",
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { title, description, url: canonical, siteName: SITE_NAME, locale: "en_US", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}
