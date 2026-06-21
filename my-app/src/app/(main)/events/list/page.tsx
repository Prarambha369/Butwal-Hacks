import { createClient } from "@/utils/supabase/server";

import Link from "next/link";
import { CalendarDays, ArrowRight, MapPin } from "lucide-react";
import Breadcrumbs from "@/components/breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Events",
  description: "Browse and manage all Butwal Hacks events.",
  path: "/events/list",
});

export default async function EventsListPage() {
  const supabase = await createClient();
  
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    logger.error("Error fetching events:", error);
  }

  return (
    <main className="min-h-dvh bg-background py-12 px-6 md:px-20">
      <div className="max-w-6xl mx-auto space-y-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Events" }]} />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-primary">All Events</h1>
            <p className="text-muted-foreground mt-2">Explore the history and future of Butwal Hacks.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(200px,auto)]">
          {events && events.length > 0 ? (
            events.map((event, i) => {
              const isHero = i === 0
              return (
              <div 
                key={event.id} 
                className={`bh-card transition-all hover:border-primary-red/30 group flex flex-col ${
                  isHero ? "md:col-span-2 lg:col-span-2 lg:row-span-2 p-8 lg:justify-center" : "p-6"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`${isHero ? "p-3" : "p-2"} bg-primary-red/10 rounded-lg text-primary-red`}>
                    <CalendarDays size={isHero ? 24 : 20} />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${
                    event.is_published ? "border-status-green/30 text-status-green bg-status-green/10" : "border-status-yellow/30 text-status-yellow bg-status-yellow/10"
                  }`}>
                    {event.is_published ? "PUBLISHED" : "DRAFT"}
                  </span>
                </div>
                
                <h3 className={`font-bold text-primary mb-2 group-hover:text-primary-red transition-colors ${
                  isHero ? "text-2xl lg:text-3xl" : "text-xl"
                }`}>
                  {event.title}
                </h3>
                
                {isHero && event.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                    {event.description}
                  </p>
                )}
                
                <div className={`space-y-2 ${isHero ? "mb-4" : "mb-6"}`}>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                    <CalendarDays size={14} />
                    <span>{new Date(event.start_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <Link 
                    href={`/events/${event.slug}`} 
                    className="text-xs font-bold flex items-center gap-1 text-primary-red hover:underline"
                  >
                    View Details <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )})
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <p className="text-muted-foreground font-mono">No events found in the database.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
