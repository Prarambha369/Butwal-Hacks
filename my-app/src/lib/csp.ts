/**
 * Content Security Policy — single source for every CSP this app sends.
 *
 * Two policies, chosen by route:
 *
 * 1. Nonce policy (`buildNonceCsp`) for routes that already render per
 *    request: the signed-in dashboard, the sponsor portal and invite claims
 *    (`NONCE_ROUTE_PREFIXES`). `src/proxy.ts` mints a nonce per request and
 *    forwards the policy as a request header; Next.js reads the nonce from it
 *    while rendering and stamps it on its framework scripts, inline RSC
 *    payload scripts and `<Script>` tags. `script-src` has no
 *    'unsafe-inline'. `'strict-dynamic'` lets nonced scripts load further
 *    scripts (PostHog's lazy bundles, Vercel Analytics' injected tag). CSP3
 *    browsers ignore host allowlists once `'strict-dynamic'` is present; the
 *    hosts stay listed as the CSP2 fallback. The root layout's theme script is
 *    allowed by hash, so the layout never reads the nonce.
 *
 * 2. Static policy (`buildStaticCsp`) for everything else, set in
 *    next.config.ts. Marketing pages are prerendered or ISR and served from
 *    the CDN; prerendered HTML cannot carry a per-request nonce, and Next's
 *    inline RSC payload scripts differ per page and per revalidation, so they
 *    cannot be hash-listed either. These pages keep 'unsafe-inline' in
 *    script-src. Making them dynamic would move every page view from the CDN
 *    onto a function invocation, which the free hosting plan cannot absorb.
 *    Never add a nonce or hash to this policy: a browser that sees one
 *    ignores 'unsafe-inline' and the pages' inline scripts stop running.
 *
 * Domains audited against actual browser-side requests (2026-07-13):
 *   - Removed: googletagmanager.com, google-analytics.com, analytics.google.com (not loaded)
 *   - Removed: api.axiom.co, api.resend.com, api.github.com, api.groq.com (server-only)
 *   - Removed: www.gravatar.com, secure.gravatar.com (no longer generating gravatar URLs)
 *   - Added:   api.cloudinary.com (upload XHR), images.unsplash.com (blog covers)
 *   - Added:   res.cloudinary.com (CDN images), api.dicebear.com (avatar fallbacks)
 *   - Fonts:   'self' only — next/font self-hosts after migration
 *
 * frame-ancestors is per-route: `/widget/*` is embeddable (`*`), everything
 * else is `'none'`. X-Frame-Options is not used because it cannot vary per
 * route alongside CSP.
 */

import { THEME_INIT_SCRIPT_SHA256 } from "./theme-script";

export const CSP_REPORT_PATH = "/api/csp-violation";
/** Reporting API group name used by `report-to` and `Reporting-Endpoints`. */
export const CSP_REPORT_GROUP = "csp-endpoint";

/**
 * Routes that get the nonce policy. Every URL matched here must be
 * dynamically rendered: a prerendered page carries no nonce, so its scripts
 * would be blocked. That includes 404s — an unmatched URL normally renders the
 * prerendered global /_not-found page — which is why /dashboard and /portal
 * have catch-all pages that call notFound() inside their force-dynamic
 * layouts, and why /claim is matched only as /claim/<token>.
 */
export const NONCE_ROUTE_PREFIXES = ["/dashboard", "/portal"] as const;
const CLAIM_ROUTE = /^\/claim\/[^/]+$/;

const SCRIPT_HOSTS = [
  "https://auth.butwalhacks.com",
  "https://*.posthog.com",
  "https://va.vercel-scripts.com",
];

const SHARED_DIRECTIVES = [
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://images.unsplash.com https://res.cloudinary.com https://api.dicebear.com https://api.qrserver.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://media.licdn.com https://cdn.auth0.com https://s.gravatar.com",
  "font-src 'self'",
  // Gallery videos are served from Cloudinary; without this, default-src
  // 'self' blocks them.
  "media-src 'self' https://res.cloudinary.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "connect-src 'self' https://vitals.vercel-insights.com https://auth.butwalhacks.com https://app.butwalhacks.com https://*.posthog.com https://api.cloudinary.com https://*.supabase.co wss://*.supabase.co https://*.ingest.us.sentry.io",
  `report-uri ${CSP_REPORT_PATH}`,
  `report-to ${CSP_REPORT_GROUP}`,
];

function devEval(): string[] {
  return process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : [];
}

function join(directives: string[]): string {
  return `${directives.join("; ")};`;
}

/** Whether `pathname` is served with the nonce policy. */
export function usesNonceCsp(pathname: string): boolean {
  return (
    CLAIM_ROUTE.test(pathname) ||
    NONCE_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

/** A fresh, unguessable nonce (128 bits, base64). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Nonce policy for a dynamically rendered page. No 'unsafe-inline'. */
export function buildNonceCsp(nonce: string): string {
  const scriptSrc = [
    "script-src 'self'",
    `'nonce-${nonce}'`,
    `'sha256-${THEME_INIT_SCRIPT_SHA256}'`,
    "'strict-dynamic'",
    ...devEval(),
    ...SCRIPT_HOSTS,
  ].join(" ");
  return join(["default-src 'self'", scriptSrc, ...SHARED_DIRECTIVES, "frame-ancestors 'none'"]);
}

/** Static policy for CDN-cached pages, API routes and files. */
export function buildStaticCsp(widget: boolean): string {
  const scriptSrc = ["script-src 'self' 'unsafe-inline'", ...devEval(), ...SCRIPT_HOSTS].join(" ");
  return join([
    "default-src 'self'",
    scriptSrc,
    ...SHARED_DIRECTIVES,
    widget ? "frame-ancestors *" : "frame-ancestors 'none'",
  ]);
}

/**
 * `Reporting-Endpoints` header value. The relative URL resolves against the
 * response URL, so reports go to whichever host served the page.
 */
export const REPORTING_ENDPOINTS = `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`;
