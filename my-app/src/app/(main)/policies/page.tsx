import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/seo";
import LegalDocumentLayout, { type LegalSection } from "@/components/legal-document-layout";
import PolicyStatusNotice from "@/components/policy-status-notice";
import {
  POLICY_LAST_UPDATED,
  POLICY_NAV,
  PUBLISHED_POLICIES,
} from "@/lib/policy-registry";

export const dynamic = "force-static";

export const metadata: Metadata = buildPageMetadata({
  title: "Policies",
  description:
    "The Butwal Hacks policies participants agree to: the code of conduct, the hackathon rules, the privacy policy, and how a suspected cheating report is handled.",
  path: "/policies",
});

/**
 * The policy index.
 *
 * Lists only the published documents, by title. It deliberately does not
 * render `policies/README.md`: that file is the maintainers' map of the whole
 * set, including documents still under review with our legal advisor, and it
 * names files rather than documents.
 */
export default function PoliciesPage() {
  const sections: LegalSection[] = [
    {
      id: "published",
      title: "Our policies",
      content: (
        <ul className="space-y-4">
          {PUBLISHED_POLICIES.map((policy) => (
            <li key={policy.slug}>
              <Link
                href={`/policies/${policy.slug}`}
                className="font-semibold text-primary underline hover:no-underline"
              >
                {policy.title}
              </Link>
              <p className="mt-1">{policy.summary}</p>
            </li>
          ))}
          <li>
            <Link href="/legal/terms" className="font-semibold text-primary underline hover:no-underline">
              Terms of Service
            </Link>
            <p className="mt-1">The terms for using the Butwal Hacks website.</p>
          </li>
          <li>
            <Link href="/cookie-policy" className="font-semibold text-primary underline hover:no-underline">
              Cookie Policy
            </Link>
            <p className="mt-1">Which cookies and local storage we set, and how to refuse them.</p>
          </li>
        </ul>
      ),
    },
    {
      id: "in-review",
      title: "Other policies",
      content: (
        <p>
          Our other policies are being reviewed with our legal advisor and are not yet published.
          We will add them here once that review is complete. Questions in the meantime can go to{" "}
          <a href="mailto:legal@butwalhacks.com" className="text-primary underline hover:no-underline">
            legal@butwalhacks.com
          </a>
          .
        </p>
      ),
    },
  ];

  return (
    <>
      <PolicyStatusNotice />
      <LegalDocumentLayout
        title="Policies"
        summary="The rules we run events by, and how to report something that went wrong."
        lastUpdated={POLICY_LAST_UPDATED}
        effectiveDate={POLICY_LAST_UPDATED}
        activePolicy="index"
        sections={sections}
        policyLinks={POLICY_NAV}
      />
    </>
  );
}
