import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { createServiceClient } from '@/utils/supabase';
import { z } from 'zod';
import { sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';

const reviewSchema = z.object({
  event_id: z.string().transform(v => sanitizeUuid(v) ?? ''),
  rating: z.number().int().min(1).max(5),
}).refine(d => d.event_id.length > 0, { message: 'Invalid event ID' });

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const raw = await request.json();
    const parsed = reviewSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }
    const { event_id, rating } = parsed.data;
    const { error } = await supabase
      .from('event_reviews')
      .upsert({ event_id, auth0_user_id: session.user.sub, rating });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[api/reviews]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "sensitive")