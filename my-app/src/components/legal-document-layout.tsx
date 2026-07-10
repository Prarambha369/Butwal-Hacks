import type { ReactNode } from "react";
import Link from "next/link";

interface LegalSection {
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
}

export default function LegalDocumentLayout({
  title, summary, lastUpdated, effectiveDate, activePolicy, sections,
}: LegalDocumentLayoutProps) {
  const policyLinks = [
    { id: "privacy", label: "Privacy Policy", href: "/privacy-policy" },
    { id: "terms", label: "Terms of Service", href: "/terms-of-service" },
    { id: "cookie", label: "Cookie Policy", href: "/cookie-policy" },
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

      <nav className="flex gap-2 mb-8 pb-4 border-b border-glass overflow-x-auto">
        {policyLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
              activePolicy === link.id
                ? "bg-bh-red-500/10 text-bh-red-500 border border-bh-red-500/30"
                : "text-secondary border border-glass hover:text-primary"
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
