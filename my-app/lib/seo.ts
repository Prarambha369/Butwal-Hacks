import type { Metadata } from "next"

const SITE_URL = "https://butwalhacks.com"
const SITE_NAME = "Butwal Hacks"
const DEFAULT_KEYWORDS = [
  "Butwal Hacks",
  "youth tech community Nepal",
  "hackathons Western Nepal",
  "student innovation Lumbini",
  "nonprofit technology Nepal",
  "mentorship for youth Nepal",
]

type SeoInput = {
  title: string
  description: string
  path: string
  keywords?: string[]
}

export function getCanonicalUrl(path: string): string {
  if (path === "/") return SITE_URL
  return `${SITE_URL}${path}`
}

export function buildPageMetadata({ title, description, path, keywords = [] }: SeoInput): Metadata {
  const canonicalUrl = getCanonicalUrl(path)

  return {
    title,
    description,
    applicationName: SITE_NAME,
    category: "nonprofit technology community",
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    alternates: {
      canonical: path,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export const siteName = SITE_NAME
export const siteUrl = SITE_URL
export const siteKeywords = DEFAULT_KEYWORDS
