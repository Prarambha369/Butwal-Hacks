import { NextResponse } from 'next/server'
import { z } from 'zod';
import { SITE_URL } from '@/lib/constants';
import { createServiceClient } from '@/utils/supabase';
import { withRateLimit } from '@/lib/rate-limiter';
import { buildIcsCalendar } from '@/lib/event-ics';

// Dynamic route: the ics is cached via the Cache-Control header below,
// and forcing revalidate here would prerender it at build time, requiring
// DB access during `next build`. See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
// for route segment config semantics.
export const dynamic = "force-dynamic";

/** `?slug=` narrows the feed to one event (the "Add to calendar" download). */
const slugSchema = z.string().regex(/^[a-z0-9-]{1,120}$/);

export const GET = withRateLimit(async (request: Request) => {
  const db = createServiceClient();
  const rawSlug = new URL(request.url).searchParams.get('slug');
  const slug = rawSlug === null ? null : slugSchema.safeParse(rawSlug);
  if (slug && !slug.success) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  // Same published set the homepage calendar plots: publishing an event
  // is all an organizer must do for it to appear + sync. Public data only,
  // so the read needs no session.
  let query = db
    .from('events')
    .select('id, title, description, location, slug, start_date, end_date')
    .eq('is_published', true);
  if (slug) query = query.eq('slug', slug.data);
  const { data: events, error } = await query;

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });
  if (slug && (events ?? []).length === 0) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const header = slug
    ? [`X-WR-CALNAME:${(events?.[0]?.title ?? 'Butwal Hacks event').replace(/[\r\n]/g, ' ')}`]
    : [
        'NAME:Butwal Hacks Events',
        'X-WR-CALNAME:Butwal Hacks Events',
        'X-WR-CALDESC:Butwal Hacks hackathons, workshops, and community events',
        `URL:${SITE_URL}/api/events/ical`,
      ];
  const ics = buildIcsCalendar(events ?? [], SITE_URL, header);
  const filename = slug ? `${slug.data}.ics` : 'butwal-hacks-events.ics';

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}, "frequent")
