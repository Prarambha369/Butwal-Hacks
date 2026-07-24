import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { auth0 } from '@/lib/auth0';
import { parsePagination, paginationMeta } from '@/lib/pagination';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const { limit, offset } = parsePagination(request);

    const { data, error } = await supabase
      .from('profile_badges')
      .select('badges(*)')
      .eq('auth0_user_id', userId)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    logger.info('Badge check completed', {
      badge_count: data?.length ?? 0,
      auth0_user_id: userId,
    });

    return NextResponse.json({
      badges: data,
      pagination: paginationMeta(limit, offset, data?.length ?? 0),
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    logger.error('Badge check failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}