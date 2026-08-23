import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeUrl, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';


const createProjectSchema = z.object({
  title: z.string().min(1).transform(v => sanitizeString(v, 200)),
  description: z.string().min(1).transform(v => sanitizeString(v, 2000)),
  github_url: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : ''),
  demo_url: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : ''),
  cover_image: z.string().optional().transform(v => v ? sanitizeUrl(v) ?? '' : ''),
  tech_stack: z.array(z.string()).optional().transform(v => v?.map(t => sanitizeString(t, 50)).filter(Boolean) ?? []),
  event_id: z.string().optional(),
  team_id: z.string().optional(),
});

/**
 * GET /api/projects
 *
 * Returns a paginated list of projects for the authenticated user.
 * Includes projects owned by the user and projects from teams they belong to.
 * Cache: private, max-age=60 — per-user response.
 */
export async function GET(request: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const userId = session.user.sub;
    const u = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(u.searchParams.get("limit") ?? "", 10) || 50));
    const offset = Math.max(0, parseInt(u.searchParams.get("offset") ?? "", 10) || 0);

    // Resolve profile UUID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ projects: [], pagination: { limit, offset, hasMore: false } }, {
        headers: { "Cache-Control": "private, max-age=60" },
      });
    }

    // Get team memberships to include team projects
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('profile_id', profile.id);

    const teamIds = memberships?.map(m => m.team_id) || [];

    // Build query — include own projects and team projects
    let query = supabase
      .from('projects')
      .select('id, title, description, tech_stack, category, cover_image, created_at, updated_at, profile_id, event_id, team_id, github_url', { count: 'exact' });

    if (teamIds.length > 0) {
      query = query.or(`profile_id.eq.${profile.id},team_id.in.(${teamIds.join(',')})`);
    } else {
      query = query.eq('profile_id', profile.id);
    }

    const { data: projects, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      projects: projects || [],
      pagination: { limit, offset, hasMore: (count ?? 0) >= limit },
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    logger.error('[api/projects] GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const userId = session.user.sub;

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


    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    logger.error('[api/projects]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "sensitive")