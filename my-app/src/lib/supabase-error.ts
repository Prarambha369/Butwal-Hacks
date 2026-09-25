/**
 * supabase-error.ts -- turn PostgREST/Supabase errors into something we can
 * act on.
 *
 * Every service-role call in this app funnels through Supabase, and until now
 * the driver error was logged and then thrown away in favour of a generic
 * "Please try again." That made three very different failures indistinguishable
 * to the user *and* to us: a misconfigured environment, a table that never got
 * migrated, and a genuine RLS/permission problem.
 *
 * `describeSupabaseError` splits the error into:
 *   - `diagnostic` -- full detail, safe for server logs and Sentry
 *   - `userMessage` -- short, actionable, safe to show a user. Never contains
 *     schema names, keys, or SQL.
 */

/** Shape of a PostgREST error as returned by supabase-js. */
export interface SupabaseErrorLike {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

const GENERIC = "Something went wrong on our side. Please try again.";

/**
 * Recognised Supabase/PostgREST error codes.
 * @see https://postgrest.org/en/stable/references/errors.html
 */
const KNOWN_CODES: Record<string, string> = {
  // createServiceClient() substitutes an inert client when config is missing.
  SUPABASE_NOT_CONFIGURED:
    "This feature is temporarily unavailable. Please try again shortly.",

  // PostgREST schema cache is stale -- the table exists in Postgres but the
  // API has not picked it up yet (or the migration never ran).
  PGRST205:
    "This feature is being set up. Please try again in a few minutes.",

  // 42P01 undefined_table / 42703 undefined_column
  "42P01": "This feature is being set up. Please try again in a few minutes.",
  "42703": "This feature is being set up. Please try again in a few minutes.",

  // 42501 insufficient_privilege -- RLS or a missing grant.
  "42501": "You do not have permission to do that.",

  // 23505 unique_violation
  "23505": "You already have a pending request for this.",

  // 23514 check_violation -- a CHECK constraint rejected the row.
  "23514": "That request did not meet the required format.",
};

export interface DescribedSupabaseError {
  /** Full detail for server logs / Sentry. */
  diagnostic: string;
  /** Short, safe to render in the UI. */
  userMessage: string;
}

export function describeSupabaseError(error: unknown): DescribedSupabaseError {
  if (!error || typeof error !== "object") {
    return { diagnostic: `Non-error thrown: ${String(error)}`, userMessage: GENERIC };
  }

  const err = error as SupabaseErrorLike;
  const code = err.code ?? "";
  const message = err.message ?? "unknown error";
  const details = err.details ? ` | details: ${err.details}` : "";
  const hint = err.hint ? ` | hint: ${err.hint}` : "";

  const diagnostic = `[${code || "no-code"}] ${message}${details}${hint}`;

  return { diagnostic, userMessage: KNOWN_CODES[code] ?? GENERIC };
}
