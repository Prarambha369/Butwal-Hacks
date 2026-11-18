import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo";
import LegalDocumentLayout from "@/components/legal-document-layout";
import { buildPolicySections } from "@/components/policy-sections";
import PolicyStatusNotice from "@/components/policy-status-notice";
import { loadPolicy } from "@/lib/policy-content";
import {
  POLICIES,
  POLICY_NAV,
  formatPolicyDate,
  unpublishedPolicyRedirect,
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

  if (!policy.published) {
    return {
      ...buildPageMetadata({
        title: "Policies",
        description: "The Butwal Hacks policies.",
        path: "/policies",
      }),
      robots: { index: false, follow: true },
    };
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

  // Not yet published: the document is under review with our legal advisor.
  // Redirect (temporarily, so it can be published at the same URL later)
  // rather than 404, so old links still land somewhere useful.
  if (!policy.published) redirect(unpublishedPolicyRedirect(policy));

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
