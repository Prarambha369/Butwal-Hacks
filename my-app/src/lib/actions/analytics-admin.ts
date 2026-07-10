'use server';

import { logger } from '@/lib/logger'
import { createClient } from '@/utils/supabase/server';

export async function getCommunityGrowthData() {
  const supabase = await createClient();
  
  // Fetch total user signups grouped by month
  // This query uses a PostgreSQL date_trunc to group by month
  const { data, error } = await supabase.rpc('get_growth_metrics');

  if (error) {
    logger.error('Error fetching growth data:', error);
    // Fallback to structured empty data to prevent crash
    return [];
  }

  return data || [];
}

export async function getParticipationMetrics() {
  const supabase = await createClient();

  // ponytail: three independent count queries — run concurrently instead of sequentially
  const [userResult, projectResult, eventResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
  ]);

  if (userResult.error || projectResult.error || eventResult.error) {
    logger.error('Error fetching participation metrics');
  }

  return {
    totalUsers: userResult.count || 0,
    totalProjects: projectResult.count || 0,
    totalEvents: eventResult.count || 0,
  };
}
