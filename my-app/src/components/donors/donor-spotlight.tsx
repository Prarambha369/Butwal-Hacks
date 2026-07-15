import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const donorOfMonth = {
  name: "Prashant Adhikari",
  title: "Software Engineer & Tech Mentor",
  amount: "NPR 25,000",
  date: "February 2026",
  story:
    "Prashant has been a long-time advocate for tech education in rural Nepal. His generous contribution is funding our upcoming workshop series in Rupandehi district, bringing hands-on coding education to 100+ students who wouldn't otherwise have access to quality tech training.",
  impact: "His donation will sponsor 5 full-day workshops, covering materials, mentors, and venue costs.",
}

export function DonorSpotlight() {
  return (
    <div className="mt-12">
      <div className="mb-6 flex items-center gap-3">
        <Badge variant="default" className="bg-accent text-accent-foreground">
          Donor of the Month
        </Badge>
        <span className="text-sm text-secondary">February 2026</span>
      </div>
      <Card className="border-2 border-accent bg-gradient-to-br from-card to-accent/5">
        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-2xl font-bold font-heading text-primary">{donorOfMonth.name}</h2>
                <p className="text-sm text-secondary">{donorOfMonth.title}</p>
              </div>
              <p className="text-sm leading-relaxed text-secondary">{donorOfMonth.story}</p>
              <div className="mt-4 rounded-lg border border-accent/20 bg-accent/10 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-accent">Impact</div>
                <p className="mt-1 text-sm text-primary">{donorOfMonth.impact}</p>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3">
              <div className="rounded-lg border border-border bg-surface p-4 text-center">
                <div className="text-3xl font-bold text-primary">{donorOfMonth.amount}</div>
                <div className="mt-1 text-xs text-secondary">Total Contribution</div>
              </div>
              <div className="rounded-lg border border-border bg-surface p-4 text-center">
                <div className="text-lg font-semibold text-primary">{donorOfMonth.date}</div>
                <div className="mt-1 text-xs text-secondary">Contribution Date</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
