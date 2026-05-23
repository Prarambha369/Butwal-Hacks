import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Handshake, Laptop, Lightbulb, ShieldCheck, TrendingUp, Users } from "lucide-react"

const foundationIdentity = [
  {
    title: "Mission",
    description:
      "To decentralize technology education and innovation in Nepal by providing youth in Lumbini Province with access to hands-on learning and mentorship.",
  },
  {
    title: "Vision",
    description:
      "A future where Butwal is recognized as a vibrant technical hub, fostering innovation and social impact nationally.",
  },
  {
    title: "Values",
    description:
      "Integrity, inclusion, collaboration, accountability, and long-term community stewardship.",
  },
]

const pillars = [
  {
    title: "Hackathons & Game Jams",
    description: "Hands-on events promoting collaborative learning.",
    icon: Laptop,
  },
  {
    title: "Workshops & Trainings",
    description: "Practical sessions on technology, leadership, and open-source skills.",
    icon: BookOpen,
  },
  {
    title: "Community Engagement",
    description: "Organize meetups and projects to strengthen local tech culture.",
    icon: Users,
  },
  {
    title: "Partnerships & Networks",
    description: "Connect local talent with global initiatives and mentors.",
    icon: Handshake,
  },
  {
    title: "Innovation & Problem Solving",
    description: "Encourage development of solutions for local challenges.",
    icon: Lightbulb,
  },
  {
    title: "Talent Development",
    description: "Provide ongoing mentorship to nurture future tech leaders.",
    icon: TrendingUp,
  },
]

const roadmap = [
  {
    year: "Year 1",
    title: "Foundation and Local Alignment",
    description: "Establish local community, host small-scale events, build school partnerships.",
  },
  {
    year: "Year 2",
    title: "Program Expansion Across Rupandehi",
    description: "Expand across Rupandehi, launch skill-building programs, strengthen mentorship.",
  },
  {
    year: "Year 3",
    title: "Regional Leadership",
    description: "Position as regional tech hub, organize province-wide events, support open-source contributions.",
  },
]

export default function Mission() {
  return (
    <section id="mission" className="px-4 py-16 sm:py-20 border-y border-border bg-background">
      <div className="max-w-6xl mx-auto space-y-14">
        <section aria-labelledby="foundation-identity">
          <header className="mb-6">
            <h2 id="foundation-identity" className="text-3xl sm:text-4xl font-bold font-heading text-foreground">
              Mission, Vision &amp; Values
            </h2>
            <p className="mt-3 text-muted-foreground max-w-3xl">
              Our foundation model is built for measurable impact, equitable access, and long-term ecosystem growth.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {foundationIdentity.map((item, index) => (
              <Card key={item.title} className={`border card-${index === 0 ? 'blush' : index === 1 ? 'teal' : 'mint'}`}>
                <CardHeader>
                  <CardTitle className="text-foreground">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="what-we-do" aria-labelledby="core-pillars">
          <header className="mb-6">
            <h2 id="core-pillars" className="text-3xl sm:text-4xl font-bold font-heading text-foreground">
              What We Do
            </h2>
            <p className="mt-3 text-muted-foreground max-w-3xl">
              Our programs focus on practical capability building, trusted partnerships, and regional opportunity.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon
              const colorClasses = ["card-blush", "card-peach", "card-cream", "card-mint", "card-teal", "card-sky"];
              const colorClass = colorClasses[index % colorClasses.length];
              return (
                <Card key={pillar.title} className={`border hover:shadow-lg transition-all ${colorClass}`}>
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-lg font-heading text-foreground leading-snug">{pillar.title}</CardTitle>
                    <Icon className="w-5 h-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section id="roadmap" aria-labelledby="roadmap-heading">
          <header className="mb-6">
            <h2 id="roadmap-heading" className="text-3xl sm:text-4xl font-bold font-heading text-foreground">
              Roadmap (Year 1–3)
            </h2>
            <p className="mt-3 text-muted-foreground max-w-3xl">
              A phased roadmap designed to institutionalize impact and scale responsibly.
            </p>
          </header>

          <ol className="relative border-l border-border pl-6 space-y-5">
            {roadmap.map((item) => (
              <li key={item.year} className="relative">
                <span className="absolute -left-[2.05rem] top-1 inline-flex h-4 w-4 rounded-full bg-primary" aria-hidden="true" />
                <article>
                  <Badge className="mb-2 bg-primary text-primary-foreground border-0">{item.year}</Badge>
                  <Card className="border card-cream">
                    <CardHeader>
                      <CardTitle className="text-foreground font-heading flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </article>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  )
}
