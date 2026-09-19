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

    // ponytail: Get profile UUID then fetch published events where user is organizer
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();

    if (!profile) return NextResponse.json({ events: [],      pagination: { limit, offset, hasMore: false } });

    const { data: events } = await supabase
      .from('events')
      .select('id, title, start_date')
      .eq('organizer_id', profile.id)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      events: events || [],
      pagination: { limit, offset, hasMore: (events?.length ?? 0) >= limit },
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    logger.error('[api/events]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "frequent")
