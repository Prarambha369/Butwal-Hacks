import type { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'
import { blogPosts, initiatives } from '@/lib/content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butwalhacks.com'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/projects`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/community`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/chapters`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/initiatives`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/support`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/docs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Blog posts from content library
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map(post => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Initiative pages from content library
  const initiativeRoutes: MetadataRoute.Sitemap = initiatives.map(init => ({
    url: `${siteUrl}/initiatives/${init.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Fetch dynamic routes from Supabase
  const supabase = await createClient()

  // Fetch events from DB
  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .not('status', 'eq', 'archived')

  const eventRoutes: MetadataRoute.Sitemap = (events ?? []).map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Fetch claimed, non-suspended profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('bh_id, updated_at')
    .eq('is_claimed', true)
    .eq('is_suspended', false)

  const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((profile) => ({
    url: `${siteUrl}/profile/${profile.bh_id}`,
    lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticRoutes, ...blogRoutes, ...initiativeRoutes, ...eventRoutes, ...profileRoutes]
}
