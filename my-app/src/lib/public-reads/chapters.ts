/**
 * Active chapters for the public pages.
 *
 * Plain server module, not a "use server" action file: a server action in a
 * marketing page's import graph blocks the static export (scripts/
 * build-static.mjs), and these reads are public anyway. Maintainer-only reads
 * and writes stay in lib/actions/chapters.ts.
 */
import "server-only";
import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';

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

export const COLUMNS =
  'id, slug, name, school, lead_name, city, district, status, established, member_count, description, highlights, whatsapp, sort_order, is_active';

/** Public list: active chapters, maintainer-ordered. Empty when unavailable. */
export async function getActiveChapters(): Promise<ChapterRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('chapters')
    .select(COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    // The public page is a coming-soon state, so an unavailable table
    // means no chapters to show — never a fabricated list.
    logger.error('Error fetching chapters:', error);
    return [];
  }
  return (data ?? []) as ChapterRow[];
}

/** Single chapter by slug. Returns null when absent or unreadable. */
export async function getChapterBySlug(slug: string): Promise<ChapterRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('chapters')
    .select(COLUMNS)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error || !data) {
    return null;
  }
  return data as ChapterRow;
}
