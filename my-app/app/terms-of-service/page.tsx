import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import SiteHeader from "@/components/site-header"
import Footer from "@/components/footer"
import LegalDocumentLayout from "@/components/legal-document-layout"

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description: "Terms of service for using the Butwal Hacks website and participating in our programs.",
  path: "/terms-of-service",
})

export default function TermsOfServicePage() {
  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content: (
        <p>
          By using this website, you agree to these terms. If you do not agree, please do not use the website.
        </p>
      ),
    },
    {
      id: "website-use",
      title: "2. Website Use",
      content: (
        <>
          <p>The website must be used lawfully and respectfully.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Do not misuse forms or submit false information.</li>
            <li>Do not attempt unauthorized access to systems.</li>
            <li>Do not disrupt community participation spaces.</li>
          </ul>
        </>
      ),
    },
    {
      id: "intellectual-property",
      title: "3. Intellectual Property",
      content: (
        <p>
          Website content remains the property of Butwal Hacks unless stated otherwise. Please ask permission before reproducing content beyond fair use.
        </p>
      ),
    },
    {
      id: "liability",
      title: "4. Liability",
      content: (
        <p>
          We provide this site on an as-is basis and cannot guarantee uninterrupted availability. We work to keep content accurate and up to date.
        </p>
      ),
    },
    {
      id: "changes",
      title: "5. Changes to Terms",
      content: (
        <p>
          We may update these terms when needed. Updates become effective when published on this page.
        </p>
      ),
    },
    {
      id: "contact",
      title: "6. Contact",
      content: (
        <p>
          For questions about these terms, email <a href="mailto:hello@butwalhacks.com" className="text-primary hover:underline">hello@butwalhacks.com</a>.
        </p>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <LegalDocumentLayout
        title="Terms of Service"
        summary="These terms define fair and respectful use of the Butwal Hacks website and related services."
        lastUpdated="February 22, 2026"
        effectiveDate="February 22, 2026"
        activePolicy="terms"
        sections={sections}
      />
      <Footer />
    </div>
  )
}
