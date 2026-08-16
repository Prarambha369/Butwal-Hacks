import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butwalhacks.com'

  return {
    rules: [
      // ─── Default: allow public content, block private/app routes ─────
      // Mirrors the proxy middleware: everything in APP_PREFIXES that is
      // auth-gated (dashboard, portal, orgs) or a duplicate of a canonical
      // route (profile/ vs the public /p/ Hacker ID) is blocked here.
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
        ],
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
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
