import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo";
import LegalDocumentLayout from "@/components/legal-document-layout";
import { buildPolicySections } from "@/components/policy-sections";
import PolicyStatusNotice from "@/components/policy-status-notice";
import { loadPolicy } from "@/lib/policy-content";
import {
  POLICIES,
  POLICY_NAV,
  formatPolicyDate,
  type PolicySlug,
} from "@/lib/policy-registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return POLICIES.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES.find((p) => p.slug === slug);

  if (!policy) {
    return buildPageMetadata({
      title: "Policy Not Found",
      description: "We could not find that policy. Try the policy index.",
      path: `/policies/${slug}`,
    });
  }

  return buildPageMetadata({
    title: policy.title,
    description: policy.summary,
    path: `/policies/${policy.slug}`,
  });
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = POLICIES.find((p) => p.slug === slug);

  if (!policy) notFound();

  const parsed = loadPolicy(policy.slug as PolicySlug);
  if (!parsed) notFound();

  return (
    <>
      <PolicyStatusNotice />
      <LegalDocumentLayout
        title={policy.title}
        summary={policy.summary}
        lastUpdated={formatPolicyDate(parsed.version)}
        effectiveDate={formatPolicyDate(parsed.version)}
        activePolicy={policy.slug}
        sections={buildPolicySections(parsed.blocks)}
        policyLinks={POLICY_NAV}
      />
    </>
  );
}
