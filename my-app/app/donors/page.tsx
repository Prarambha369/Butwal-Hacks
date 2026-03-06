import type { Metadata } from "next"
import Link from "next/link"

import Breadcrumbs from "@/components/breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Donor Recognition",
  description:
    "Honoring the individuals and organizations whose generous support makes Butwal Hacks Foundation's mission possible.",
  path: "/donors",
})

// Example donor data - in a real application, this would come from a database
const diamondDonors = [
  {
    name: "TechCorp Nepal",
    amount: "NPR 50,000+",
    type: "Corporate",
    date: "January 2026",
    message: "Proud to support the next generation of innovators in Butwal.",
  },
]

const platinumDonors = [
  {
    name: "Prashant Adhikari",
    amount: "NPR 25,000",
    type: "Individual",
    date: "February 2026",
    message: "Education transforms communities. Happy to contribute!",
  },
  {
    name: "Digital Ventures Pvt. Ltd.",
    amount: "NPR 30,000",
    type: "Corporate",
    date: "December 2025",
    message: "Investing in Nepal's tech talent ecosystem.",
  },
]

const goldDonors = [
  {
    name: "Aashish Sharma",
    amount: "NPR 10,000",
    type: "Individual",
    date: "February 2026",
  },
  {
    name: "Kritika Thapa",
    amount: "NPR 12,000",
    type: "Individual",
    date: "January 2026",
  },
  {
    name: "StartupHub Butwal",
    amount: "NPR 15,000",
    type: "Corporate",
    date: "January 2026",
  },
  {
    name: "Suman Rai",
    amount: "NPR 10,000",
    type: "Individual",
    date: "December 2025",
  },
]

const communitySupport = [
  { name: "Ramesh K.", message: "Keep up the amazing work! 🚀", amount: "NPR 2,500" },
  { name: "Anjali D.", message: "So proud of this initiative!", amount: "NPR 5,000" },
  { name: "Tech Enthusiasts Club", message: "Building the future together.", amount: "NPR 7,500" },
  { name: "Bishal M.", message: "Education is the key to progress.", amount: "NPR 3,000" },
  { name: "Maya S.", message: "Thank you for empowering our youth!", amount: "NPR 4,000" },
  { name: "CodeCrafters Nepal", message: "Excited to see Nepal's tech scene grow.", amount: "NPR 8,000" },
]

const donorOfMonth = {
  name: "Prashant Adhikari",
  title: "Software Engineer & Tech Mentor",
  amount: "NPR 25,000",
  date: "February 2026",
  story:
    "Prashant has been a long-time advocate for tech education in rural Nepal. His generous contribution is funding our upcoming workshop series in Rupandehi district, bringing hands-on coding education to 100+ students who wouldn't otherwise have access to quality tech training.",
  impact: "His donation will sponsor 5 full-day workshops, covering materials, mentors, and venue costs.",
}

export default function DonorsPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Donors" }]} />
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-foreground">
            Donor Recognition Wall
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base sm:text-lg text-muted-foreground">
            We are deeply grateful to these individuals and organizations whose generosity makes our mission possible.
            Together, we&apos;re building a stronger tech community in Nepal.
          </p>
        </div>

        {/* Donor of the Month Spotlight */}
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <Badge variant="default" className="bg-accent text-accent-foreground">
              Donor of the Month
            </Badge>
            <span className="text-sm text-muted-foreground">February 2026</span>
          </div>
          <Card className="border-2 border-accent bg-gradient-to-br from-card to-accent/5">
            <CardContent className="p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold font-heading text-foreground">{donorOfMonth.name}</h2>
                    <p className="text-sm text-muted-foreground">{donorOfMonth.title}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{donorOfMonth.story}</p>
                  <div className="mt-4 rounded-lg border border-accent/20 bg-accent/10 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-accent">Impact</div>
                    <p className="mt-1 text-sm text-foreground">{donorOfMonth.impact}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <div className="rounded-lg border border-border bg-card p-4 text-center">
                    <div className="text-3xl font-bold text-primary">{donorOfMonth.amount}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Total Contribution</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4 text-center">
                    <div className="text-lg font-semibold text-foreground">{donorOfMonth.date}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Contribution Date</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recognition Tiers */}
        <div className="mt-16">
          <h2 className="text-center text-3xl font-bold font-heading text-foreground">Recognition Tiers</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
            Honoring our supporters based on their lifetime contributions to Butwal Hacks Foundation.
          </p>

          {/* Diamond Tier - NPR 50,000+ */}
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 px-3 py-1.5">
                <span className="text-sm font-bold text-primary">💎 Diamond</span>
              </div>
              <span className="text-xs text-muted-foreground">NPR 50,000+</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {diamondDonors.map((donor, idx) => (
                <Card key={idx} className="border-2 border-primary bg-gradient-to-br from-card to-primary/5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{donor.name}</CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {donor.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{donor.date}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                        {donor.amount}
                      </div>
                    </div>
                  </CardHeader>
                  {donor.message && (
                    <CardContent>
                      <p className="text-sm italic text-muted-foreground">&ldquo;{donor.message}&rdquo;</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Platinum Tier - NPR 25,000-49,999 */}
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-secondary/10 px-3 py-1.5">
                <span className="text-sm font-bold text-secondary">🏆 Platinum</span>
              </div>
              <span className="text-xs text-muted-foreground">NPR 25,000 - 49,999</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {platinumDonors.map((donor, idx) => (
                <Card key={idx} className="border-2 border-secondary/30 bg-gradient-to-br from-card to-secondary/5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{donor.name}</CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {donor.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{donor.date}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                        {donor.amount}
                      </div>
                    </div>
                  </CardHeader>
                  {donor.message && (
                    <CardContent>
                      <p className="text-sm italic text-muted-foreground">&ldquo;{donor.message}&rdquo;</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Gold Tier - NPR 10,000-24,999 */}
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[#FFD700]/20 px-3 py-1.5">
                <span className="text-sm font-bold text-[#B8860B]">⭐ Gold</span>
              </div>
              <span className="text-xs text-muted-foreground">NPR 10,000 - 24,999</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goldDonors.map((donor, idx) => (
                <Card key={idx} className="border border-[#FFD700]/30 bg-gradient-to-br from-card to-[#FFD700]/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{donor.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {donor.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{donor.amount}</span>
                      <span>{donor.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Community Support Wall - Masonry Style */}
        <div className="mt-16">
          <h2 className="text-center text-3xl font-bold font-heading text-foreground">Community Support Wall</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
            Every contribution matters. Thank you to all our community supporters!
          </p>
          <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {communitySupport.map((supporter, idx) => (
              <Card key={idx} className="mb-4 break-inside-avoid border-border">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="font-semibold text-foreground">{supporter.name}</div>
                    <div className="text-xs font-medium text-primary">{supporter.amount}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{supporter.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recognition Programs Info */}
        <div className="mt-16">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Benefits for Our Supporters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">Recognition</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Featured on our website</li>
                    <li>• Social media acknowledgment</li>
                    <li>• Annual impact reports</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">For Corporate Sponsors</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Logo placement at events</li>
                    <li>• Recruitment opportunities</li>
                    <li>• Brand visibility</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">Community Impact</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Direct program support</li>
                    <li>• Quarterly updates</li>
                    <li>• Invitation to events</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
          <h3 className="text-2xl font-bold font-heading text-foreground">Join Our Community of Supporters</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Your contribution, no matter the size, helps us create opportunities for aspiring technologists across Nepal.
            Be a part of the change.
          </p>
          <div className="mt-6">
            <Link
              href="/support"
              className="inline-block rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Support Our Mission
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            All donors are recognized according to their preference. If you wish to remain anonymous, please let us know.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
