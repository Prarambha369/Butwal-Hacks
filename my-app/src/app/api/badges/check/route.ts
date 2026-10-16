import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { withRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

export const GET = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const u = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(u.searchParams.get("limit") ?? "", 10) || 50));
    const offset = Math.max(0, parseInt(u.searchParams.get("offset") ?? "", 10) || 0);

    // profile_badges is keyed by profile_id (migration 008), not by Auth0
    // subject. Filtering on `auth0_user_id` referenced a column that does not
    // exist, so PostgREST returned 42703 and this route answered 500 for every
    // caller. Resolve the profile row first, exactly as the sibling routes do.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();

    if (profileError || !profile) {
      logger.warn('Badge check: no profile for session subject', {
        code: profileError?.code ?? null,
      });
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('profile_badges')
      .select('badges(*)')
      .eq('profile_id', profile.id)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    logger.info('Badge check completed', {
      badge_count: data?.length ?? 0,
      auth0_user_id: userId,
    });

    return NextResponse.json({
      badges: data,
      pagination: { limit, offset, hasMore: (data?.length ?? 0) >= limit },
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    logger.error('Badge check failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "frequent")