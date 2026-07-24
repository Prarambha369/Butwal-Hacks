import { auth0 } from "@/lib/auth0";
import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/utils/supabase/service";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Users } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `${slug} Events`,
    description: `Events hosted by ${slug} chapter.`,
    path: `/orgs/${slug}/events`,
  });
}

export default async function OrgEventsPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect("/sign-in");

  const supabase = createServiceClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!chapter) notFound();

  // Look up admin role from chapter_members table
  const { data: membershipProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", userId)
    .single();

  const { data: membership } = await supabase
    .from("chapter_members")
    .select("org_role")
    .eq("chapter_id", chapter.id)
    .eq("profile_id", membershipProfile?.id ?? 'none')
    .single();

  const isAdmin = membership?.org_role === "admin";

  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title, description, start_date, end_date, location, is_published")
    .eq("chapter_id", chapter.id)
    .order("start_date", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">{chapter.name} Events</h1>
          <p className="text-sm text-primary/50">{events?.length ?? 0} event{(events?.length ?? 0) !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <a href={`/orgs/${slug}/events/new`} className="px-4 py-2 rounded-xl bg-primary-red/20 text-primary-red border border-primary-red/30 hover:bg-primary-red/30 transition-all text-sm font-medium">
            + New Event
          </a>
        )}
      </div>

      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => (
            <a key={event.id} href={`/events/${event.slug}`} className="bh-card p-6 hover:bg-surface/10 transition-all flex items-start justify-between gap-4 group">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-primary group-hover:text-primary-red transition-colors">{event.title}</h3>
                  {!event.is_published && <span className="text-[10px] font-medium text-status-yellow bg-status-yellow/10 px-2 py-0.5 rounded-full">Draft</span>}
                </div>
                {event.description && <p className="text-sm text-primary/50 line-clamp-2">{event.description}</p>}
                <div className="flex items-center gap-4 text-xs text-primary/40">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(event.start_date).toLocaleDateString()}</span>
                  {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-primary/20 group-hover:text-primary/50 transition-colors"><Users className="w-5 h-5" /></div>
            </a>
          ))}
        </div>
      ) : (
        <div className="bh-card p-12 text-center">
          <CalendarDays className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary/60 mb-2">No events yet</h3>
          <p className="text-sm text-primary/40">{isAdmin ? "Create your first chapter event to get started." : "Events will appear here when the chapter admin creates them."}</p>
        </div>
      )}
    </div>
  );
}
