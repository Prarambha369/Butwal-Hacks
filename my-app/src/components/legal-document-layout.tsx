import type { ReactNode } from "react";
import Link from "next/link";

import type { PolicyNavLink } from "@/lib/policy-registry";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalDocumentLayoutProps {
  title: string;
  summary: string;
  lastUpdated: string;
  effectiveDate: string;
  activePolicy: string;
  sections: LegalSection[];
  /** Override the pill nav. Defaults to the two application-page policies. */
  policyLinks?: PolicyNavLink[];
}

export default function LegalDocumentLayout({
  title, summary, lastUpdated, effectiveDate, activePolicy, sections, policyLinks,
}: LegalDocumentLayoutProps) {
  const links: PolicyNavLink[] = policyLinks ?? [
    { id: "privacy", label: "Privacy Policy", href: "/legal/privacy" },
    { id: "terms", label: "Terms of Service", href: "/legal/terms" },
    { id: "cookie-policy", label: "Cookie Policy", href: "/cookie-policy" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">{title}</h1>
        <p className="mt-2 text-secondary">{summary}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-secondary">
          <span>Last updated: {lastUpdated}</span>
          <span>Effective: {effectiveDate}</span>
        </div>
      </div>

      {/*
        The full policy set lives in `policies/` and is governed by the Law on
        Protection of Personal Data 2025 (91/2025/QH15) and Decree 356/2025/ND-CP.
        This page is the public-facing summary. Where the two differ, the `policies/`
        version governs, and it is the fuller document.
      */}
      <aside
        className="mb-8 rounded-lg border border-primary-red/30 bg-primary-red/5 p-4 text-sm text-secondary"
        aria-label="Policy status"
      >
        <p className="font-semibold text-primary">Draft &mdash; not yet legally reviewed</p>
        <p className="mt-2">
          This summary has not been reviewed by an advocate qualified in the laws of Nepal,
          and the review is tracked as an open item. The{" "}
          <Link href="/policies" className="text-primary-red underline hover:no-underline">
            full policy set
          </Link>{" "}
          on this site is the canonical and more detailed version, and includes the
          terms for members under 18 and our safeguarding commitments, which are not
          summarised on this page.
        </p>
      </aside>

      <nav className="flex gap-2 mb-8 pb-4 border-b border-border overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              activePolicy === link.id
                ? "bg-primary-red/10 text-primary-red border border-primary-red/30"
                : "text-secondary border border-border hover:text-primary"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-primary mb-4">{section.title}</h2>
            <div className="text-secondary leading-relaxed space-y-4">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
