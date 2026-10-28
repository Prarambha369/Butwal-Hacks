import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { createServiceClient } from '@/utils/supabase'
import { blogPosts, initiatives, events } from '@/lib/content'
import { ALL_FESTIVALS } from '@/lib/festivals'

const siteUrl = SITE_URL
const today = new Date()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    // ─── Tier 1: Core entry points (priority 1.0) ──────────
    { url: siteUrl, lastModified: today, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/explore`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/events`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/projects`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },

    // ─── Tier 2: Important content (priority 0.8) ──────────
    // Only canonical URLs go here. /community, /initiatives and /donors were
    // folded into /explore, /events and /partners by the consolidation
    // redirects in next.config.ts; listing them asked crawlers to fetch URLs
    // that only ever 308. Their destinations are listed below.
    { url: `${siteUrl}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/chapters`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/gallery`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/calendar`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/sitemap`, lastModified: today, changeFrequency: 'monthly', priority: 0.8 },

    // ─── Tier 2.5: Community features (priority 0.75) ─────
    { url: `${siteUrl}/mentors`, lastModified: today, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${siteUrl}/teams`, lastModified: today, changeFrequency: 'weekly', priority: 0.75 },

    // ─── Tier 3: Supporting pages (priority 0.7) ──────────
    { url: `${siteUrl}/about`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/support`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/partners`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/transparency`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/governance`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/learn`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/transparency?view=report`, lastModified: today, changeFrequency: 'yearly', priority: 0.7 },

    // ─── Tier 4: Reference & Legal (priority 0.5-0.6) ─────
    { url: `${siteUrl}/legal/privacy`, lastModified: today, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/legal/terms`, lastModified: today, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/cookie-policy`, lastModified: today, changeFrequency: 'yearly', priority: 0.5 },
  ]

  // ─── Dynamic: Initiatives ─────────────────────────────────
  for (const initiative of initiatives) {
    entries.push({
      url: `${siteUrl}/initiatives/${initiative.slug}`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // ─── Dynamic: Blog posts ──────────────────────────────────
  // `blogPosts` from content.ts is only the fallback now that posts live in
  // the database; DB rows are added below so member-authored posts are
  // discoverable too.
  const seenBlogUrls = new Set<string>()
  for (const post of blogPosts) {
    const url = `${siteUrl}/blog/${post.slug}`
    seenBlogUrls.add(url)
    entries.push({
      url,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // ─── Chapters ─────────────────────────────────────────────
  // Intentionally omitted: the public directory is a "coming soon" page and
  // nothing links to the legacy static chapter pages, so listing them would
  // ask crawlers to index content the site no longer presents as current.
  // They remain reachable at /chapters/[slug] for old links.

  // ─── Static: Festival index + permanent festival pages ────
  // Samiti-seeded, dates never change once published.
  entries.push({
    url: `${siteUrl}/festivals`,
    lastModified: today,
    changeFrequency: 'monthly',
    priority: 0.7,
  })
  for (const festival of ALL_FESTIVALS) {
    entries.push({
      url: `${siteUrl}/festivals/${festival.slug}`,
      changeFrequency: 'yearly',
      priority: 0.6,
    })
  }

  // content.ts events and DB events overlap: content.ts carries the tag
  // registry for events whose pages are served from the database, so both
  // loops would emit the same URL. Emit each URL once, preferring the
  // content.ts metadata (which knows the completion state).
  const seenEventUrls = new Set<string>()

  // ─── Dynamic: Events from content ─────────────────────────
  for (const event of events) {
    const url = `${siteUrl}/events/${event.slug}`
    seenEventUrls.add(url)
    entries.push({
      url,
      lastModified: today,
      changeFrequency: event.status === 'completed' ? 'monthly' : 'weekly',
      priority: 0.8,
    })
  }

  // ─── Dynamic: DB-driven routes ────────────────────────────
  try {
    // Service client: anon RLS policies would silently block public reads,
    // leaving DB-backed URLs out of the sitemap. Best-effort; falls back to
    // static entries if env is missing.
    const supabase = createServiceClient()

    // Events from DB
    const { data: dbEvents } = await supabase
      .from('events')
      .select('slug, updated_at')
      .not('status', 'eq', 'archived')
      .limit(200)

    for (const event of dbEvents ?? []) {
      const url = `${siteUrl}/events/${event.slug}`
      if (seenEventUrls.has(url)) continue
      seenEventUrls.add(url)
      entries.push({
        url,
        lastModified: event.updated_at ? new Date(event.updated_at) : today,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    // Blog posts from DB (member + maintainer authored)
    const { data: dbPosts } = await supabase
      .from('blog_posts')
      .select('slug, published_at')
      .eq('is_published', true)
      .limit(500)

    for (const post of dbPosts ?? []) {
      const url = `${siteUrl}/blog/${post.slug}`
      if (seenBlogUrls.has(url)) continue
      seenBlogUrls.add(url)
      entries.push({
        url,
        lastModified: post.published_at ? new Date(post.published_at) : today,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    // Projects from DB
    const { data: dbProjects } = await supabase
      .from('projects')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(200)

    for (const project of dbProjects ?? []) {
      entries.push({
        url: `${siteUrl}/projects/${project.id}`,
        lastModified: project.updated_at ? new Date(project.updated_at) : today,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }

    // Public profiles from DB
    const { data: profiles } = await supabase
      .from('profiles')
      .select('bh_id, updated_at')
      .eq('is_claimed', true)
      .eq('is_suspended', false)
      .limit(500)

    for (const profile of profiles ?? []) {
      entries.push({
        url: `${siteUrl}/p/${profile.bh_id}`,
        lastModified: profile.updated_at ? new Date(profile.updated_at) : today,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }

    // Teams from DB
    const { data: teams } = await supabase
      .from('teams')
      .select('id, updated_at')
      .limit(200)

    for (const team of teams ?? []) {
      entries.push({
        url: `${siteUrl}/teams/${team.id}`,
        lastModified: team.updated_at ? new Date(team.updated_at) : today,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }
  } catch {
    // Silently fall back — static routes + content routes are enough
  }

  return entries
}
