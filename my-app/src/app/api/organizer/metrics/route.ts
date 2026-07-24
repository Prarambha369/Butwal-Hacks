import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { auth0 } from '@/lib/auth0';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const { limit, offset } = parsePagination(request);

    // ponytail: Resolve profile UUID then fetch events with registration counts
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();

    if (!profile) return NextResponse.json({ metrics: [], pagination: paginationMeta(limit, offset, 0) });

    const { data, error } = await supabase
      .from('events')
      .select('*, event_registrations(count)')
      .eq('organizer_id', profile.id)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return NextResponse.json({
      metrics: data,
      pagination: paginationMeta(limit, offset, data?.length ?? 0),
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}