import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase } = authClient;
    const { limit, offset } = parsePagination(request);

    // ponytail: Fetch registrations with profile data via Supabase join
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select(`
        id,
        attended,
        profiles!inner(id, full_name, bh_id, avatar_url, email)
      `)
      .eq('event_id', eventId)
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      registrations: registrations || [],
      pagination: paginationMeta(limit, offset, registrations?.length ?? 0),
    });
  } catch (err) {
    logger.error('[api/events/:eventId/registrations]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
