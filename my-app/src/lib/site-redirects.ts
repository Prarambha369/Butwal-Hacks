/**
 * Consolidation redirects (permanent, SEO-safe): merged routes keep their
 * link equity by redirecting old URLs to their canonical homes.
 *
 * One list, two consumers: next.config.ts `redirects()` (Vercel) and the
 * `_redirects` file of the static marketing site (lib/static-site.ts).
 */
export type SiteRedirect = { source: string; destination: string; permanent: true };

export const SITE_REDIRECTS: SiteRedirect[] = [
  // /events/list was a near-duplicate of /events (which already has
  // upcoming/past tabs) and leaked DRAFT events publicly.
  { source: "/events/list", destination: "/events", permanent: true },
  // /programs/* folded into initiatives (single completed instance).
  { source: "/programs/annual-hackathon", destination: "/initiatives/hackathon", permanent: true },
  { source: "/programs", destination: "/initiatives", permanent: true },
  // /philosophy folded into /about#philosophy (the definition of us).
  { source: "/philosophy", destination: "/about#philosophy", permanent: true },
  // /profile/[bh_id] was byte-identical to /p/[slug_id] (same query,
  // same component). /p wins: shorter, ISR-cached, per-profile SEO.
  // NOTE: single named param only — a :path* wildcard corrupts Next's
  // generated route types (routes.d.ts) on this version.
  { source: "/profile/:bh_id", destination: "/p/:bh_id", permanent: true },
  // /community folded into /explore (directory, platforms, and the
  // sole testimonials surface all moved there).
  { source: "/community", destination: "/explore", permanent: true },
  // /initiatives list folded into /events#initiatives (detail pages
  // at /initiatives/[slug] stay).
  { source: "/initiatives", destination: "/events#initiatives", permanent: true },
  // /donors folded into /partners#donors (single recognition wall).
  { source: "/donors", destination: "/partners#donors", permanent: true },
  // /opportunities folded into /support#opportunities (listings live
  // on the sponsor page now).
  { source: "/opportunities", destination: "/support#opportunities", permanent: true },
  // /annual-report folded into /transparency?view=report (tab).
  { source: "/annual-report", destination: "/transparency?view=report", permanent: true },
  // Auth stubs consolidated: one /sign-in entry (mode + returnTo
  // passthrough) in front of Auth0 Universal Login.
  { source: "/login", destination: "/sign-in", permanent: true },
  { source: "/sign-up", destination: "/sign-in?mode=signup", permanent: true },
  // /resources + /docs index folded into /learn (docs subpages stay).
  { source: "/resources", destination: "/learn#resources", permanent: true },
  { source: "/docs", destination: "/learn#guides", permanent: true },
];
