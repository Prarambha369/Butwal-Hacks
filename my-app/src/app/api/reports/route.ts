import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeString, sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { withSentrySpan } from '@/lib/sentry-span';
import { accessSubjectFor, isMaintainer } from '@/lib/dashboard-access';

/**
 * Reports about a project or an event: code of conduct violations, and
 * suspected cheating.
 *
 * The handling procedure is `policies/CHEATING_RESPONSE.md` and
 * `policies/INCIDENT_RESPONSE.md`. The short version: reports are handled
 * discreetly, the reporter may stay anonymous, and nobody is named publicly.
 *
 * A report is never a verdict. Creating one starts a review.
 */

const createReportSchema = z.object({
  category: z.enum(['code_of_conduct', 'cheating', 'other']),
  details: z
    .string()
    .trim()
    .min(20, "Please describe what happened in a little more detail")
    .max(2000)
    .transform((v) => sanitizeString(v, 2000)),
  project_id: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeUuid(v) ?? null : null)),
  event_id: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeUuid(v) ?? null : null)),
  subject_profile_id: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeUuid(v) ?? null : null)),
  anonymous: z.boolean().optional().default(false),
});

const updateReportSchema = z.object({
  id: z.string().transform((v) => sanitizeUuid(v) ?? ''),
  status: z.enum(['open', 'under_review', 'resolved', 'dismissed']),
  resolution: z.string().max(2000).optional().transform((v) => (v ? sanitizeString(v, 2000) : v)),
}).refine((d) => d.id.length > 0, { message: 'Invalid report ID' });

interface Caller {
  id: string;
  isMaintainer: boolean;
}

/**
 * Resolve the caller and their authority.
 *
 * Staff authority is the shared predicate from `dashboard-access.ts`: the
 * maintainer role AND a verified address on the staff domain. Re-deriving
 * `role === 'maintainer'` here would accept an account that the dashboard
 * layout refuses.
 */
async function resolveCaller(
  supabase: ReturnType<typeof createServiceClient>,
  sessionUser: { sub: string; email?: string | null; email_verified?: boolean },
): Promise<Caller | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth0_user_id', sessionUser.sub)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    isMaintainer: isMaintainer(accessSubjectFor(sessionUser, profile)),
  };
}

export const POST = withSentrySpan("POST /api/reports", withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const raw = await request.json();
    const parsed = createReportSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 },
      );
    }
    const body = parsed.data;

    if (!body.project_id && !body.event_id) {
      return NextResponse.json(
        { error: 'A report has to be about a project or an event' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const caller = await resolveCaller(supabase, session.user);

    // An anonymous report stores no reference to the reporter at all -- and
    // the request log says nothing about who filed it either. A caller with
    // no profile row is treated as anonymous for the same reason: there is no
    // identity to attach, and a NULL reported_by with
    // reporter_anonymous = false would be ambiguous.
    const anonymous = body.anonymous || !caller;

    const { data, error } = await supabase
      .from('conduct_reports')
      .insert({
        category: body.category,
        details: body.details,
        project_id: body.project_id,
        event_id: body.event_id,
        subject_profile_id: body.subject_profile_id,
        reported_by: anonymous ? null : caller!.id,
        reporter_anonymous: anonymous,
        status: 'open',
      })
      .select('id')
      .single();

    if (error) throw error;

    logger.info('Conduct report filed', {
      report_id: data.id,
      category: body.category,
      anonymous,
      // The reporter's identity is not logged for an anonymous report.
      ...(anonymous ? {} : { auth0_user_id: session.user.sub }),
    });

    return NextResponse.json(
      {
        success: true,
        report_id: data.id,
        message:
          'Thank you. Your report has been received and will be handled discreetly.',
      },
      { status: 201 },
    );
  } catch (err) {
    logger.error('[api/reports] POST failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "public_form"));

/**
 * GET /api/reports
 *
 * Maintainers see every report, in full. An organizer sees only what they
 * need to act on reports about their own events: the fact that a report
 * exists, what it is about, and where it stands. The reporter, the accused
 * party, and the report text are not theirs to read -- the policy says the
 * identity of a reporter is never disclosed, and a free-text report body
 * routinely names people.
 */
export const GET = withSentrySpan("GET /api/reports", withRateLimit(async (_request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const caller = await resolveCaller(supabase, session.user);
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let query = supabase
      .from('conduct_reports')
      .select(
        caller.isMaintainer
          ? `
        id, category, details, status, resolution, created_at, updated_at,
        event_id, project_id, reported_by, reporter_anonymous,
        subject_profile_id, resolved_by, resolved_at
      `
          : `
        id, category, status, created_at, updated_at,
        event_id, project_id, reporter_anonymous
      `,
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (!caller.isMaintainer) {
      // Organizers only see reports about events they run.
      const { data: ownedEvents } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', caller.id);
      const eventIds = (ownedEvents ?? []).map((e) => e.id);
      if (eventIds.length === 0) {
        return NextResponse.json({ reports: [] }, { status: 200 });
      }
      query = query.in('event_id', eventIds);
    }

    const { data: reports, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      { reports: reports ?? [] },
      { headers: { 'Cache-Control': 'private, max-age=0' } },
    );
  } catch (err) {
    logger.error('[api/reports] GET failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "frequent"));

/**
 * PATCH /api/reports
 *
 * Move a report through the workflow. Maintainers only: an organizer may
 * file and see that a report exists, but the decision on one is not theirs
 * to make.
 */
export const PATCH = withSentrySpan("PATCH /api/reports", withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const raw = await request.json();
    const parsed = updateReportSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const body = parsed.data;

    const supabase = createServiceClient();
    const caller = await resolveCaller(supabase, session.user);
    if (!caller || !caller.isMaintainer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const closing = body.status === 'resolved' || body.status === 'dismissed';
    if (closing && !body.resolution) {
      return NextResponse.json(
        { error: 'A closed report needs a written resolution' },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = { status: body.status };
    if (body.resolution !== undefined) updates.resolution = body.resolution;
    if (closing) {
      updates.resolved_by = caller.id;
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('conduct_reports')
      .update(updates)
      .eq('id', body.id)
      .select('id, status')
      .single();

    if (error) throw error;

    logger.info('Conduct report updated', {
      report_id: data.id,
      status: body.status,
      actor: caller.id,
    });

    return NextResponse.json({ success: true, report: data });
  } catch (err) {
    logger.error('[api/reports] PATCH failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "user_action"));
