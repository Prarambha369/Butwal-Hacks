/**
 * Development-only escape hatch for the Auth0 role gate.
 *
 * Local development has no Auth0 session, so without this the dashboard
 * redirects every request to /auth/login and nothing is reachable. It is
 * therefore an explicit opt-in (`DEV_AUTH_BYPASS=true`) rather than a bare
 * `NODE_ENV !== "production"` check: the Playwright suite runs against
 * `next dev`, and its RBAC and avatar specs assert real 307 redirects. A
 * blanket non-production bypass made those routes return 200 and turned the
 * gate off in tests, which is the worst of both worlds.
 *
 * `NODE_ENV=test` never satisfies this — Vitest sets it, so the unit tests
 * in `src/__tests__/proxy.test.ts` keep exercising the real authorization
 * path. `next build && next start` is production, so CI and Vercel are
 * unaffected either way.
 *
 * Keep this module dependency-free: it is imported from `proxy.ts`, which
 * runs on the edge runtime.
 */
export function isDevAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_AUTH_BYPASS === "true"
  );
}

/**
 * The single identity every dashboard surface adopts when there is no
 * session. `dashboard/layout.tsx`, `dashboard/hacker/layout.tsx` and
 * `dashboard/hacker/page.tsx` previously used `dev-user`, `none` and a
 * NODE_ENV-conditional value respectively, so the profile created by the
 * parent layout was never the one the child looked up.
 */
export const DEV_USER_ID = "dev-user";
