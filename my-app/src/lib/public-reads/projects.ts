/**
 * Project strips for the public homepage and /projects.
 *
 * Plain server module, not a "use server" action file: a server action in a
 * marketing page's import graph blocks the static export (scripts/
 * build-static.mjs). Queries are unchanged from lib/actions/projects.ts,
 * where the member and maintainer reads and writes stay.
 */
import "server-only";
import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';

export async function getFeaturedProjects(limit = 3) {
  const supabase = createServiceClient();

  let query = supabase
    .from('projects')
    .select(`
      *,
      project_likes(count)
    `)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  // Fail fast on DB stalls — callers render empty states on [].
  const { data, error } = await query.abortSignal(AbortSignal.timeout(5000));

  if (error) {
    logger.error("Error fetching projects:", error);
    return [];
  }

  return data;
}

/** Community-verified projects, newest first. Backs the /projects featured strip. */
export async function getVerifiedProjects(limit = 3) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, cover_image, event_id')
    .eq('github_verified', true)
    .order('created_at', { ascending: false })
    .limit(limit)
    .abortSignal(AbortSignal.timeout(5000));

  if (error) {
    logger.error("Error fetching verified projects:", error);
    return [];
  }

  return data;
}
