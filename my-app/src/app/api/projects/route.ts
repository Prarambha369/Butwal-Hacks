import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { sanitizeTitle, sanitizeDescription, sanitizeUrl, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit, withPayloadLimit } from '@/lib/rate-limiter';
import { captureServerEvent } from '@/lib/analytics/server';

const createProjectSchema = z.object({
  title: z.string().min(1).transform(v => sanitizeTitle(v)),
  description: z.string().min(1).transform(v => sanitizeDescription(v)),
  github_url: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : ''),
  demo_url: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : ''),
  cover_image: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : ''),
  tech_stack: z.array(z.string()).optional().transform(v => v?.map(t => sanitizeString(t, 50)).filter(Boolean) ?? []),
  event_id: z.string().optional(),
  team_id: z.string().optional(),
});

export const POST = withRateLimit(withPayloadLimit(async (request: Request) => {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;

    // Idempotency: check for duplicate submission
    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('idempotency_keys')
        .select('key')
        .eq('key', idempotencyKey)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ success: true, message: 'Already processed' }, { status: 200 });
      }
    }

    const raw = await request.json();
    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid project data' }, { status: 400 });
    }
    const body = parsed.data;

    // ponytail: Resolve profile UUID for profile_id FK
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 400 });

    const { error } = await supabase
      .from('projects')
      .insert({ ...body, profile_id: profile.id });

    if (error) throw error;

    // Record idempotency key after successful insert
    if (idempotencyKey) {
      await supabase.from('idempotency_keys').insert({ key: idempotencyKey });
    }

    await captureServerEvent('project_created', userId, {
      has_github_url: !!body.github_url,
      has_demo_url: !!body.demo_url,
      tech_stack_count: body.tech_stack?.length ?? 0,
      has_event: !!body.event_id,
      has_team: !!body.team_id,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    logger.error('[api/projects]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}), "sensitive")