import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo";
import LegalDocumentLayout from "@/components/legal-document-layout";
import { buildPolicySections } from "@/components/policy-sections";
import PolicyStatusNotice from "@/components/policy-status-notice";
import { loadPolicyIndex } from "@/lib/policy-content";
import { POLICY_NAV, formatPolicyDate } from "@/lib/policy-registry";

export const dynamic = "force-static";

export const metadata: Metadata = buildPageMetadata({
  title: "Policies",
  description:
    "The Butwal Hacks policy set: code of conduct, hackathon rules, contest terms, safeguarding, cheating and incident response, and how to report something.",
  path: "/policies",
});

/**
 * The policy index.
 *
 * The content is `policies/README.md` — the same file that lives in the
 * repository — so the site and the repo never disagree about what the policy
 * set contains.
 */
export default function PoliciesPage() {
  const parsed = loadPolicyIndex();

  if (!parsed) {
    throw new Error("Policy index could not be read from policies/README.md");
  }

  return (
    <>
      <PolicyStatusNotice />
      <LegalDocumentLayout
        title="Policies"
        summary="The rules we run events by, and how to report something that went wrong."
        lastUpdated={formatPolicyDate(parsed.version)}
        effectiveDate={formatPolicyDate(parsed.version)}
        activePolicy="index"
        sections={buildPolicySections(parsed.blocks)}
        policyLinks={POLICY_NAV}
      />
    </>
  );
}
