import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeString, sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';

const createTeamSchema = z.object({
  name: z.string().min(1).transform(v => sanitizeString(v, 100)),
  event_id: z.string().optional().transform(v => v ? sanitizeUuid(v) ?? v : v),
});

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;

    // ponytail: Look up profile UUID for profile_id FK
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 400 });

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

    logger.info('Team created', { team_id: team.id, has_event: !!event_id, auth0_user_id: userId });

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (err) {
    logger.error('Team creation failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error('[api/teams]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "user_action") // ponytail: Uses Auth0 session, removed dependency on Supabase Auth.