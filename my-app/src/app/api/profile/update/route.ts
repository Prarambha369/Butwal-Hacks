import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { sanitizeName, sanitizeDescription, sanitizeUrl, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit, withPayloadLimit } from '@/lib/rate-limiter';

const updateProfileSchema = z.object({
  full_name: z.string().optional().transform(v => v ? sanitizeName(v) : v),
  bio: z.string().optional().transform(v => v ? sanitizeDescription(v) : v),
  avatar_url: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? v : v),
  github_url: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : v),
  linkedin_url: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : v),
  website: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? v : v),
  skills: z.array(z.string()).optional().transform(v => v?.map(s => sanitizeString(s, 50)).filter(Boolean)),
  socials: z.record(z.string(), z.string()).optional().transform(v => {
    if (!v) return v;
    const cleaned: Record<string, string> = {};
    for (const [key, val] of Object.entries(v)) {
      cleaned[key] = typeof val === 'string' ? sanitizeUrl(val) ?? sanitizeString(val, 200) : '';
    }
    return cleaned;
  }),
});

export const POST = withRateLimit(withPayloadLimit(async (request: Request) => {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;
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
}), "frequent") // ponytail: Aligned with Auth0-only authentication model.