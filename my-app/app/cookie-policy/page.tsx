import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import SiteHeader from "@/components/site-header"
import Footer from "@/components/footer"
import LegalDocumentLayout from "@/components/legal-document-layout"

export const metadata: Metadata = buildPageMetadata({
  title: "Cookie Policy",
  description: "Cookie policy for Butwal Hacks, explaining how we use cookies and similar technologies.",
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
            <li><strong>Essential:</strong> required for basic website operation.</li>
            <li><strong>Analytics:</strong> helps us improve content and navigation.</li>
            <li><strong>Preference:</strong> remembers selections such as theme preference.</li>
          </ul>
        </>
      ),
    },
    {
      id: "third-party-cookies",
      title: "3. Third-Party Cookies",
      content: (
        <p>
          Some tools we use may set their own cookies. Those cookies are controlled by their respective providers and policies.
        </p>
      ),
    },
    {
      id: "managing-cookies",
      title: "4. Managing Cookies",
      content: (
        <p>
          You can control cookie settings in your browser. Disabling certain cookies may affect how parts of the website function.
        </p>
      ),
    },
    {
      id: "contact",
      title: "5. Contact",
      content: (
        <p>
          Questions about cookies can be sent to <a href="mailto:hello@butwalhacks.com" className="text-primary hover:underline">hello@butwalhacks.com</a>.
        </p>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <LegalDocumentLayout
        title="Cookie Policy"
        summary="This page explains what cookies are, why we use them, and how you can manage them."
        lastUpdated="February 22, 2026"
        effectiveDate="February 22, 2026"
        activePolicy="cookie"
        sections={sections}
      />
      <Footer />
    </div>
  )
}
