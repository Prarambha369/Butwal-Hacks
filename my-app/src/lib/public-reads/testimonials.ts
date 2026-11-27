/**
 * Approved testimonials for the public pages.
 *
 * Plain server module, not a "use server" action file: a server action in a
 * marketing page's import graph blocks the static export (scripts/
 * build-static.mjs), and these reads are public anyway. Maintainer-only reads
 * and writes stay in lib/actions/testimonials.ts.
 */
import "server-only";
import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';

export interface ModeratedTestimonial {
  id: string;
  event_id: string | null;
  profile_id: string | null;
  rating: number | null;
  comment: string | null;
  status: string;
  is_featured: boolean;
  author_type: string;
  source: string | null;
  guest_name: string | null;
  guest_title: string | null;
  created_at: string;
  profile: { full_name: string | null; bh_id: string | null; avatar_url: string | null } | null;
}

/** Public approved list for display (featured first, then newest). */
export async function getApprovedTestimonials(limit = 12): Promise<ModeratedTestimonial[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('event_reviews')
    .select('id, event_id, profile_id, rating, comment, status, is_featured, author_type, source, guest_name, guest_title, created_at, profile:profiles(full_name, bh_id, avatar_url)')
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    logger.error('Error fetching approved testimonials:', error);
    return [];
  }
  return (data ?? []) as unknown as ModeratedTestimonial[];
}
