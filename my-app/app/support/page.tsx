import type { Metadata } from "next"
import Link from "next/link"
import { BarChart3, FileDown, Mail, MapPin, Phone, Rocket, ShieldCheck, Users } from "lucide-react"

import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Sponsor Prospectus",
  description:
    "Butwal Hacks Sponsor Prospectus for institutional partners: audience impact, partnership tiers, transparency, and direct inquiry.",
  path: "/support",
})

export default function SupportPage() {
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

  const partnerLogos = ["LOCAL_TECH", "FIN-QUEST", "CONNECT_NP", "DEV_STUDIO", "EDU_FOUND"]

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Sponsorship Open 2026
            </p>
            <h1 className="mt-5 text-5xl font-bold font-heading leading-[0.95] tracking-tight text-foreground sm:text-6xl">
              Partner with the <span className="text-primary">Next Generation</span> of Builders
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Empowering youth across Lumbini through code, community, and innovation. Join Nepal&apos;s most impactful
              district-led tech initiative and reach bright minds building practical solutions for real-world problems.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <FileDown className="h-4 w-4" />
                Download Prospectus (PDF)
              </button>
              <Link
                href="#tiers"
                className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="rounded-xl border border-border bg-muted p-6">
              <p className="text-sm font-semibold text-muted-foreground">Institutional Sponsorship</p>
              <p className="mt-2 text-sm text-muted-foreground">Aligned with the 77 Hacks vision and district-wide youth enablement.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Annual Reach</p>
                  <p className="mt-1 text-xl font-bold text-foreground">500+ builders</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Programs</p>
                  <p className="mt-1 text-xl font-bold text-foreground">Hackathon · GameJam</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold font-heading tracking-tight text-foreground">The Mission</h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Butwal Hacks is part of the 77 Hacks vision: technology excellence in every district of Nepal. We believe
            talent is distributed evenly, but opportunity is not.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Sponsorship bridges this gap between youth potential and execution capacity by investing in mentorship,
            practical programs, and open community infrastructure.
          </p>
        </div>
      </section>

      <section className="border-b border-border px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-4xl font-bold font-heading tracking-tight text-foreground">Audience & Impact</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
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
                <article key={metric.label} className="rounded-xl border border-border bg-card p-6">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-5xl font-bold font-heading leading-none text-foreground">{metric.value}</p>
                  <h3 className="mt-2 text-base font-semibold text-foreground">{metric.label}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{metric.note}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="tiers" className="border-b border-border px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-4xl font-bold font-heading tracking-tight text-foreground">Partnership Tiers</h2>
          <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground">
            Scalable involvement options designed for organizations of all sizes.
          </p>

          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Benefit</th>
                  <th className="px-4 py-3 font-semibold">Community</th>
                  <th className="px-4 py-3 font-semibold">Silver</th>
                  <th className="px-4 py-3 font-semibold">Gold</th>
                  <th className="px-4 py-3 font-semibold">Platinum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Logo Placement</td>
                  <td className="px-4 py-3">Website</td>
                  <td className="px-4 py-3">Web + Banners</td>
                  <td className="px-4 py-3">Web + Banners + Swag</td>
                  <td className="px-4 py-3">All Primary Channels</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Recruitment Access</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 text-primary">Resume Database</td>
                  <td className="px-4 py-3 text-primary">On-site Interviews</td>
                  <td className="px-4 py-3 text-primary">Priority Hiring Desk</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Workshop Rights</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">1 Workshop Session</td>
                  <td className="px-4 py-3">Main Stage Keynote</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Brand Integration</td>
                  <td className="px-4 py-3">None</td>
                  <td className="px-4 py-3">Social Media</td>
                  <td className="px-4 py-3">Social + Swag</td>
                  <td className="px-4 py-3 text-primary">Named Prize Category</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trusted by Visionary Organizations</p>
            <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-semibold text-muted-foreground">
              {partnerLogos.map((partner) => (
                <span key={partner}>{partner}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Transparency First
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                We operate as a high-trust nonprofit. Sponsor contributions are tracked and reported through public
                annual documentation.
              </p>
            </div>
            <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              View Reports
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-4xl font-bold font-heading tracking-tight text-foreground">Let&apos;s Build the Future Together</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Interested in more than one tier? We are open to custom partnerships, scholarships, and specialized
              hackathon tracks aligned with your goals.
            </p>

            <ul className="mt-7 space-y-4 text-sm text-muted-foreground">
              <li className="inline-flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> team@butwalhacks.com</li>
              <li className="inline-flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +977 980-0000000</li>
              <li className="inline-flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> Butwal, Rupandehi, Nepal</li>
            </ul>
          </div>

          <form className="rounded-xl border border-border bg-card p-6" aria-label="Sponsor inquiry form">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-muted-foreground">
                Full Name
                <input type="text" placeholder="John Doe" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
              </label>
              <label className="text-sm text-muted-foreground">
                Company Email
                <input type="email" placeholder="john@company.com" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
              </label>
            </div>

            <label className="mt-4 block text-sm text-muted-foreground">
              Company Name
              <input type="text" placeholder="Tech Innovations Inc." className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
            </label>

            <label className="mt-4 block text-sm text-muted-foreground">
              Interested Tier
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                <option>Select a tier...</option>
                <option>Community</option>
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
                <option>Custom Partnership</option>
              </select>
            </label>

            <label className="mt-4 block text-sm text-muted-foreground">
              Message
              <textarea rows={4} placeholder="How can we help?" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
            </label>

            <button type="submit" className="mt-5 w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Send Inquiry
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  )
}
