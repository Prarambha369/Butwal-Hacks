/**
 * App maintenance notice for the static marketing site.
 *
 * app.butwalhacks.com is paused on Vercel until 26 December 2026. While this
 * is set, the static site (scripts/build-static.mjs) does not send visitors
 * to the app: every app path (sign-in, dashboard, portal, profiles, /api, ...)
 * serves the "Under maintenance" page instead of redirecting, and every page
 * shows a banner saying so.
 *
 * TO END MAINTENANCE: set APP_MAINTENANCE to null and rebuild. The banner,
 * the maintenance rewrites and the page's place in the export all key off
 * this one value. Vercel builds are never affected.
 */
export const APP_MAINTENANCE: { backBy: string } | null = { backBy: "26 December 2026" };

/** The page every app path serves during maintenance. */
export const MAINTENANCE_PATH = "/maintenance";

/** True in the static export while maintenance is on. Server and build only. */
export function isAppMaintenance(): boolean {
  return APP_MAINTENANCE !== null && process.env.BUILD_TARGET === "static";
}
