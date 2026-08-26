import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { logger } from '@/lib/logger';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();

    // SECURITY: Because createServiceClient() bypasses RLS, we must verify that
    // the requesting user is either the event organizer or a maintainer.
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth0_user_id', session.user.sub)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isOrganizer = event.organizer_id === callerProfile.id;
    const isMaintainer = callerProfile.role === 'maintainer';
    if (!isOrganizer && !isMaintainer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const u = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(u.searchParams.get("limit") ?? "", 10) || 50));
    const offset = Math.max(0, parseInt(u.searchParams.get("offset") ?? "", 10) || 0);

    // Fetch registrations with profile data via Supabase join
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
      pagination: { limit, offset, hasMore: (registrations?.length ?? 0) >= limit },
    }, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    logger.error('[api/events/:eventId/registrations]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
