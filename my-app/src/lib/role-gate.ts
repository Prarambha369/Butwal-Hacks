/**
 * Role gating for the dashboard layouts.
 *
 * The bug this replaces: every layout guarded with a truthiness test,
 *
 *   if (profile?.role && profile.role !== "maintainer") {
 *     redirect(`/dashboard/${profile.role}`);
 *   }
 *
 * When `profile` is null, `profile?.role` is `undefined`, which is falsy, so
 * the whole guard was skipped and the privileged dashboard rendered. That is
 * reachable whenever the bootstrap in `dashboard/layout.tsx` fails to create
 * the `profiles` row -- the atomic `create_profile_with_bh_id` RPC errors and
 * the `insert` fallback errors too -- leaving the layout as the only remaining
 * check, and the only remaining check passed.
 *
 * So an *unknown* role must be treated the same as a *wrong* one: both fail
 * closed. `undefined` therefore redirects to `/dashboard/hacker`, the one
 * dashboard whose layout cannot fail closed against itself (it is the landing
 * page that performs the bootstrap), rather than to `/dashboard/undefined`.
 *
 * `requireRole` in `proxy-helpers.ts` applies the same rule at the middleware
 * boundary, so this is the second of two independent checks, not the only one.
 */
export function roleRedirect(
  role: string | undefined | null,
  allowed: readonly string[],
): string | null {
  if (role && allowed.includes(role)) return null;
  return role ? `/dashboard/${role}` : "/dashboard/hacker";
}
