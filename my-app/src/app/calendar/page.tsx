import type { Metadata } from "next";
import EventCalendar from "@/components/home/event-calendar";
import { buildPageMetadata } from "@/lib/seo";
import { createServiceClient } from "@/utils/supabase";

export const metadata: Metadata = buildPageMetadata({
  title: "Calendar",
  description: "BH events, festivals, and public holidays on one calendar.",
  path: "/calendar",
});

export const revalidate = 3600;

/**
 * /calendar — the full-page events calendar.
 * Same component as the homepage section, with room to breathe.
 * Publishing an event is all an organizer must do to appear here.
 */
export default async function CalendarPage() {
  const supabase = createServiceClient();
  const { data: publishedEvents } = await supabase
    .from("events")
    .select("title, slug, start_date, end_date")
    .eq("is_published", true)
    .order("start_date", { ascending: true })
    .limit(200)
    .abortSignal(AbortSignal.timeout(5000));

  const calendarEvents = ((publishedEvents ?? []) as Array<{
    title: string; slug: string | null; start_date: string; end_date: string | null;
  }>).map((e) => ({ title: e.title, slug: e.slug, start_date: e.start_date, end_date: e.end_date }));

  return (
    <main className="min-h-dvh bg-background text-primary">
      <EventCalendar events={calendarEvents} />
    </main>
  );
}
