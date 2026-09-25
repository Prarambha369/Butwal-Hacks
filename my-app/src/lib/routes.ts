/**
 * routes.ts -- canonical internal route paths.
 *
 * Profile settings used to be reachable only at `/dashboard/hacker/profile`,
 * which lives under the hacker layout. That layout bounces organizer and
 * sponsor users to their own dashboards, so those roles could never open
 * their own profile settings. `/dashboard/profile` is the role-neutral alias
 * (see `app/(main)/dashboard/profile/page.tsx`) and requires only that the
 * visitor is authenticated.
 *
 * There are now two URLs serving the same page, which is exactly the setup
 * that lets a path drift out of sync with the route that actually exists.
 * Everything links through the constants below; the hacker path is kept only
 * as a legacy entry point for bookmarks and older deep links.
 */

/** Role-neutral profile settings. Use this for every new link. */
export const PROFILE_SETTINGS_PATH = "/dashboard/profile";

/**
 * Legacy role-scoped path. Still served, still valid, but it inherits the
 * hacker layout's role guard -- do not link to it.
 */
export const LEGACY_HACKER_PROFILE_PATH = "/dashboard/hacker/profile";

/** The hacker dashboard landing route, used after role selection. */
export const HACKER_DASHBOARD_PATH = "/dashboard/hacker";
