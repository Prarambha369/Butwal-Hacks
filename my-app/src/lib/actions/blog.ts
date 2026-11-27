'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { requireMaintainer } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import { COLUMNS, type BlogRow } from '@/lib/public-reads/blog';

export type { BlogRow, BlogPostWithMeta } from '@/lib/public-reads/blog';

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
