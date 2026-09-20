import type { NextConfig } from "next";
import path from "path";

/**
 * next.config.ts — production Next.js configuration for Butwal Hacks.
 *
 * Key settings:
 *  - poweredByHeader: disabled (removes "X-Powered-By: Next.js" response header)
 *  - reactStrictMode: enabled (catches common React pitfalls early)
 *  - images.remotePatterns: whitelist for external images (CDN, avatars)
 *  - Security headers: CSP (per-route frame-ancestors), HSTS, X-Content-Type-Options
 *  - Sentry: error monitoring via withSentryConfig wrapper
 */

// ─── Content Security Policy (Enforcement) ───────────────────────
// Switched to enforcement mode. CSP violations are reported to /api/csp-violation.
// The report-uri directive allows us to monitor breakage while blocking violations.
//
// Domains audited against actual browser-side requests (2026-07-13):
//   - Removed: googletagmanager.com, google-analytics.com, analytics.google.com (not loaded)
//   - Removed: api.axiom.co, api.resend.com, api.github.com, api.groq.com (server-only)
//   - Removed: www.gravatar.com, secure.gravatar.com (no longer generating gravatar URLs)
//   - Added:   api.cloudinary.com (upload XHR), images.unsplash.com (blog covers)
//   - Added:   res.cloudinary.com (CDN images), api.dicebear.com (avatar fallbacks)
//   - Fonts:   'self' only — next/font self-hosts after migration
//
// frame-ancestors is set per-route (next to last):
//   - /widget/*   → frame-ancestors *  (embeddable verification widget)
//   - /*          → frame-ancestors 'none' (blocks all framing)
//   - We do NOT use X-Frame-Options because it's a binary header that can't
//     vary per route alongside CSP. CSP frame-ancestors is the modern standard
//     with full browser support (>96% global).

const isDev = process.env.NODE_ENV === 'development';

/** Base CSP without frame-ancestors — appended per-route below. */
const baseCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://auth.butwalhacks.com https://*.posthog.com https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://images.unsplash.com https://res.cloudinary.com https://api.dicebear.com https://api.qrserver.com;
  font-src 'self';
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  connect-src 'self' https://vitals.vercel-insights.com https://auth.butwalhacks.com https://*.auth0.com https://*.posthog.com https://api.cloudinary.com https://*.supabase.co wss://*.supabase.co https://*.ingest.us.sentry.io;
  report-uri /api/csp-violation;
`

/** Compress whitespace without changing the directives. */
function fmt(csp: string): string {
  return csp.replace(/\s{2,}/g, " ").trim();
}

const mainCSP = `${baseCSP}  frame-ancestors 'none';`
const widgetCSP = `${baseCSP}  frame-ancestors *;`

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: fmt(mainCSP),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
]

/** Minimal set for the embeddable widget iframe — relaxed framing only. */
const widgetHeaders = [
  {
    key: "Content-Security-Policy",
    value: fmt(widgetCSP),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Pin the Turbopack root to the workspace root (repo root — one level up
  // from this app dir). npm workspaces hoists `next` to the repo-root
  // node_modules, so without an explicit root Turbopack can mis-infer (e.g.
  // a stray package-lock.json in the user's home dir) and then refuse to
  // compile anything, since deps outside the inferred root are blocked.
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },



  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
  // ─── Consolidation redirects (permanent, SEO-safe) ───
  // Merged routes keep their link equity: old URLs 308 to canonical homes.
  async redirects() {
    return [
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
    ]
  },
  async headers() {
    return [
      // Widget route — must remain iframe-embeddable (verified BH-ID widgets)
      {
        source: "/widget/:path*",
        headers: widgetHeaders,
      },
      // All other routes — strict framing protection
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
};

// ─── Sentry — production error monitoring ────────────────────────
// Wraps the Next.js config with Sentry's Webpack/Vite plugin for
// automatic instrumentation and source map uploads.
//
// SENTRY_DSN must be set in the environment. In dev, Sentry is
// initialized but traces are sampled at 0% unless SENTRY_DSN is set.

import { withSentryConfig } from "@sentry/nextjs";

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps only in production CI (requires SENTRY_AUTH_TOKEN)
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Don't send build-time telemetry to Sentry
  telemetry: false,

  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN isn't set
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Hide source maps from production bundles (Sentry still gets them)
  hideSourceMaps: true,

  // Tree-shake Sentry debug statements from production bundles
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
};

export default withSentryConfig(nextConfig, sentryOptions);
