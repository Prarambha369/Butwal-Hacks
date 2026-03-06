import type { MetadataRoute } from "next"

import { blogPosts, events, initiatives } from "@/lib/content"
import { siteUrl } from "@/lib/seo"

/**
 * sitemap — generates the full XML sitemap for butwalhacks.com.
 *
 * Covers:
 *  - Static pages (/, /about, /blog, /community, /contact, /docs,
 *    /events, /explore, /governance, /initiatives, /philosophy,
 *    /resources, /support)
 *  - Dynamic initiative pages (/initiatives/[slug])
 *  - Dynamic event pages     (/events/[slug])
 *  - Dynamic blog pages      (/blog/[slug])
 *
 * Referenced by /robots.ts → googlebot follows for indexing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/blog",
    "/community",
    "/contact",
    "/docs",
    "/events",
    "/explore",
    "/governance",
    "/initiatives",
    "/philosophy",
    "/resources",
    "/support",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }))

  const initiativePages: MetadataRoute.Sitemap = initiatives.map((initiative) => ({
    url: `${siteUrl}/initiatives/${initiative.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }))

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }))

  return [...staticPages, ...initiativePages, ...eventPages, ...blogPages]
}
