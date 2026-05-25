import Link from "next/link"
import type { ReactNode } from "react"

type PolicyKey = "privacy" | "terms" | "cookie"

type LegalSection = {
  id: string
  title: string
  content: ReactNode
}

type LegalDocumentLayoutProps = {
  title: string
  summary: string
  lastUpdated: string
  effectiveDate: string
  activePolicy: PolicyKey
  sections: LegalSection[]
}

const policyLinks: { key: PolicyKey; label: string; href: string }[] = [
  { key: "privacy", label: "Privacy Policy", href: "/privacy-policy" },
  { key: "terms", label: "Terms of Service", href: "/terms-of-service" },
  { key: "cookie", label: "Cookie Policy", href: "/cookie-policy" },
]

export default function LegalDocumentLayout({
  title,
  summary,
  lastUpdated,
  effectiveDate,
  activePolicy,
  sections,
}: LegalDocumentLayoutProps) {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-muted-foreground">Legal / {title}</p>
          <h1 className="mt-3 text-4xl font-bold font-heading tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">{summary}</p>
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <p>Last Updated: {lastUpdated}</p>
            <p>Effective: {effectiveDate}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-base font-semibold font-heading text-foreground">Legal Documents</h2>
              <nav className="mt-3 space-y-2" aria-label="Legal document switcher">
                {policyLinks.map((item) => {
                  const isActive = item.key === activePolicy

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-md border px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-base font-semibold font-heading text-foreground">On This Page</h2>
              <nav className="mt-3 space-y-2" aria-label="On this page">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-muted-foreground hover:text-foreground"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="rounded-xl border border-border bg-card p-6 sm:p-8">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 border-b border-border py-7 first:pt-0 last:border-b-0 last:pb-0">
                <h2 className="text-2xl font-bold font-heading text-foreground">{section.title}</h2>
                <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">{section.content}</div>
              </section>
            ))}
          </article>
        </div>
      </section>
    </main>
  )
}
