import Link from "next/link";
import { ArrowLeft, Code2, Calendar, MapPin, Users } from "lucide-react";
import { createClient } from "@/utils/supabase";
import { events as staticEvents, getEventBySlug } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import ExpoProjectGrid, { type ExpoProject } from "./expo-grid";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return staticEvents.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  return buildPageMetadata({
    title: `${event?.title || "Event"} — Projects`,
    description: `Browse projects submitted by participants at ${event?.title || "this event"}.`,
    path: `/events/${slug}/projects`,
  });
}

export default async function EventExpoPage({ params }: Props) {
  const { slug } = await params;
  const staticEvent = getEventBySlug(slug);

  // Look up the event in the DB by slug
  const supabase = await createClient();
  const { data: dbEvent } = await supabase
    .from("events")
    .select("id, title, slug, start_date, end_date, location, organizer_id")
    .eq("slug", slug)
    .single();

  let projects: ExpoProject[] = [];
  let organizerName: string | null = null;

  if (dbEvent) {
    // Fetch organizer profile
    if (dbEvent.organizer_id) {
      const { data: orgProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", dbEvent.organizer_id)
        .single();
      organizerName = orgProfile?.full_name || null;
    }

    // Fetch projects
    const { data: projectData } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        description,
        tech_stack,
        cover_image,
        github_url,
        demo_url,
        created_at,
        profiles!inner(id, full_name, avatar_url, bh_id)
      `)
      .eq("event_id", dbEvent.id)
      .order("created_at", { ascending: false });

    projects = (projectData ?? []) as unknown as ExpoProject[];
  }

  const eventTitle = dbEvent?.title || staticEvent?.title || "Event";

  // Compute stats
  const uniqueTechs = new Set<string>();
  const uniqueParticipants = new Set<string>();
  projects.forEach((p) => {
    p.tech_stack?.forEach((t) => uniqueTechs.add(t));
    if (p.profiles?.id) uniqueParticipants.add(p.profiles.id);
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        {/* Back link */}
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to {eventTitle}
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ─── Sidebar ─── */}
          <aside className="lg:w-72 shrink-0 space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tight text-primary sm:text-5xl">
                Project Expo
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Browse projects submitted by participants at {eventTitle}.
              </p>
            </div>

            {/* Event metadata cards */}
            <div className="bh-card p-5 space-y-4">
              {/* Date */}
              {dbEvent?.start_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary-red mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="text-primary font-medium">
                      {formatDate(dbEvent.start_date)}
                      {dbEvent.end_date && !dbEvent.end_date.startsWith(dbEvent.start_date.split("T")[0])
                        ? ` — ${formatDate(dbEvent.end_date)}`
                        : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Location */}
              {dbEvent?.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary-red mt-0.5 shrink-0" />
                  <span className="text-sm text-primary">{dbEvent.location}</span>
                </div>
              )}

              {/* Organizer */}
              {organizerName && (
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-primary-red mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="text-primary font-medium">Organized by</span>
                    <span className="text-muted-foreground"> {organizerName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            {projects.length > 0 && (
              <div className="bh-card p-5 space-y-4">
                <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Expo Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">{projects.length}</div>
                    <div className="text-[11px] text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{uniqueParticipants.size}</div>
                    <div className="text-[11px] text-muted-foreground">Participants</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{uniqueTechs.size}</div>
                    <div className="text-[11px] text-muted-foreground">Technologies</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-red">
                      {uniqueParticipants.size > 0
                        ? (projects.length / uniqueParticipants.size).toFixed(1)
                        : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Avg. Projects/Person</div>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* ─── Main Content ─── */}
          <div className="flex-1 min-w-0">
            {projects.length > 0 ? (
              <ExpoProjectGrid projects={projects} />
            ) : (
              <div className="bh-card p-16 text-center space-y-4">
                <Code2 size={48} className="mx-auto opacity-20" />
                <p className="text-xl font-bold text-primary">No projects yet</p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Projects will appear here once participants submit them through the hacker dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
