export const dynamic = "force-static";

import type { Metadata } from "next"
import Link from "next/link"
import { Building2, FileText, GraduationCap, Landmark, ShieldCheck, Siren, Users } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"
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
    <main className="min-h-dvh bg-background text-primary">
      

      <section className="border-b border-border px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Governance" }]} />
          <div className="text-center">
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Trust & Ethics
            </p>
            <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-bold font-heading leading-[0.95] tracking-tight text-primary sm:text-6xl">
              Transparency & Governance
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-secondary sm:text-lg">
              Our commitment to absolute openness in how we operate, govern, and fund the future of technology in
              Lumbini.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-primary">Governance Structure</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {governanceCards.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-xl border border-border bg-surface p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-primary">Financial Integrity</h2>
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

            <article className="rounded-xl border border-border bg-surface p-6">
              <p className="text-lg font-semibold text-primary">Coursera Subsidized Model</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-secondary">
                  <div className="flex items-center justify-between"><span>Negotiated Enterprise Rate (per user)</span><span className="font-semibold text-primary">$49.00</span></div>
                </div>
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm text-secondary">
                  <div className="flex items-center justify-between"><span>Student Access Rate</span><span className="font-semibold text-primary">$59.00</span></div>
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between"><span className="font-semibold text-primary">Community Fund Margin</span><span className="font-semibold text-primary">+$10.00</span></div>
                  <p className="mt-1 text-secondary">Reinvested into open-source workshops and local student support logistics.</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-primary">Annual Reports & Audits</h2>
          <div className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">Reports will be published here after each fiscal year closes.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-primary">Board & Advisors</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {board.map((member) => (
              <article key={member.name} className="rounded-xl border border-border bg-surface p-5 text-center">
                <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-background text-xl font-bold text-primary">
                  {member.name.split(" ").map((part) => part[0]).join("")}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-primary">{member.name}</h3>
                <p className="mt-1 text-sm text-secondary">{member.role}</p>
                <p className="mt-1 text-xs text-secondary/80">{member.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-heading text-primary">Policies & Standards</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {policies.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-xl border border-border bg-surface p-6">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">{item.description}</p>
                  <Link href="/legal/privacy" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">Read Policy →</Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      
    </main>
  )
}