import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase';
import { auth0 } from '@/lib/auth0';
import { z } from 'zod';
import { sanitizeUuid } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { withSentrySpan } from '@/lib/sentry-span';
import { POLICY_VERSION } from '@/lib/policy-registry';

/**
 * Registration consent.
 *
 * The three acceptances are required: without them the registration is not
 * complete and no row is written. The marketing opt-in is optional and
 * defaults to off — consent is refused, not assumed.
 *
 * The exact wording shown to the person is in `policies/REGISTRATION_NOTICES.md`.
 */
const consentSchema = z.object({
  code_of_conduct: z.boolean().refine((v) => v === true, {
    message: 'You must accept the Code of Conduct',
  }),
  rules: z.boolean().refine((v) => v === true, {
    message: 'You must accept the Hackathon Rules',
  }),
  privacy: z.boolean().refine((v) => v === true, {
    message: 'You must accept the Privacy Policy',
  }),
  marketing: z.boolean().optional().default(false),
});

const registerSchema = z
  .object({
    event_id: z.string().transform((v) => sanitizeUuid(v) ?? ''),
    consent: consentSchema,
  })
  .refine((d) => d.event_id.length > 0, { message: 'Invalid event ID' });

export const POST = withSentrySpan("POST /api/events/register", withRateLimit(async (request: Request) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parse the body before it reaches the database. Nothing unvalidated is
    // used in a query, and a body that is missing its consent never gets as
    // far as a write.
    const raw = await request.json();
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      // A bad event id is an invalid request. A missing consent gets its own
      // message: the person needs to know which box is missing, not that
      // "the request was invalid".
      const hasEventIssue = parsed.error.issues.some((issue) => issue.path[0] === 'event_id');
      if (!hasEventIssue && parsed.error.issues.some((issue) => issue.path[0] === 'consent')) {
        return NextResponse.json(
          {
            error:
              'You must accept the Code of Conduct, the Hackathon Rules, and the Privacy Policy to register.',
          },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { event_id, consent } = parsed.data;

    const supabase = createServiceClient();
    const userId = session.user.sub;

    // ponytail: Look up profile UUID to satisfy profile_id FK (UUID, not auth0_user_id string)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth0_user_id', userId)
      .single();
    if (!profile) return NextResponse.json({ error: 'Profile not found — finish onboarding' }, { status: 400 });

    // Idempotency: check for duplicate submission
    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('idempotency_keys')
        .select('key')
        .eq('key', idempotencyKey)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('event_registrations')
      .insert({
        event_id,
        profile_id: profile.id,
        code_of_conduct_accepted_at: now,
        rules_accepted_at: now,
        privacy_accepted_at: now,
        policy_version: POLICY_VERSION,
        marketing_opt_in: consent.marketing,
      });

    if (error) {
      // 23505: the unique (event_id, profile_id) constraint fired — this
      // person is already registered. That is a conflict, not a server error.
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "You're already registered for this event" },
          { status: 409 },
        );
      }
      throw error;
    }

    // Record idempotency key after successful insert
    if (idempotencyKey) {
      await supabase.from('idempotency_keys').insert({ key: idempotencyKey });
    }

    logger.info('Event registration completed', {
      event_id,
      auth0_user_id: userId,
      policy_version: POLICY_VERSION,
      marketing_opt_in: consent.marketing,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    logger.error('Event registration failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error('[api/events/register]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}, "user_action"));
