import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { sanitizeUuid, rejectOversized } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { captureServerEvent } from '@/lib/analytics/server';
import { posthogLog } from '@/lib/posthog-logger';

const registerSchema = z.object({
  event_id: z.string().transform(v => sanitizeUuid(v) ?? ''),
}).refine(d => d.event_id.length > 0, { message: 'Invalid event ID' });

export const POST = withRateLimit(async (request: Request) => {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;

    // ponytail: Look up profile UUID to satisfy profile_id FK (UUID, not Clerk user_xxx)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();
    if (!profile) return NextResponse.json({ error: 'Profile not found — finish onboarding' }, { status: 400 });

    // Idempotency: check for duplicate submission
    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('idempotency_keys')
        .select('key')
        .eq('key', idempotencyKey)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }
    }

    // ponytail: reject oversized payloads before parsing — 1 MB limit
    const oversized = rejectOversized(request); if (oversized) return oversized
    const raw = await request.json();
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { event_id } = parsed.data;
    const { error } = await supabase
      .from('event_registrations')
      .insert({ event_id, profile_id: profile.id });

    if (error) throw error;

    // Record idempotency key after successful insert
    if (idempotencyKey) {
      await supabase.from('idempotency_keys').insert({ key: idempotencyKey });
    }

    await captureServerEvent('event_registered', userId, { event_id });

    posthogLog.info('Event registration completed', { event_id, auth0_user_id: userId });

    return NextResponse.json({ success: true });
  } catch (err) {
    posthogLog.error('Event registration failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error('[api/events/register]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
})