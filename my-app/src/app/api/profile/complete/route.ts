import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { normalizeSocialUrl, validateSocialUrl, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';

const completeProfileSchema = z.object({
  full_name: z.string().min(1).transform(v => sanitizeString(v, 100)),
  bio: z.string().optional().transform(v => v ? sanitizeString(v, 2000) : v),
  github: z.string().optional().transform(v => v ? validateSocialUrl('github', v) ?? '' : v),
  linkedin: z.string().optional().transform(v => v ? validateSocialUrl('linkedin', v) ?? '' : v),
  website: z.string().optional().transform(v => v ? normalizeSocialUrl(v) ?? '' : v),
  skills: z.array(z.string()).optional().transform(v => v?.map(s => sanitizeString(s, 50)).filter(Boolean)),
});

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const raw = await request.json();
    const parsed = completeProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
    }
    const body = parsed.data;
    const { error } = await supabase
      .from('profiles')
      .update(body)
      .eq('auth0_user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[api/profile/complete]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "user_action") // ponytail: Migrated to Auth0 authentication, replacing Supabase Auth.