import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { normalizeSocialUrl, validateSocialUrl, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { withSentrySpan } from '@/lib/sentry-span';

const updateProfileSchema = z.object({
  full_name: z.string().optional().transform(v => v ? sanitizeString(v, 100) : v),
  bio: z.string().optional().transform(v => v ? sanitizeString(v, 2000) : v),
  avatar_url: z.string().optional().transform(v => v ? normalizeSocialUrl(v) ?? v : v),
  github_url: z.string().optional().transform(v => v ? validateSocialUrl('github', v) ?? '' : v),
  linkedin_url: z.string().optional().transform(v => v ? validateSocialUrl('linkedin', v) ?? '' : v),
  website: z.string().optional().transform(v => v ? normalizeSocialUrl(v) ?? v : v),
  skills: z.array(z.string()).optional().transform(v => v?.map(s => sanitizeString(s, 50)).filter(Boolean)),
  socials: z.record(z.string(), z.string()).optional().transform(v => {
    if (!v) return v;
    const cleaned: Record<string, string> = {};
    for (const [key, val] of Object.entries(v)) {
      cleaned[key] = typeof val === 'string' ? normalizeSocialUrl(val) ?? '' : '';
    }
    return cleaned;
  }),
});

export const POST = withSentrySpan("POST /api/profile/update", withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;
    const raw = await request.json();
    const parsed = updateProfileSchema.safeParse(raw);
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
    logger.error('[api/profile/update]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "frequent")) // ponytail: Aligned with Auth0-only authentication model.