import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/utils/supabase'
import { blogPosts, initiatives, events, programs, chapters } from '@/lib/content'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butwalhacks.com'
const today = new Date()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    // ─── Tier 1: Core entry points (priority 1.0) ──────────
    { url: siteUrl, lastModified: today, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/explore`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/events`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/projects`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },

    // ─── Tier 2: Important content (priority 0.8) ──────────
    { url: `${siteUrl}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/community`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/chapters`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/initiatives`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/gallery`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/sitemap`, lastModified: today, changeFrequency: 'monthly', priority: 0.8 },

    // ─── Tier 2.5: Community features (priority 0.75) ─────
    { url: `${siteUrl}/mentors`, lastModified: today, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${siteUrl}/teams`, lastModified: today, changeFrequency: 'weekly', priority: 0.75 },

    // ─── Tier 3: Supporting pages (priority 0.7) ──────────
    { url: `${siteUrl}/about`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/support`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/donors`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/transparency`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/governance`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/philosophy`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/opportunities`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/resources`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/docs`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/annual-report`, lastModified: today, changeFrequency: 'yearly', priority: 0.7 },

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

  // ─── Dynamic: Programs ────────────────────────────────────
  for (const program of programs) {
    entries.push({
      url: `${siteUrl}/programs/${program.slug}`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // ─── Dynamic: Blog posts ──────────────────────────────────
  for (const post of blogPosts) {
    entries.push({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // ─── Dynamic: Chapters ────────────────────────────────────
  for (const chapter of chapters) {
    entries.push({
      url: `${siteUrl}/chapters/${chapter.slug}`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // ─── Dynamic: Events from content ─────────────────────────
  for (const event of events) {
    entries.push({
      url: `${siteUrl}/events/${event.slug}`,
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
      entries.push({
        url: `${siteUrl}/events/${event.slug}`,
        lastModified: event.updated_at ? new Date(event.updated_at) : today,
        changeFrequency: 'weekly',
        priority: 0.8,
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
