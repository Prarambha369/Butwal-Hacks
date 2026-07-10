import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;
    const { limit, offset } = parsePagination(request);

    // ponytail: Get profile UUID then fetch published events where user is organizer
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();

    if (!profile) return NextResponse.json({ events: [], pagination: paginationMeta(limit, offset, 0) });

    const { data: events } = await supabase
      .from('events')
      .select('id, title, start_date')
      .eq('organizer_id', profile.id)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      events: events || [],
      pagination: paginationMeta(limit, offset, events?.length ?? 0),
    });
  } catch (err) {
    logger.error('[api/events]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
