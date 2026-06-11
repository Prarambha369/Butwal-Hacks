import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import Breadcrumbs from "@/components/breadcrumbs"


import { events } from "@/lib/content"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Events",
  description: "Explore completed and planned Butwal Hacks events with clear status and route-stable slugs.",
  path: "/events",
})

export default function EventsPage() {
   return (
     <main className="min-h-screen bg-background">
       
       <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
         <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Events" }]} />
         <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">Events</h1>
         <p className="mt-6 max-w-3xl text-lg text-muted-foreground leading-relaxed">
           Explore our events and programs. All events are maintained on stable URLs with clear status indicators.
           Join us for workshops, hackathons, and community gatherings throughout the year.
         </p>

         <div className="mt-14 grid gap-6 md:grid-cols-2">
           {events.map((event) => (
             <article key={event.slug} className="group rounded-xl border border-border bg-card p-7 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
               <div className="flex items-start justify-between gap-4">
                 <div>
                   <p className="text-xs font-bold uppercase tracking-wide text-primary/70">Status: {event.status}</p>
                   <h2 className="mt-3 text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{event.title}</h2>
                   <p className="mt-2 text-sm font-medium text-muted-foreground/80">{event.dateLabel}</p>
                 </div>
               </div>
               <p className="mt-5 text-base text-muted-foreground leading-relaxed">{event.summary}</p>
               <Link href={`/events/${event.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group-hover:gap-3">
                 View details
                 <ArrowRight className="h-4 w-4" aria-hidden="true" />
               </Link>
             </article>
           ))}
         </div>
       </section>
       
     </main>
   )
 }
