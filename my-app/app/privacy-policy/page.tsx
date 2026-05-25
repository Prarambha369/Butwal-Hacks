import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import SiteHeader from "@/components/site-header"
import Footer from "@/components/footer"
import LegalDocumentLayout from "@/components/legal-document-layout"

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Butwal Hacks, outlining how we collect, use, and protect your information.",
  path: "/privacy-policy",
})

export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: "introduction",
      title: "1. Introduction",
      content: (
        <>
          <p>
            Butwal Hacks is a nonprofit technology community. This policy explains, in plain language, what information we collect, why we collect it, and how we protect it.
          </p>
          <p>
            We only collect information that is needed to run community initiatives, events, and communication safely.
          </p>
        </>
      ),
    },
    {
      id: "data-collection",
      title: "2. Data Collection",
      content: (
        <>
          <p>We collect information only when it is necessary to provide our services or improve user experience.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Account information:</strong> name, email, and optional social profile details.</li>
            <li><strong>Event registration data:</strong> details submitted for participation logistics.</li>
            <li><strong>Technical data:</strong> browser type and IP address for security and reliability.</li>
          </ul>
        </>
      ),
    },
    {
      id: "how-we-use",
      title: "3. How We Use Information",
      content: (
        <>
          <p>We use your data for the following purposes:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>To manage participation in events and community programs.</li>
            <li>To send important operational updates.</li>
            <li>To keep our platforms secure and dependable.</li>
          </ul>
          <p>We do not sell, rent, or trade personal information for marketing purposes.</p>
        </>
      ),
    },
    {
      id: "ad-transparency",
      title: "4. Advertisement Transparency",
      content: (
        <>
          <p className="rounded-md border border-border bg-muted/50 p-3 italic">
            Some blog pages may display advertisements to support community initiatives.
          </p>
          <p>
            This privacy policy page and other core legal documents remain completely ad-free.
          </p>
        </>
      ),
    },
    {
      id: "rights",
      title: "5. Your Rights",
      content: (
        <>
          <p>You can request access, correction, or deletion of your personal data where applicable.</p>
          <p>For policy-related requests, contact us directly through the legal contact channel below.</p>
        </>
      ),
    },
    {
      id: "contact",
      title: "6. Contact",
      content: (
        <p>
          For questions about this policy, email <a href="mailto:hello@butwalhacks.com" className="text-primary hover:underline">hello@butwalhacks.com</a>.
        </p>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <LegalDocumentLayout
        title="Privacy Policy"
        summary="This page explains how we handle personal data in clear language, with transparent limits and no dark patterns."
        lastUpdated="February 22, 2026"
        effectiveDate="February 22, 2026"
        activePolicy="privacy"
        sections={sections}
      />
      <Footer />
    </div>
  )
}
