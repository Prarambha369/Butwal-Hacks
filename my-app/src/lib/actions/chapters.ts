'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { requireMaintainer } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';
import { chapters as staticChapters, type Chapter as StaticChapter } from '@/lib/content';

export interface ChapterRow {
  id: string;
  slug: string;
  name: string;
  school: string;
  lead_name: string;
  city: string;
  district: string;
  status: 'active' | 'forming' | 'inactive';
  established: string;
  member_count: number;
  description: string;
  highlights: string[];
  whatsapp: string | null;
  sort_order: number;
  is_active: boolean;
}

const COLUMNS =
  'id, slug, name, school, lead_name, city, district, status, established, member_count, description, highlights, whatsapp, sort_order, is_active';

/** Static fallback: the three chapters the hardcoded page carried. */
function staticFallback(): ChapterRow[] {
  return staticChapters.map((c: StaticChapter, i: number) => ({
    id: `static-${c.slug}`,
    slug: c.slug,
    name: c.name,
    school: c.school,
    lead_name: c.leadName,
    city: c.city,
    district: c.district,
    status: c.status,
    established: c.established,
    member_count: c.memberCount,
    description: c.description,
    highlights: c.highlights,
    whatsapp: c.socialLinks.whatsapp,
    sort_order: i,
    is_active: true,
  }));
}

/** Public list: active chapters, maintainer-ordered (static fallback). */
export async function getActiveChapters(): Promise<ChapterRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('chapters')
    .select(COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    // PGRST205 = table missing from schema cache (preview/dev DB behind
    // on migrations). Fall back to the static list, never an empty page.
    if ((error as { code?: string }).code === 'PGRST205') return staticFallback();
    logger.error('Error fetching chapters:', error);
    return staticFallback();
  }
  const rows = (data ?? []) as ChapterRow[];
  return rows.length > 0 ? rows : staticFallback();
}

/** Single chapter by slug (static fallback). */
export async function getChapterBySlug(slug: string): Promise<ChapterRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('chapters')
    .select(COLUMNS)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error || !data) {
    return staticFallback().find((c) => c.slug === slug) ?? null;
  }
  return data as ChapterRow;
}

/** Full list for the maintainer editor. */
export async function getAllChapters(): Promise<ChapterRow[]> {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('chapters')
    .select(COLUMNS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    logger.error('Error fetching all chapters:', error);
    throw new Error('Failed to load chapters');
  }
  return (data ?? []) as ChapterRow[];
}

export async function saveChapter(input: {
  id?: string;
  slug: string;
  name: string;
  school?: string;
  lead_name?: string;
  city?: string;
  district?: string;
  status?: string;
  established?: string;
  member_count?: number;
  description?: string;
  highlights?: string[];
  whatsapp?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  await requireMaintainer();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 80);
  const name = input.name.trim().slice(0, 120);
  if (!slug || !name) throw new Error('Chapter slug and name are required');
  const status = ['active', 'forming', 'inactive'].includes(input.status ?? '')
    ? (input.status as ChapterRow['status'])
    : 'active';
  const row = {
    slug,
    name,
    school: (input.school ?? '').trim().slice(0, 160),
    lead_name: (input.lead_name ?? '').trim().slice(0, 120),
    city: (input.city ?? '').trim().slice(0, 120),
    district: (input.district ?? 'Rupandehi').trim().slice(0, 120),
    status,
    established: (input.established ?? '').trim().slice(0, 16),
    member_count: Number.isFinite(input.member_count) ? Math.max(0, Math.trunc(input.member_count as number)) : 0,
    description: (input.description ?? '').trim().slice(0, 2000),
    highlights: (input.highlights ?? []).map((h) => h.trim().slice(0, 200)).filter(Boolean).slice(0, 12),
    whatsapp: input.whatsapp?.trim().startsWith('https://') ? input.whatsapp.trim().slice(0, 300) : null,
    sort_order: Number.isFinite(input.sort_order) ? Math.trunc(input.sort_order as number) : 0,
    is_active: input.is_active ?? true,
  };
  const supabase = createServiceClient();
  const { error } = input.id && !input.id.startsWith('static-')
    ? await supabase.from('chapters').update(row).eq('id', input.id)
    : await supabase.from('chapters').insert(row);
  if (error) {
    logger.error('Error saving chapter:', error);
    throw new Error('Failed to save chapter');
  }
  revalidatePath('/chapters');
  return { success: true };
}

export async function deleteChapter(id: string) {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { error } = await supabase.from('chapters').delete().eq('id', id);
  if (error) {
    logger.error('Error deleting chapter:', error);
    throw new Error('Failed to delete chapter');
  }
  revalidatePath('/chapters');
  return { success: true };
}
