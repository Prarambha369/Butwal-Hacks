import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit, withPayloadLimit } from '@/lib/rate-limiter';
import { captureServerEvent } from '@/lib/analytics/server';

const completeResourceSchema = z.object({
  resource_id: z.string().transform(v => sanitizeUuid(v) ?? ''),
}).refine(d => d.resource_id.length > 0, { message: 'Invalid resource ID' });

export const POST = withRateLimit(withPayloadLimit(async (request: Request) => {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;
    const raw = await request.json();
    const parsed = completeResourceSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { resource_id } = parsed.data;
    const { error } = await supabase
      .from('resource_completions')
      .upsert({ resource_id, auth0_user_id: userId, completed_at: new Date().toISOString() });

    if (error) throw error;
    await captureServerEvent('resource_completed', userId, { resource_id });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[api/resources/complete]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}), "frequent") // ponytail: Uses Auth0 user ID, replaced Supabase Auth.