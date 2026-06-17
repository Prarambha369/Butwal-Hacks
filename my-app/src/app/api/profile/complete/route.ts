import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { sanitizeName, sanitizeDescription, sanitizeUrl, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit, withPayloadLimit } from '@/lib/rate-limiter';
import { captureServerEvent } from '@/lib/analytics/server';

const completeProfileSchema = z.object({
  full_name: z.string().min(1).transform(v => sanitizeName(v)),
  bio: z.string().optional().transform(v => v ? sanitizeDescription(v) : v),
  github: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : v),
  linkedin: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : v),
  website: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : v),
  skills: z.array(z.string()).optional().transform(v => v?.map(s => sanitizeString(s, 50)).filter(Boolean)),
});

export const POST = withRateLimit(withPayloadLimit(async (request: Request) => {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;
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
    await captureServerEvent('profile_completed', userId, {
      has_bio: !!body.bio,
      has_github: !!body.github,
      has_linkedin: !!body.linkedin,
      has_website: !!body.website,
      skills_count: body.skills?.length ?? 0,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[api/profile/complete]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}), "user_action") // ponytail: Migrated to Auth0 authentication, replacing Supabase Auth.