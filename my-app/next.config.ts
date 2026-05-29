import { withAxiom } from "next-axiom"
import type { NextConfig } from "next";

/**
 * next.config.ts — production Next.js configuration for Butwal Hacks.
 *
 * Key settings:
 *  - poweredByHeader: disabled (removes "X-Powered-By: Next.js" response header)
 *  - reactStrictMode: enabled (catches common React pitfalls early)
 *  - images.remotePatterns: whitelist for future external images (CDN, avatars)
 *  - Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
 *  - Axiom logging: via withAxiom() wrapper for Vercel log drain integration
 */

// Content Security Policy directives
const isDev = process.env.NODE_ENV === 'development';
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://butwal.jp.auth0.com https://*.posthog.com
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://www.google-analytics.com
  font-src 'self';
  worker-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  connect-src 'self' https://vitals.vercel-insights.com https://www.google-analytics.com https://analytics.google.com https://api.axiom.co https://butwal.jp.auth0.com https://*.auth0.com https://*.posthog.com
`

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
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
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
};

export default withAxiom(nextConfig);
