/**
 * Events whose registration is run by a partner, not by the app's
 * /api/events/register flow. For these, every "Register" link on the site
 * goes straight to the partner's form (new tab), so it works on the static
 * marketing export while the app is under maintenance.
 *
 * Keyed by event slug. Add an entry when a partner runs registration.
 */
export const EXTERNAL_REGISTRATION_URLS: Readonly<Record<string, string>> = {
  // CyberUtsav 3.0, Lumbini chapter: registration is on CyberUtsav's own site.
  "cyberutsav-lumbini": "https://registration.cyberutsav.com/butwal",
};

/** The partner registration URL for an event, or null if it registers in-site. */
export function externalRegistrationUrl(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return Object.hasOwn(EXTERNAL_REGISTRATION_URLS, slug) ? EXTERNAL_REGISTRATION_URLS[slug] : null;
}
