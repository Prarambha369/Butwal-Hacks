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
    title: "HackDay",
    date: "January 17, 2026",
    status: "upcoming",
    description: "An exciting day of innovation, coding, and collaboration where students bring ideas to life",
    url: "https://HackDay.butwalhacks.com",
  },
  {
    id: "daydream",
    title: "Daydream",
    date: "Past Event",
    status: "ended",
    description: "A celebration of creativity and design thinking that brought our community together",
    url: "https://Daydream.butwalhacks.com",
  },
  {
    id: "web3",
    title: "Web3",
    date: "Coming Soon",
    status: "tba",
    description: "Exploring the future of decentralized technology and blockchain innovation",
    url: "https://web3.butwalhacks.com",
  },
]

function EventCard({ event }: { event: Event }) {
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
        <Card className="h-full border-border/70 bg-card/90 hover:bg-card transition-colors">
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
  return (
    <section id="events" className="py-12 sm:py-16 md:py-20 px-4" aria-labelledby="events-heading">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 id="events-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Programs and Events</h2>
          <p className="text-slate-300 text-base sm:text-lg px-2">
            We host practical programs that connect youth with modern technology, mentorship, and collaborative learning.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}
