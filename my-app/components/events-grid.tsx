import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Event {
  id: string
  title: string
  date: string
  status: "upcoming" | "ended" | "tba"
  description: string
  url: string
}

const events: Event[] = [
  {
    id: "hackday",
    title: "HackDay Butwal",
    date: "Already Hosted",
    status: "ended",
    description: "An exciting day of innovation, coding, and collaboration where students brought ideas to life",
    url: "https://hackday.butwalhacks.com",
  },
  {
    id: "daydream",
    title: "Daydream",
    date: "Past Event",
    status: "ended",
    description: "A celebration of creativity and design thinking that brought our community together",
    url: "https://daydream.butwalhacks.com",
  },
]

function EventCard({ event, colorClass }: { event: Event; colorClass: string }) {
  const statusConfig = {
    upcoming: { className: "bg-primary/20 border-primary/50 text-primary-foreground", label: "Upcoming" },
    ended: { className: "bg-muted border-border text-muted-foreground", label: "Ended" },
    tba: { className: "bg-secondary border-border text-secondary-foreground", label: "Coming Soon" },
  }

  const config = statusConfig[event.status]

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <article>
        <Card className={`h-full border hover:shadow-lg transition-all ${colorClass}`}>
          <CardHeader>
            <Badge className={`w-fit ${config.className}`}>{config.label}</Badge>
            <CardTitle className="text-white text-xl">{event.title}</CardTitle>
            <p className="text-xs sm:text-sm text-slate-400">{event.date}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-300">{event.description}</p>
            <p className="mt-4 text-sm font-semibold inline-flex items-center gap-1 text-primary group-hover:underline">
              Learn More <ArrowRight className="w-4 h-4" />
            </p>
          </CardContent>
        </Card>
      </article>
    </a>
  )
}

export default function EventsGrid() {
  const colorClasses = ["card-blush", "card-cream"];

  return (
    <section id="events" className="py-12 sm:py-16 md:py-20 px-4" aria-labelledby="events-heading">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 id="events-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">Programs and Events</h2>
          <p className="text-muted-foreground text-base sm:text-lg px-2">
            We host practical programs that connect youth with modern technology, mentorship, and collaborative learning.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} colorClass={colorClasses[index % colorClasses.length]} />
          ))}
        </div>
      </div>
    </section>
  )
}
