export const dynamic = "force-static";

import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import LegalDocumentLayout from "@/components/legal-document-layout"

export const metadata: Metadata = buildPageMetadata({
  title: "Cookie Policy",
  description: "How Butwal Hacks uses cookies. Short version: as few as possible.",
  path: "/cookie-policy",
})

export default function CookiePolicyPage() {
  const sections = [
    {
      id: "what-are-cookies",
      title: "1. What Are Cookies",
      content: (
        <p>
          Cookies are small files saved on your device that help websites remember settings and improve performance.
        </p>
      ),
    },
    {
      id: "how-we-use-cookies",
      title: "2. How We Use Cookies",
      content: (
        <>
          <p>We use a limited set of cookies to run core functions and understand general website usage.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Essential:</strong> required for basic website operation, including signing in and keeping you signed in.</li>
            <li><strong>Analytics:</strong> helps us improve content and navigation. Some of this analytics, including PostHog, only loads after you accept the cookie notice.</li>
            <li><strong>Preference:</strong> remembers selections such as theme and language.</li>
          </ul>
        </>
      ),
    },
    {
      id: "browser-storage",
      title: "3. Browser Storage We Use",
      content: (
        <>
          <p>
            Some settings are kept in your browser&rsquo;s local storage rather than in cookies. This is
            the same mechanism, and it never leaves your device unless the value is sent to us with a
            request you make.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Your cookie choice, so the notice appears only once.</li>
            <li>Your theme and language preference.</li>
            <li>Progress through the dashboard onboarding steps, so you are not asked the same questions again.</li>
          </ul>
          <p className="mt-2">Clearing your browser storage removes these values and the notice will appear again.</p>
        </>
      ),
    },
    {
      id: "third-party-cookies",
      title: "4. Third-Party Cookies",
      content: (
        <>
          <p>
            Some tools we use may set their own cookies. Those cookies are controlled by their respective
            providers and policies.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>PostHog</strong> &mdash; product analytics. It is only loaded once you accept the
              cookie notice. If you sign in, your account identifier, email address, and name are sent
              so activity can be attributed to your account rather than to an advertising identifier.
            </li>
            <li>
              <strong>Vercel Analytics</strong> &mdash; aggregated traffic measurement for this site. It is
              loaded with the page rather than after you accept the notice.
            </li>
            <li>
              <strong>Sentry</strong> &mdash; error reporting and performance monitoring. Session replay
              is sampled rather than recorded for every visit.
            </li>
          </ul>
          <p className="mt-2">
            We do not use advertising cookies, and we do not share data with advertising networks.
          </p>
        </>
      ),
    },
    {
      id: "managing-cookies",
      title: "5. Managing Cookies",
      content: (
        <p>
          You can control cookie settings in your browser. Disabling certain cookies may affect how parts of the website function.
        </p>
      ),
    },
    {
      id: "contact",
      title: "6. Contact",
      content: (
        <p>
          Questions about cookies can be sent to <a href="mailto:hello@butwalhacks.com" className="text-primary hover:underline">hello@butwalhacks.com</a>.
        </p>
      ),
    },
  ]

  return (
    <div className="min-h-dvh bg-background">
      
      <LegalDocumentLayout
        title="Cookie Policy"
        summary="This page explains what cookies are, why we use them, and how you can manage them."
        lastUpdated="October 14, 2026"
        effectiveDate="October 14, 2026"
        activePolicy="cookie"
        sections={sections}
      />
      
    </div>
  )
}
