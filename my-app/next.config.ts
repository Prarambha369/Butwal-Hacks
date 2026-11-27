import type { NextConfig } from "next";
import path from "path";
import { pageHeaders } from "./src/lib/security-headers";
import { SITE_REDIRECTS } from "./src/lib/site-redirects";

/**
 * next.config.ts — production Next.js configuration for Butwal Hacks.
 *
 * Key settings:
 *  - poweredByHeader: disabled (removes "X-Powered-By: Next.js" response header)
 *  - reactStrictMode: enabled (catches common React pitfalls early)
 *  - images.remotePatterns: whitelist for external images (CDN, avatars)
 *  - Security headers: CSP (per-route frame-ancestors), HSTS,
 *    X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
 *    Defined in src/lib/security-headers.ts, shared with the static site.
 *  - Redirects: src/lib/site-redirects.ts, shared with the static site.
 *  - Sentry: error monitoring via withSentryConfig wrapper
 *
 * BUILD_TARGET=static (scripts/build-static.mjs only) switches to a static
 * export of the marketing pages for Cloudflare: no headers()/redirects()
 * (they become _headers/_redirects files) and a Cloudinary image loader.
 * Vercel builds, `next dev` and tests never set it.
 */

const isStaticExport = process.env.BUILD_TARGET === "static"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  ...(isStaticExport ? { output: "export" as const } : {}),
  // Pin the Turbopack root to the workspace root (repo root — one level up
  // from this app dir). npm workspaces hoists `next` to the repo-root
  // node_modules, so without an explicit root Turbopack can mis-infer (e.g.
  // a stray package-lock.json in the user's home dir) and then refuse to
  // compile anything, since deps outside the inferred root are blocked.
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },

  experimental: {
    // Agent-driven upgrades stay on security releases only.
    agentUpgrade: "security",
  },



  images: {
    // Static export has no image optimiser; Cloudinary/Unsplash size images
    // through their URL params instead (src/lib/image-loader.ts).
    ...(isStaticExport
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
  // Static export cannot serve redirects or headers; the static build writes
  // them to _redirects and _headers instead (src/lib/static-site.ts).
  async redirects() {
    return isStaticExport ? [] : SITE_REDIRECTS
  },
  async headers() {
    if (isStaticExport) return []
    return [
      // Catch-all first, /widget second. Later rules win for duplicate keys, so
      // the widget's permissive frame-ancestors must come after the catch-all
      // or the catch-all's 'none' overrides it and widgets cannot be embedded.
      {
        source: "/:path*",
        headers: pageHeaders(false),
      },
      {
        source: "/widget/:path*",
        headers: pageHeaders(true),
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
