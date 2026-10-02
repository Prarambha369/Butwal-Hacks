import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/utils/supabase";
import { formatDualDate } from "@/lib/nepali-date";
import OrganizerDashboardClient from "./organizer-dashboard-client";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = { ...buildPageMetadata({title: "Organizer Dashboard", description: "Organizer workspace", path: "/dashboard/organizer", keywords: []}), robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function OrganizerDashboardPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/auth/login");

  const db = createServiceClient();

  // Get organizer profile
  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", userId)
    .single();

  if (!profile) redirect("/dashboard");

  const profileId = profile.id;
  const now = new Date().toISOString();

  // All three read only `profileId`, so they are independent and were three
  // sequential round-trips. The profile query has to resolve `profileId`
  // first; these three now cost one round-trip between them instead of three.
  const [
    // Real events for this organizer
    { data: events },
    // Recent registrations, as notices
    { data: recentRegistrations },
    { data: recentProjects },
  ] = await Promise.all([
    db
      .from("events")
      .select("id, title, start_date, end_date, is_published")
      .eq("organizer_id", profileId)
      .order("start_date", { ascending: false }),
    db
      .from("event_registrations")
      .select("id, created_at, events!inner(title)")
      .eq("events.organizer_id", profileId)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("projects")
      .select("id, created_at, title")
      .eq("organizer_id", profileId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const mappedEvents = (events ?? []).map((ev) => {
    let status: "upcoming" | "live" | "completed";
    if (ev.start_date > now) status = "upcoming";
    else if (ev.end_date < now) status = "completed";
    else status = "live";

    return {
      id: ev.id,
      name: ev.title,
      date: formatDualDate(new Date(ev.start_date)),
      status,
    };
  });

  const notices: { id: string; text: string; time: string; type: "info" | "warning" | "success" }[] = [];

  recentRegistrations?.forEach((reg) => {
    const eventTitle = Array.isArray(reg.events) ? reg.events[0]?.title : (reg.events as { title: string } | null)?.title;
    notices.push({
      id: `reg-${reg.id}`,
      text: `New registration for ${eventTitle ?? "event"}`,
      time: timeAgo(reg.created_at),
      type: "info",
    });
  });

  recentProjects?.forEach((proj) => {
    notices.push({
      id: `proj-${proj.id}`,
      text: `New project submitted: ${proj.title}`,
      time: timeAgo(proj.created_at),
      type: "success",
    });
  });

  // Counts for metric cards
  const activeEvents = mappedEvents.filter((e) => e.status !== "completed").length;

  return (
    <OrganizerDashboardClient
      events={mappedEvents}
      notices={notices.slice(0, 6)}
      totalEvents={mappedEvents.length}
      activeEvents={activeEvents}
    />
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
