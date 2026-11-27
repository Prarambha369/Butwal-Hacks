import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

// Explicit so the static marketing export (scripts/build-static.mjs) can emit it.
export const dynamic = 'force-static'

// Shared by every group: a crawler obeys only the most specific group that
// names it, so a named AI-bot group without these would be allowed into
// /api, /dashboard and the other private routes.
const PRIVATE_PATHS = [
  '/api/*',
  '/dashboard/*',
  '/portal/*',
  '/orgs/*',
  '/profile/',
  '/auth/',
  '/login',
  '/sign-in',
  '/sign-up',
  '/claim/*',
]

export default function robots(): MetadataRoute.Robots {
  const siteUrl = SITE_URL

  return {
    rules: [
      // ─── Default: allow public content, block private/app routes ─────
      // Mirrors the proxy middleware: everything in APP_PREFIXES that is
      // auth-gated (dashboard, portal, orgs) or a duplicate of a canonical
      // route (profile/ vs the public /p/ Hacker ID) is blocked here.
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // ─── AI crawler policy ──────────────────────────────────────────
      // AI bots are explicitly allowed to index public content. These rules
      // are documented (not just implied by the default) so the policy is
      // easy to change: flip `allow: '/'` to `disallow: '/'` to opt out of
      // AI training crawls, or delete a bot from the list to block it.
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'anthropic-ai',
          'PerplexityBot',
          'Google-Extended',
          'CCBot',
          'Amazonbot',
          'Meta-ExternalAgent',
          'Bytespider',
        ],
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    // No `host` directive: it is Yandex-only, Google ignores it, and emitting
    // a full URL (`host: https://...`) is malformed — Search Console reports
    // "1 error" on the robots.txt served from every host as a result.
  }
}
