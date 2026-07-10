"use client"

// ponytail: no month nav — events are static, one month is enough.
import { GlassCard } from "@/components/ui/glass-card"
import { FadeIn } from "@/components/home/shared-primitives"

// ─── Calendar data ────────────────────────────────────────────────────────────

/** Calendar event types */
type CalendarEventType = "community" | "workshop" | "hackathon"

/** Event styling — dots + legend colors */
const eventStyles: Record<CalendarEventType, { dot: string; label: string; text: string }> = {
  community: { dot: "bg-bh-red-500", label: "Community", text: "text-bh-red-500" },
  workshop: { dot: "bg-status-teal", label: "Workshop", text: "text-status-teal" },
  hackathon: { dot: "bg-status-yellow", label: "Hackathon", text: "text-status-yellow" },
}

/** Calendar events for the current month */
const calendarEvents: { date: number; title: string; type: CalendarEventType }[] = [
  { date: 5, title: "Monthly Community Meetup", type: "community" },
  { date: 12, title: "Workshop: React from Zero", type: "workshop" },
  { date: 18, title: "Hackathon Kickoff", type: "hackathon" },
  { date: 25, title: "Builder Project Showcase", type: "community" },
]

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * UpcomingEventsCalendar — 7-column Liquid Glass calendar showing
 * roadmap events with red dot indicators and hover tooltips.
 */
export default function UpcomingEventsCalendar() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const today = now.getDate()

  // Build 7×N grid: leading empty slots then day numbers
  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return (
    <section
      className="border-b border-glass bg-background/30 px-6 py-28"
      aria-label="Upcoming events calendar"
    >
      <FadeIn className="mx-auto w-full max-w-3xl">
        <div className="text-center space-y-4 mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500">
            Community Roadmap
          </p>
          <h2 className="text-4xl font-extrabold leading-tight text-primary md:text-5xl">
            Events Calendar
          </h2>
        </div>

        <GlassCard variant="default" padding="lg">
          {/* Month header */}
          <h3 className="mb-8 text-center font-mono text-xl font-bold tracking-tight text-primary">
            {monthNames[month]} {year}
          </h3>

          {/* Day-of-week headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {dayNames.map((name) => (
              <div
                key={name}
                className="py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-secondary/50"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) {
                return <div key={`e-${i}`} className="aspect-square" aria-hidden="true" />
              }

              const event = calendarEvents.find((e) => e.date === day)
              const isToday = day === today

              return (
                <div
                  key={day}
                  className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl transition-all duration-200 hover:bg-glass-bg-subtle"
                >
                  {/* Day number */}
                  <span
                    className={`font-mono text-sm font-bold transition-colors ${
                      isToday
                        ? "text-bh-red-500"
                        : event
                          ? "text-primary"
                          : "text-primary/40"
                    }`}
                  >
                    {day}
                  </span>

                  {/* Event dot indicator */}
                  {event && (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${eventStyles[event.type].dot}`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Today ring */}
                  {isToday && (
                    <span
                      className="absolute inset-0 rounded-xl border border-bh-red-500/30"
                      aria-hidden="true"
                    />
                  )}

                  {/* Hover tooltip — glass card with event info */}
                  {event && (
                    <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="whitespace-nowrap rounded-xl border border-glass bg-glass-bg px-4 py-2.5 shadow-lg backdrop-blur-xl">
                        <p className="text-xs font-bold text-primary">{event.title}</p>
                        <p
                          className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${eventStyles[event.type].text}`}
                        >
                          {eventStyles[event.type].label}
                        </p>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="mx-auto -mt-px h-2 w-2 rotate-45 border-b border-r border-glass bg-glass-bg" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 flex items-center justify-center gap-6 border-t border-glass pt-6">
            {(Object.keys(eventStyles) as CalendarEventType[]).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${eventStyles[type].dot}`}
                  aria-hidden="true"
                />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-secondary/60">
                  {eventStyles[type].label}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </FadeIn>
    </section>
  )
}
