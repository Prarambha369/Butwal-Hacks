import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { withRateLimit } from '@/lib/rate-limiter';


export const GET = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const u = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(u.searchParams.get("limit") ?? "", 10) || 50));
    const offset = Math.max(0, parseInt(u.searchParams.get("offset") ?? "", 10) || 0);

    // ponytail: Resolve profile UUID then fetch events with registration counts
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();

    if (!profile) return NextResponse.json({ metrics: [], pagination: { limit, offset, hasMore: false } });

    const { data, error } = await supabase
      .from('events')
      .select('*, event_registrations(count)')
      .eq('organizer_id', profile.id)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({
      metrics: data,
      pagination: { limit, offset, hasMore: (data?.length ?? 0) >= limit },
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "frequent")