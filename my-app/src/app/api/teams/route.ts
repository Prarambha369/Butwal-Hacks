import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { sanitizeName, sanitizeUuid, rejectOversized } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { captureServerEvent } from '@/lib/analytics/server';
import { posthogLog } from '@/lib/posthog-logger';

const createTeamSchema = z.object({
  name: z.string().min(1).transform(v => sanitizeName(v)),
  event_id: z.string().optional().transform(v => v ? sanitizeUuid(v) ?? v : v),
});

export const POST = withRateLimit(async (request: Request) => {
  try {
    const authClient = await createAuthenticatedClient();
    if (!authClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabase, userId } = authClient;

    // ponytail: Look up profile UUID for profile_id FK
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 400 });

    // ponytail: reject oversized payloads before parsing — 1 MB limit
    const oversized = rejectOversized(request); if (oversized) return oversized
    const raw = await request.json();
    const parsed = createTeamSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid team data' }, { status: 400 });
    }
    const { name, event_id } = parsed.data;
    const { data: team, error } = await supabase
      .from('teams')
      .insert({ name, event_id })
      .select()
      .single();

    if (error) throw error;

    const { error: memberError } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, profile_id: profile.id, is_captain: true });

    if (memberError) throw memberError;
    await captureServerEvent('team_created', userId, { team_id: team.id, has_event: !!event_id });

    posthogLog.info('Team created', { team_id: team.id, has_event: !!event_id, auth0_user_id: userId });

    return NextResponse.json({ success: true, team });
  } catch (err) {
    posthogLog.error('Team creation failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error('[api/teams]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}) // ponytail: Refactored to leverage Clerk and removed dependency on Supabase Auth.