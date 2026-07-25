import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';

export const revalidate = 3600; // Cache 1 hour

export async function GET() {
  const db = createServiceClient();
  const { data: events, error } = await db
    .from('events')
    .select('*')
    .eq('is_published', true);

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Butwal Hacks//Events//EN',
    ...events.map(event => [
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DTSTART:${new Date(event.start_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
      `DESCRIPTION:${event.summary}`,
      `LOCATION:${event.location}`,
      'END:VEVENT'
    ].join('\r\n')),
    'END:VCALENDAR'
  ].join('\r\n');

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="events.ics"',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
