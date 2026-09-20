'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { requireMaintainer } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
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
}

const COLUMNS =
  'id, slug, title, excerpt, body, tags, cover_image, is_published, published_at';

function toPost(r: BlogRow): StaticPost {
  return {
    slug: r.slug,
    title: r.title,
    tags: r.tags,
    publishedAt: r.published_at.slice(0, 10),
    excerpt: r.excerpt,
    body: r.body,
    cover_image: r.cover_image ?? undefined,
  };
}

/** Published posts, newest first (static fallback). */
export async function getPublishedPosts(): Promise<StaticPost[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(COLUMNS)
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  if (error) {
    if ((error as { code?: string }).code === 'PGRST205') return staticPosts;
    logger.error('Error fetching posts:', error);
    return staticPosts;
  }
  const rows = (data ?? []) as BlogRow[];
  return rows.length > 0 ? rows.map(toPost) : staticPosts;
}

/** Single published post (static fallback). */
export async function getPublishedPost(slug: string): Promise<StaticPost | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(COLUMNS)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error || !data) {
    return staticPosts.find((p) => p.slug === slug) ?? null;
  }
  return toPost(data as BlogRow);
}

/** Full list for the maintainer editor. */
export async function getAllPosts(): Promise<BlogRow[]> {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(COLUMNS)
    .order('published_at', { ascending: false });
  if (error) {
    logger.error('Error fetching all posts:', error);
    throw new Error('Failed to load posts');
  }
  return (data ?? []) as BlogRow[];
}

export async function savePost(input: {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  body?: string[];
  tags?: string[];
  cover_image?: string | null;
  is_published?: boolean;
  published_at?: string;
}) {
  await requireMaintainer();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 120);
  const title = input.title.trim().slice(0, 160);
  if (!slug || !title) throw new Error('Post slug and title are required');
  const row = {
    slug,
    title,
    excerpt: (input.excerpt ?? '').trim().slice(0, 500),
    body: (input.body ?? []).map((p) => p.trim()).filter(Boolean).slice(0, 200),
    tags: (input.tags ?? []).map((t) => t.trim().toLowerCase().slice(0, 40)).filter(Boolean).slice(0, 12),
    cover_image: input.cover_image?.trim().startsWith('https://') ? input.cover_image.trim().slice(0, 500) : null,
    is_published: input.is_published ?? false,
    published_at: /^\d{4}-\d{2}-\d{2}$/.test(input.published_at ?? '') ? (input.published_at as string) : new Date().toISOString().slice(0, 10),
  };
  const supabase = createServiceClient();
  const { error } = input.id && !input.id.startsWith('static-')
    ? await supabase.from('blog_posts').update(row).eq('id', input.id)
    : await supabase.from('blog_posts').insert(row);
  if (error) {
    logger.error('Error saving post:', error);
    throw new Error('Failed to save post');
  }
  revalidatePath('/blog');
  return { success: true };
}

export async function deletePost(id: string) {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) {
    logger.error('Error deleting post:', error);
    throw new Error('Failed to delete post');
  }
  revalidatePath('/blog');
  return { success: true };
}
