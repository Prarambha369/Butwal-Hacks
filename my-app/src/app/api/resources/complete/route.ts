import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';

const completeResourceSchema = z.object({
  resource_id: z.string().transform(v => sanitizeUuid(v) ?? ''),
}).refine(d => d.resource_id.length > 0, { message: 'Invalid resource ID' });

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const raw = await request.json();
    const parsed = completeResourceSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { resource_id } = parsed.data;

    // resource_completions is keyed by profile_id (migration 035). Writing
    // `auth0_user_id` referenced a column that does not exist, so the upsert
    // failed with 42703 and no completion was ever recorded.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();

    if (profileError || !profile) {
      logger.warn('[api/resources/complete] No profile for session subject', {
        code: profileError?.code ?? null,
      });
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // onConflict names the primary key so a repeat submission updates the
    // existing row instead of colliding.
    const { error } = await supabase
      .from('resource_completions')
      .upsert(
        { profile_id: profile.id, resource_id, completed_at: new Date().toISOString() },
        { onConflict: 'profile_id,resource_id' },
      );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[api/resources/complete]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "frequent");