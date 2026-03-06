import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Trophy, Bus, Backpack, ShieldCheck } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import SiteHeader from "@/components/site-header"
import { Badge } from "@/components/ui/badge"

type TimelineItem = {
  time: string
  title: string
  note: string
}

type TeamMember = {
  name: string
  role: string
}

type FaqItem = {
  q: string
  a: string
}

type EventExperiencePageProps = {
  title: string
  status: "completed" | "planned"
  dateLabel: string
  summary: string
  initiativeLabel: string
  initiativeHref: string
  venue: string
  locationLabel: string
  prizeLabel: string
  heroTag: string
  timeline: TimelineItem[]
  team: TeamMember[]
  faqs: FaqItem[]
}

export default function EventExperiencePage({
  title,
  status,
  dateLabel,
  summary,
  initiativeLabel,
  initiativeHref,
  venue,
  locationLabel,
  prizeLabel,
  heroTag,
  timeline,
  team,
  faqs,
}: EventExperiencePageProps) {
  const statusLabel = status === "completed" ? "Completed Event" : "Planned Event"

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Events", href: "/events" }, { label: title }]} />

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <Badge className="border border-primary/40 bg-primary/10 text-primary">{heroTag}</Badge>
              <h1 className="mt-4 text-5xl font-bold font-heading leading-[0.92] tracking-tight text-foreground sm:text-6xl">
                {title}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{summary}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={initiativeHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  View {initiativeLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  All Events
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-primary/30 bg-background p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Event Snapshot</p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Status:</span> {statusLabel}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Date:</span> {dateLabel}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Venue:</span> {venue}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Location:</span> {locationLabel}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Prizes:</span> {prizeLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-4 md:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">Venue</h2>
          <p className="mt-2 text-sm text-muted-foreground">{venue}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">Date</h2>
          <p className="mt-2 text-sm text-muted-foreground">{dateLabel}</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold text-foreground">Prizes</h2>
          <p className="mt-2 text-sm text-muted-foreground">{prizeLabel}</p>
        </article>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-4xl font-bold font-heading tracking-tight text-foreground">Timeline</h2>
        <div className="mt-8 space-y-4">
          {timeline.map((item, index) => (
            <article
              key={`${item.time}-${item.title}`}
              className={`rounded-xl border border-border bg-card p-5 ${index % 2 === 1 ? "md:ml-auto md:max-w-[70%]" : "md:mr-auto md:max-w-[70%]"}`}
            >
              <p className="text-xs uppercase tracking-wide text-primary">{item.time}</p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/60 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-4xl font-bold font-heading tracking-tight text-foreground">The Squad</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <article key={member.name} className="rounded-xl border border-border bg-background p-5 text-center">
                <div className="mx-auto h-20 w-20 rounded-full border border-border bg-muted" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">{member.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-[1fr_1fr]">
        <article>
          <h2 className="text-4xl font-bold font-heading tracking-tight text-foreground">Getting There</h2>
          <ul className="mt-6 space-y-4">
            <li className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Bus className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Local Transport</p>
                  <p className="mt-1 text-sm text-muted-foreground">Public transit and local rides are available near the venue entrance.</p>
                </div>
              </div>
            </li>
            <li className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Backpack className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Travel Kit</p>
                  <p className="mt-1 text-sm text-muted-foreground">Bring your laptop, charger, water bottle, and comfortable clothing.</p>
                </div>
              </div>
            </li>
          </ul>
        </article>
        <aside className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-lg font-semibold text-foreground">Location</h3>
          <p className="mt-2 text-sm text-muted-foreground">{locationLabel}</p>
          <div className="mt-4 h-48 rounded-lg border border-border bg-muted" />
        </aside>
      </section>

      <section className="border-y border-border bg-card/40 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-4xl font-bold font-heading tracking-tight text-foreground">Questions?</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-xl border border-border bg-background p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">{item.q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">Powered by the Community</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Butwal Hacks collaborates with local and global partners to keep events practical, inclusive, and youth-led.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}