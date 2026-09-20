import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { withRateLimit } from '@/lib/rate-limiter';

// Dynamic route: the ics is cached via the Cache-Control header below,
// and forcing revalidate here would prerender it at build time, requiring
// DB access during `next build`. See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
// for route segment config semantics.
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://butwalhacks.com';

/** Escape text per RFC 5545 (commas, semicolons, backslashes, newlines). */
function escText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function toUtcStamp(value: string): string | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export const GET = withRateLimit(async () => {
  const db = createServiceClient();
  // Same published set the homepage calendar plots: publishing an event
  // is all an organizer must do for it to appear + sync.
  const { data: events, error } = await db
    .from('events')
    .select('id, title, description, location, slug, start_date, end_date')
    .eq('is_published', true);

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });

  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const vevents = (events ?? []).flatMap((event) => {
    const start = toUtcStamp(event.start_date);
    if (!start) return [];
    const endRaw = event.end_date ? toUtcStamp(event.end_date) : null;
    // Fallback duration when no end date: 2 hours.
    const end = endRaw ?? new Date(new Date(event.start_date).getTime() + 2 * 3600 * 1000)
      .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const url = event.slug ? `${SITE_URL}/events/${event.slug}` : SITE_URL;
    return [[
      'BEGIN:VEVENT',
      `UID:${event.id}@butwalhacks.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escText(event.title ?? 'Butwal Hacks event')}`,
      `DESCRIPTION:${escText(event.description ?? '')}`,
      `LOCATION:${escText(event.location ?? '')}`,
      `URL:${url}`,
      'END:VEVENT',
    ].join('\r\n')];
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Butwal Hacks//Events//EN',
    'NAME:Butwal Hacks Events',
    'X-WR-CALNAME:Butwal Hacks Events',
    'X-WR-CALDESC:Butwal Hacks hackathons, workshops, and community events',
    `URL:${SITE_URL}/api/events/ical`,
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="butwal-hacks-events.ics"',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}, "frequent")
