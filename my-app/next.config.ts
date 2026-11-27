import type { NextConfig } from "next";
import path from "path";
import { existsSync } from "fs";
import { buildStaticCsp, REPORTING_ENDPOINTS } from "./src/lib/csp";

/**
 * next.config.ts — production Next.js configuration for Butwal Hacks.
 *
 * Key settings:
 *  - poweredByHeader: disabled (removes "X-Powered-By: Next.js" response header)
 *  - reactStrictMode: enabled (catches common React pitfalls early)
 *  - images.remotePatterns: whitelist for external images (CDN, avatars)
 *  - Security headers: CSP (per-route frame-ancestors), HSTS,
 *    X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
 *    All owned by this file — see securityHeaders below.
 *  - Sentry: error monitoring via withSentryConfig wrapper
 */

// ─── Content Security Policy ─────────────────────────────────────
// The static policy below covers CDN-cached pages, API routes and files.
// Dynamically rendered routes (dashboard, portal, claim) get a per-request
// nonce policy without 'unsafe-inline' from src/proxy.ts, which replaces this
// header. Both are built in src/lib/csp.ts — see why static pages keep
// 'unsafe-inline', the domain audit and the frame-ancestors notes there.
// Violations are reported to /api/csp-violation (report-uri and report-to).

// ─── Build target ────────────────────────────────────────────────
// The cf:* scripts (OpenNext → Cloudflare Workers) set BUILD_TARGET=cloudflare.
// Vercel builds, `next dev` and tests leave it unset and behave as before.
// See docs/CLOUDFLARE.md.
const isCloudflareBuild = process.env.BUILD_TARGET === "cloudflare"
// npm workspaces hoist @sentry/nextjs to the repo root; fall back to the app.
const sentryDir = [
  path.resolve(process.cwd(), "../node_modules/@sentry/nextjs"),
  path.resolve(process.cwd(), "node_modules/@sentry/nextjs"),
].find((dir) => existsSync(dir)) ?? "node_modules/@sentry/nextjs"
const sentryBuild = (file: string) => {
  const rel = path.relative(process.cwd(), path.join(sentryDir, file))
  return rel.startsWith(".") ? rel : `./${rel}`
}
const SENTRY_CLIENT_ENTRY = sentryBuild("build/esm/index.client.js")
const SENTRY_WORKERD_ENTRY = sentryBuild("build/esm/edge/index.js")

const mainCSP = buildStaticCsp(false)
const widgetCSP = buildStaticCsp(true)

const reportingEndpoints = {
  key: "Reporting-Endpoints",
  value: REPORTING_ENDPOINTS,
}

// Transport-level headers for every route. These used to live in vercel.json
// under a /(.*) source, but next.config headers() takes precedence over
// vercel.json for overlapping sources, so that block was shadowed and
// nosniff/referrer-policy never reached production. One owner, one rule.
const securityHeaders = [
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
]

const permissionsPolicy = {
  key: "Permissions-Policy",
  value: "camera=(self), microphone=(), geolocation=()",
}

const cspOnlyHeaders = [
  ...securityHeaders,
  {
    key: "Content-Security-Policy",
    value: mainCSP,
  },
  permissionsPolicy,
  reportingEndpoints,
]

const widgetCspHeaders = [
  ...securityHeaders,
  {
    key: "Content-Security-Policy",
    value: widgetCSP,
  },
  permissionsPolicy,
  reportingEndpoints,
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
    // Cloudflare Workers builds only. Server code would otherwise get
    // @sentry/nextjs's Node build (OpenTelemetry + Node HTTP hooks), which
    // Turbopack copied into five server chunks (~7 MB) and which assumes Node.
    // Sentry ships a fetch-based build for workerd under its `workerd` export
    // condition, but Turbopack does not apply that condition, so point the
    // server import at it directly. The browser keeps the client build.
    ...(isCloudflareBuild
      ? {
          resolveAlias: {
            "@sentry/nextjs": {
              browser: SENTRY_CLIENT_ENTRY,
              default: SENTRY_WORKERD_ENTRY,
            },
          },
        }
      : {}),
  },

  experimental: {
    // Agent-driven upgrades stay on security releases only.
    agentUpgrade: "security",
  },



  images: {
    // On Cloudflare Workers there is no free image optimiser, so a custom
    // loader hands sizing to Cloudinary/Unsplash via their URL params.
    // See src/lib/image-loader.ts.
    ...(isCloudflareBuild
      ? { loader: "custom" as const, loaderFile: "./src/lib/image-loader.ts" }
      : {}),
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
      // Auth0 profile pictures (Google, GitHub, LinkedIn, Auth0 default, Gravatar)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
      {
        protocol: "https",
        hostname: "cdn.auth0.com",
      },
      {
        protocol: "https",
        hostname: "s.gravatar.com",
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
    ]
  },
  async headers() {
    return [
      // Catch-all first, /widget second. Later rules win for duplicate keys, so
      // the widget's permissive frame-ancestors must come after the catch-all
      // or the catch-all's 'none' overrides it and widgets cannot be embedded.
      {
        source: "/:path*",
        headers: cspOnlyHeaders,
      },
      {
        source: "/widget/:path*",
        headers: widgetCspHeaders,
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
