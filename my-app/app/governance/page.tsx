import type { Metadata } from "next"
import Link from "next/link"
import { Building2, Download, FileText, GraduationCap, Landmark, ShieldCheck, Siren, Users } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Transparency & Governance",
  description:
    "Governance model, financial integrity, audit reports, and board transparency for Butwal Hacks Foundation in Lumbini.",
  path: "/governance",
})

const governanceCards = [
  {
    icon: Building2,
    title: "Nepal Hacks Foundation",
    description: "Parent oversight and legal compliance with a regulatory framework for local chapters.",
  },
  {
    icon: Users,
    title: "Butwal Hacks Executive",
    description: "Strategic operations and resource management across mission and partner alignment.",
  },
  {
    icon: GraduationCap,
    title: "Student Board",
    description: "Community-led initiatives and project execution aligned with student needs.",
  },
] as const

const reports = [
  { name: "Annual Report 2024", size: "4.2 MB", href: "#" },
  { name: "Financial Audit 2023", size: "2.1 MB", href: "#" },
  { name: "Tax Compliance 2023", size: "1.5 MB", href: "#" },
  { name: "Strategic Plan '25", size: "3.8 MB", href: "#" },
] as const

const board = [
  { name: "Bibek Dahal", role: "Executive Chairman", note: "Software Engineer" },
  { name: "Anita Sharma", role: "Operations Lead", note: "Strategic Management" },
  { name: "Rohan KC", role: "Technical Advisor", note: "Cloud Infrastructure" },
  { name: "Safal Bhattarai", role: "Community Outreach", note: "Student Lead" },
] as const

const policies = [
  {
    icon: Siren,
    title: "Conflict of Interest Policy",
    description: "How personal interests are managed to preserve institutional integrity.",
  },
  {
    icon: ShieldCheck,
    title: "Whistleblower Policy",
    description: "A safe reporting channel for potential unethical behavior and risk signals.",
  },
  {
    icon: Landmark,
    title: "Data Ethics",
    description: "Principles for student data handling, consent, and responsible processing.",
  },
] as const

export default function GovernancePage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Governance" }]} />
          <div className="text-center">
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Trust & Ethics
            </p>
            <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-bold font-heading leading-[0.95] tracking-tight text-foreground sm:text-6xl">
              Transparency & Governance
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Our commitment to absolute openness in how we operate, govern, and fund the future of technology in
              Lumbini.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-foreground">Governance Structure</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {governanceCards.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-foreground">Financial Integrity</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-primary/40 bg-primary p-6 text-primary-foreground">
              <p className="text-lg font-semibold">Financial Flow 2024</p>
              <div className="mt-6 space-y-5">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                    <span>90% Programs & Projects</span>
                    <span>NPR 4.2M</span>
                  </div>
                  <div className="h-3 rounded-full bg-primary-foreground/20">
                    <div className="h-3 w-[90%] rounded-full bg-primary-foreground" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                    <span>10% Operations</span>
                    <span>NPR 460K</span>
                  </div>
                  <div className="h-3 rounded-full bg-primary-foreground/20">
                    <div className="h-3 w-[10%] rounded-full bg-primary-foreground/80" />
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-border bg-card p-6">
              <p className="text-lg font-semibold text-foreground">Coursera Subsidized Model</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Negotiated Enterprise Rate (per user)</span><span className="font-semibold text-foreground">$49.00</span></div>
                </div>
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Student Access Rate</span><span className="font-semibold text-foreground">$59.00</span></div>
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between"><span className="font-semibold text-foreground">Community Fund Margin</span><span className="font-semibold text-primary">+$10.00</span></div>
                  <p className="mt-1 text-muted-foreground">Reinvested into open-source workshops and local student support logistics.</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-foreground">Annual Reports & Audits</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {reports.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="inline-flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {item.name}</span>
                <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />{item.size}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-foreground">Board & Advisors</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {board.map((member) => (
              <article key={member.name} className="rounded-xl border border-border bg-card p-5 text-center">
                <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-background text-xl font-bold text-foreground">
                  {member.name.split(" ").map((part) => part[0]).join("")}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{member.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                <p className="mt-1 text-xs text-muted-foreground/80">{member.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-foreground">Policies & Standards</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {policies.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-xl border border-border bg-card p-6">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  <Link href="/privacy-policy" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">Read Policy →</Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}