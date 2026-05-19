"use client"

import { ArrowRight } from "lucide-react"

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
    upcoming: { bg: "bg-gradient-to-r from-emerald-600 to-green-600", label: "Upcoming" },
    ended: { bg: "bg-gradient-to-r from-gray-600 to-slate-600", label: "Ended" },
    tba: { bg: "bg-gradient-to-r from-red-600 to-red-700", label: "Coming Soon" },
  }

  const config = statusConfig[event.status]

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-2xl hover:shadow-red-500/50 active:scale-[0.98]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 to-red-800/50 group-hover:from-red-800 group-hover:to-red-700 transition-all" />
      <div className="absolute inset-0 border border-red-500/20 group-hover:border-red-500/50 rounded-xl transition-all" />

      <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />

      <div className="relative p-4 sm:p-6 z-10">
        <div className={`inline-block ${config.bg} px-3 py-1 rounded-full text-white text-xs font-bold mb-2 sm:mb-3`}>
          {config.label}
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{event.title}</h3>
        <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3">{event.date}</p>
        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{event.description}</p>

        <div className="mt-3 sm:mt-4 flex items-center text-red-300 group-hover:text-red-200 transition-colors">
          <span className="text-xs sm:text-sm font-semibold flex items-center gap-1">
            Learn More <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </span>
        </div>
      </div>
    </a>
  )
}

export default function EventsGrid() {
  return (
    <section id="events" className="py-12 sm:py-16 md:py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Our Events</h2>
          <p className="text-gray-400 text-base sm:text-lg px-2">
            Building a culture of innovation through engaging workshops and hackathons
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}
