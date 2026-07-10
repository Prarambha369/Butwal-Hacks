import type { Metadata } from "next"
import Link from "next/link"
import { BarChart3, Mail, MapPin, Rocket, ShieldCheck, Users } from "lucide-react"



import { buildPageMetadata } from "@/lib/seo"
import { SponsorForm } from "./sponsor-form"

export const metadata: Metadata = buildPageMetadata({
  title: "Sponsor Prospectus",
  description:
    "Butwal Hacks Sponsor Prospectus for institutional partners: audience impact, partnership tiers, transparency, and direct inquiry.",
  path: "/support",
})

const metrics = [
  {
    icon: Users,
    value: "500+",
    label: "Active Students & Builders",
    note: "Verified participants from colleges and engineering schools in the region.",
  },
  {
    icon: Rocket,
    value: "20+",
    label: "Projects Shipped Yearly",
    note: "Real-world MVPs addressing local challenges in education, tourism, and civic life.",
  },
  {
    icon: MapPin,
    value: "80%",
    label: "Local Participation",
    note: "Deep engagement across Butwal, Bhairahawa, and surrounding Lumbini corridor communities.",
  },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background text-primary">
      

      <section className="border-b border-glass px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Sponsorship Open 2026
            </p>
            <h1 className="mt-5 text-5xl font-bold font-heading leading-[0.95] tracking-tight text-primary sm:text-6xl">
              Partner with the <span className="text-primary">Next Generation</span> of Builders
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-secondary sm:text-lg">
              Empowering youth across Lumbini through code, community, and innovation. Join Nepal&apos;s most impactful
              district-led tech initiative and reach bright minds building practical solutions for real-world problems.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="mailto:hello@butwalhacks.com?subject=Sponsor%20Prospectus%20Request"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Mail className="h-4 w-4" />
                Request Prospectus
              </a>
              <Link
                href="#tiers"
                className="rounded-lg border border-glass bg-surface px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface/50"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-glass bg-surface p-4">
            <div className="rounded-xl border border-glass bg-surface/50 p-6">
              <p className="text-sm font-semibold text-secondary">Institutional Sponsorship</p>
              <p className="mt-2 text-sm text-secondary">Aligned with the 77 Hacks vision and district-wide youth enablement.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-glass bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-secondary">Annual Reach</p>
                  <p className="mt-1 text-xl font-bold text-primary">500+ builders</p>
                </div>
                <div className="rounded-lg border border-glass bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-secondary">Active Programs</p>
                  <p className="mt-1 text-xl font-bold text-primary">Hackathon · GameJam</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-glass px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold font-heading tracking-tight text-primary">The Mission</h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-secondary sm:text-lg">
            Butwal Hacks is part of the 77 Hacks vision: technology excellence in every district of Nepal. We believe
            talent is distributed evenly, but opportunity is not.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-secondary sm:text-lg">
            Sponsorship bridges this gap between youth potential and execution capacity by investing in mentorship,
            practical programs, and open community infrastructure.
          </p>
        </div>
      </section>

      <section className="border-b border-glass px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-4xl font-bold font-heading tracking-tight text-primary">Audience &amp; Impact</h2>
              <p className="mt-2 max-w-2xl text-sm text-secondary">
                Our reach across Lumbini directly connects sponsors with high-intent technical talent.
              </p>
            </div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <BarChart3 className="h-3.5 w-3.5" /> Live impact tracker
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <article key={metric.label} className="rounded-xl border border-glass bg-surface p-6">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-5xl font-bold font-heading leading-none text-primary">{metric.value}</p>
                  <h3 className="mt-2 text-base font-semibold text-primary">{metric.label}</h3>
                  <p className="mt-3 text-sm text-secondary">{metric.note}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="tiers" className="border-b border-glass px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-4xl font-bold font-heading tracking-tight text-primary">Partnership Tiers</h2>
          <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-secondary">
            Scalable involvement options designed for organizations of all sizes.
          </p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-glass bg-surface">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-glass bg-surface/50/50 text-secondary">
                <tr>
                  <th className="px-4 py-3 font-semibold">Benefit</th>
                  <th className="px-4 py-3 font-semibold">Community</th>
                  <th className="px-4 py-3 font-semibold">Silver</th>
                  <th className="px-4 py-3 font-semibold">Gold</th>
                  <th className="px-4 py-3 font-semibold">Platinum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-secondary">
                <tr>
                  <td className="px-4 py-3 font-medium text-primary">Logo Placement</td>
                  <td className="px-4 py-3">Website</td>
                  <td className="px-4 py-3">Web + Banners</td>
                  <td className="px-4 py-3">Web + Banners + Swag</td>
                  <td className="px-4 py-3">All Primary Channels</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-primary">Recruitment Access</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 text-primary">Resume Database</td>
                  <td className="px-4 py-3 text-primary">On-site Interviews</td>
                  <td className="px-4 py-3 text-primary">Priority Hiring Desk</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-primary">Workshop Rights</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">1 Workshop Session</td>
                  <td className="px-4 py-3">Main Stage Keynote</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-primary">Brand Integration</td>
                  <td className="px-4 py-3">None</td>
                  <td className="px-4 py-3">Social Media</td>
                  <td className="px-4 py-3">Social + Swag</td>
                  <td className="px-4 py-3 text-primary">Named Prize Category</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-glass px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-xl border border-glass bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Transparency First
              </p>
              <p className="mt-2 text-sm text-secondary">
                We operate as a high-trust nonprofit. Sponsor contributions are tracked and reported through public
                annual documentation.
              </p>
            </div>
            <Link
              href="/resources"
              className="rounded-lg border border-glass bg-background px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface/50"
            >
              View Reports
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <SponsorForm />
      </section>

      
    </main>
  )
}
