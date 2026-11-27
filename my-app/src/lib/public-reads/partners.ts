/**
 * Active partners for the public pages.
 *
 * Plain server module, not a "use server" action file: a server action in a
 * marketing page's import graph blocks the static export (scripts/
 * build-static.mjs), and these reads are public anyway. Maintainer-only reads
 * and writes stay in lib/actions/partners.ts.
 */
import "server-only";
import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';

export interface Partner {
  id: string;
  name: string;
  /** Legacy https URL, kept for partners added before the Cloudinary upload flow. Null for Cloudinary-backed logos. */
  logo_url: string | null;
  /** Cloudinary public id for a partner logo uploaded through the maintainer wall. When set, `logo_url` must be derived from this on read (light/dark delivery), not stored as a static URL. */
  cloudinary_public_id: string | null;
  href: string | null;
  sort_order: number;
  is_active: boolean;
}

/** Public wall: active partners only, maintainer-ordered. */
export async function getActivePartners(): Promise<Partner[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, logo_url, cloudinary_public_id, href, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .abortSignal(AbortSignal.timeout(5000));
  if (error) {
    // PGRST205 (table missing from the schema cache) used to return empty with
    // no log at all, so a database behind on migrations looked like "no
    // partners configured". Log the code, then keep the empty-wall fallback.
    logger.error('[partners] active partners read failed', {
      code: (error as { code?: string }).code,
      message: error.message,
    });
    return [];
  }
  return (data ?? []) as Partner[];
}
