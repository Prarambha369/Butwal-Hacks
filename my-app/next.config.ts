import type { NextConfig } from "next";

/**
 * next.config.ts — production Next.js configuration for Butwal Hacks.
 *
 * Key settings:
 *  - poweredByHeader: disabled (removes "X-Powered-By: Next.js" response header)
 *  - reactStrictMode: enabled (catches common React pitfalls early)
 *  - images.remotePatterns: whitelist for future external images (CDN, avatars)
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
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://butwal.jp.auth0.com https://*.posthog.com https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://images.unsplash.com https://res.cloudinary.com https://api.dicebear.com;
  font-src 'self';
  worker-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  connect-src 'self' https://vitals.vercel-insights.com https://butwal.jp.auth0.com https://*.auth0.com https://*.posthog.com https://api.cloudinary.com https://*.supabase.co wss://*.supabase.co https://*.ingest.us.sentry.io;
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
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
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
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,



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
    ],
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
