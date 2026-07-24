import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { captureServerEvent } from '@/lib/analytics/server';

const checkinSchema = z.object({
  registration_id: z.string().transform(v => sanitizeUuid(v) ?? ''),
  attended: z.boolean().optional(),
}).refine(d => d.registration_id.length > 0, { message: 'Invalid registration ID' });

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const raw = await request.json();
    const parsed = checkinSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { registration_id, attended } = parsed.data;
    // ponytail: If not provided, toggle — otherwise use the provided value
    if (attended === undefined) {
      const { data: reg } = await supabase
        .from('event_registrations')
        .select('attended')
        .eq('id', registration_id)
        .single();
      if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      const { error } = await supabase
        .from('event_registrations')
        .update({ attended: !reg.attended })
        .eq('id', registration_id);
      if (error) throw error;
      await captureServerEvent('event_checkin_toggled', userId, { registration_id, attended: !reg.attended });
      return NextResponse.json({ success: true, attended: !reg.attended });
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({ attended })
      .eq('id', registration_id);

    if (error) throw error;
    await captureServerEvent('event_checkin_toggled', userId, { registration_id, attended });
    return NextResponse.json({ success: true, attended });
  } catch (err) {
    logger.error('[api/events/checkin]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "user_action") // ponytail: Uses Auth0 session for user authentication.