import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';

const checkinSchema = z.object({
  registration_id: z.string().transform(v => sanitizeUuid(v) ?? ''),
  attended: z.boolean().optional(),
}).refine(d => d.registration_id.length > 0, { message: 'Invalid registration ID' });

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const raw = await request.json();
    const parsed = checkinSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { registration_id, attended } = parsed.data;

    // Security check: Verify caller profile and authorization (organizer or maintainer)
    const { data: caller } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('auth0_user_id', session.user.sub)
      .single();

    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: reg } = await supabase
      .from('event_registrations')
      .select('attended, events!inner(organizer_id)')
      .eq('id', registration_id)
      .single();

    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const eventOrganizerId = (reg.events as unknown as { organizer_id: string } | null)?.organizer_id;
    const isOrganizer = Boolean(eventOrganizerId && eventOrganizerId === caller.id);
    const isMaintainer = caller.role === 'maintainer';

    if (!isOrganizer && !isMaintainer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nextAttended = attended ?? !reg.attended;

    // `checked_in` / `check_in_at` were added by migration 036 but never
    // written, so the attendance history was a single boolean with no time
    // on it. Record both, and clear the timestamp when a check-in is undone.
    const { error } = await supabase
      .from('event_registrations')
      .update({
        attended: nextAttended,
        checked_in: nextAttended,
        check_in_at: nextAttended ? new Date().toISOString() : null,
      })
      .eq('id', registration_id);

    if (error) throw error;
    return NextResponse.json({ success: true, attended: nextAttended });
  } catch (err) {
    logger.error('[api/events/checkin]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "user_action") // ponytail: Uses Auth0 session for user authentication.