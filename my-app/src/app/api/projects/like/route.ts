import { NextResponse, type NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { corsPreflight, withCors } from '@/lib/cors';
import { toggleProjectLike } from '@/lib/actions/projects';

const likeSchema = z.object({
  project_id: z.string().transform(v => sanitizeUuid(v) ?? ''),
}).refine(d => d.project_id.length > 0, { message: 'Invalid project ID' });

/**
 * POST /api/projects/like — toggle the signed-in member's like on a project.
 *
 * Called by components/projects/like-button.tsx, cross-origin from the static
 * marketing site (lib/cors.ts). It used to call a `toggle_project_like` RPC
 * that no migration defines; it now runs the same toggle as the server action.
 */
export const OPTIONS = corsPreflight;

export const POST = withCors(withRateLimit(async (request: NextRequest) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const raw: unknown = await request.json().catch(() => null);
    const parsed = likeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    // toggleProjectLike resolves the profile from the same session.
    await toggleProjectLike(parsed.data.project_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[api/projects/like]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "frequent"));
