/**
 * Published blog posts for the public pages.
 *
 * Plain server module, not a "use server" action file: a server action in a
 * marketing page's import graph blocks the static export (scripts/
 * build-static.mjs), and these reads are public anyway. Maintainer-only reads
 * and writes stay in lib/actions/blog.ts.
 */
import "server-only";
import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { blogPosts as staticPosts, type BlogPost as StaticPost } from '@/lib/content';

export interface BlogRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  tags: string[];
  cover_image: string | null;
  is_published: boolean;
  published_at: string;
  /** Bumped by the set_updated_at() trigger (migration 137). */
  updated_at: string | null;
}

export const COLUMNS =
  'id, slug, title, excerpt, body, tags, cover_image, is_published, published_at, updated_at';

/**
 * A static seed post, plus the DB-only refresh date that the detail page feeds
 * to blogPostingJsonLd as dateModified. Static posts carry no updatedAt, so
 * their markup keeps the datePublished-only fallback.
 */
export type BlogPostWithMeta = StaticPost & { updatedAt?: string };

function toPost(r: BlogRow): BlogPostWithMeta {
  return {
    slug: r.slug,
    title: r.title,
    tags: r.tags,
    publishedAt: r.published_at.slice(0, 10),
    excerpt: r.excerpt,
    body: r.body,
    cover_image: r.cover_image ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

/** Published posts, newest first (static fallback). */
export async function getPublishedPosts(): Promise<BlogPostWithMeta[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(COLUMNS)
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  if (error) {
    // PGRST205 (table missing) used to return the static seed with no log, so
    // schema drift was indistinguishable from "no posts yet". Log, then fall back.
    logger.error('[blog] published posts read failed — serving static fallback', {
      code: (error as { code?: string }).code,
      message: error.message,
    });
    return staticPosts;
  }
  const rows = (data ?? []) as BlogRow[];
  return rows.length > 0 ? rows.map(toPost) : staticPosts;
}

/** Single published post (static fallback). */
export async function getPublishedPost(slug: string): Promise<BlogPostWithMeta | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(COLUMNS)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error || !data) {
    // PGRST116 is `.single()` finding no row: a missing post is a 404, not a
    // fault, so it stays quiet. Anything else is a real read failure.
    const code = (error as { code?: string } | null)?.code;
    if (error && code !== 'PGRST116') {
      logger.error('[blog] post read failed — serving static fallback', {
        slug,
        code,
        message: error.message,
      });
    }
    return staticPosts.find((p) => p.slug === slug) ?? null;
  }
  return toPost(data as BlogRow);
}
