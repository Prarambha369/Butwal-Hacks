import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DonorData {
  name: string
  amount: string
  type: string
  date: string
  message?: string
}

const diamondDonors: DonorData[] = [
  {
    name: "TechCorp Nepal",
    amount: "NPR 50,000+",
    type: "Corporate",
    date: "January 2026",
    message: "Supporting tech builders in Butwal.",
  },
]

const platinumDonors: DonorData[] = [
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
    message: "Backing Nepal's next generation of builders.",
  },
]

const goldDonors: DonorData[] = [
  { name: "Aashish Sharma", amount: "NPR 10,000", type: "Individual", date: "February 2026" },
  { name: "Kritika Thapa", amount: "NPR 12,000", type: "Individual", date: "January 2026" },
  { name: "StartupHub Butwal", amount: "NPR 15,000", type: "Corporate", date: "January 2026" },
  { name: "Suman Rai", amount: "NPR 10,000", type: "Individual", date: "December 2025" },
]

type Tier = "diamond" | "platinum" | "gold"

const tierStyles: Record<Tier, { border: string; gradient: string; amountColor: string; amountBg: string }> = {
  diamond: {
    border: "border-2 border-primary",
    gradient: "from-card to-primary/5",
    amountColor: "text-primary",
    amountBg: "bg-primary/10",
  },
  platinum: {
    border: "border-2 border-secondary/30",
    gradient: "from-card to-secondary/5",
    amountColor: "text-secondary",
    amountBg: "bg-secondary/10",
  },
  gold: {
    border: "border border-status-yellow/30",
    gradient: "from-card to-status-yellow/5",
    amountColor: "text-secondary",
    amountBg: "",
  },
}

function TierCard({ donor, tier }: { donor: DonorData; tier: Tier }) {
  const style = tierStyles[tier]

  return (
    <Card className={`${style.border} bg-gradient-to-br ${style.gradient}`}>
      <CardHeader className={tier === "gold" ? "pb-3" : undefined}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className={tier === "diamond" ? "text-xl" : tier === "platinum" ? "text-lg" : "text-base"}>
              {donor.name}
            </CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{donor.type}</Badge>
              {tier !== "gold" && <span className="text-xs text-secondary">{donor.date}</span>}
            </div>
          </div>
          {tier !== "gold" && (
            <div className={`rounded-lg ${style.amountBg} px-3 py-1 text-sm font-bold ${style.amountColor}`}>
              {donor.amount}
            </div>
          )}
        </div>
      </CardHeader>
      {tier === "gold" ? (
        <CardContent className="pb-4">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>{donor.amount}</span>
            <span>{donor.date}</span>
          </div>
        </CardContent>
      ) : donor.message ? (
        <CardContent>
          <p className="text-sm italic text-secondary">&ldquo;{donor.message}&rdquo;</p>
        </CardContent>
      ) : null}
    </Card>
  )
}

export function RecognitionTiers() {
  return (
    <div className="mt-16">
      <h2 className="text-center text-3xl font-bold font-heading text-primary">Recognition Tiers</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-secondary">
        Honoring our supporters based on their lifetime contributions to Butwal Hacks Foundation.
      </p>

      {/* Diamond Tier */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 px-3 py-1.5">
            <span className="text-sm font-bold text-primary">Diamond</span>
          </div>
          <span className="text-xs text-secondary">NPR 50,000+</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {diamondDonors.map((donor, idx) => (
            <TierCard key={idx} donor={donor} tier="diamond" />
          ))}
        </div>
      </div>

      {/* Platinum Tier */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-secondary/10 px-3 py-1.5">
            <span className="text-sm font-bold text-secondary">Platinum</span>
          </div>
          <span className="text-xs text-secondary">NPR 25,000 - 49,999</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {platinumDonors.map((donor, idx) => (
            <TierCard key={idx} donor={donor} tier="platinum" />
          ))}
        </div>
      </div>

      {/* Gold Tier */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-status-yellow/20 px-3 py-1.5">
            <span className="text-sm font-bold text-status-yellow">Gold</span>
          </div>
          <span className="text-xs text-secondary">NPR 10,000 - 24,999</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goldDonors.map((donor, idx) => (
            <TierCard key={idx} donor={donor} tier="gold" />
          ))}
        </div>
      </div>
    </div>
  )
}
