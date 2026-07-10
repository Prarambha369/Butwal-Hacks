import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { parsePagination, paginationMeta } from '@/lib/pagination';
import { posthogLog } from '@/lib/posthog-logger';

export async function GET(request: Request) {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;
    const { limit, offset } = parsePagination(request);

    const { data, error } = await supabase
      .from('profile_badges')
      .select('badges(*)')
      .eq('auth0_user_id', userId)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    posthogLog.info('Badge check completed', {
      badge_count: data?.length ?? 0,
      auth0_user_id: userId,
    });

    return NextResponse.json({
      badges: data,
      pagination: paginationMeta(limit, offset, data?.length ?? 0),
    });
  } catch (err) {
    posthogLog.error('Badge check failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}