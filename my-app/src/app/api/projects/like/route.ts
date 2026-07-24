import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { captureServerEvent } from '@/lib/analytics/server';

const likeSchema = z.object({
  project_id: z.string().transform(v => sanitizeUuid(v) ?? ''),
}).refine(d => d.project_id.length > 0, { message: 'Invalid project ID' });

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const raw = await request.json();
    const parsed = likeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { project_id } = parsed.data;
    // Using a RPC call for toggle_like
    const { error } = await supabase.rpc('toggle_project_like', { 
      auth0_user_id: userId, 
      project_id: project_id 
    });

    if (error) throw error;
    await captureServerEvent('project_liked', userId, { project_id });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[api/projects/like]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "frequent") // ponytail: Uses Auth0 `userId` in RPC call, removed Supabase Auth.