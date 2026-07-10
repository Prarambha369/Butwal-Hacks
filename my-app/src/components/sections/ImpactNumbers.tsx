import { Users, Calendar, Code2, MapPin } from "lucide-react"

const stats = [
  {
    value: "500+",
    label: "Community Members",
    description: "Active builders, mentors, and organizers across Lumbini Province",
    icon: Users,
  },
  {
    value: "20+",
    label: "Events Hosted",
    description: "Hackathons, game jams, workshops, and meetups since 2024",
    icon: Calendar,
  },
  {
    value: "40+",
    label: "Projects Shipped",
    description: "Open-source and hackathon projects built by the community",
    icon: Code2,
  },
  {
    value: "8+",
    label: "Districts Reached",
    description: "Youth participants from across Lumbini and neighboring provinces",
    icon: MapPin,
  },
]

export default function ImpactNumbers() {
  return (
    <section className="border-b border-border/30 bg-background/30 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-red">
            Our Impact
          </p>
          <h2 className="text-4xl font-extrabold leading-tight text-text-primary md:text-5xl">
            Growing the Community
          </h2>
          <p className="mx-auto max-w-2xl text-text-muted">
            Since our founding, Butwal Hacks has been building a decentralized technology ecosystem
            for youth in Western Nepal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="lg-surface rounded-3xl border border-border/30 p-6 text-center space-y-4 transition-all hover:border-primary-red/30"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-red/10 text-primary-red">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-4xl font-black text-text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm font-bold text-text-body">{stat.label}</p>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{stat.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
