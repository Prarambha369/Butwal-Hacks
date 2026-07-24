import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import OrganizerDashboardClient from "./organizer-dashboard-client";

export const dynamic = "force-dynamic";

export default async function OrganizerDashboardPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect("/auth/login");

  const db = await createClient();

  // Get organizer profile
  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", userId)
    .single();

  if (!profile) redirect("/dashboard");

  const profileId = profile.id;
  const now = new Date().toISOString();

  // Fetch real events for this organizer
  const { data: events } = await db
    .from("events")
    .select("id, title, start_date, end_date, is_published")
    .eq("organizer_id", profileId)
    .order("start_date", { ascending: false });

  const mappedEvents = (events ?? []).map((ev) => {
    let status: "upcoming" | "live" | "completed";
    if (ev.start_date > now) status = "upcoming";
    else if (ev.end_date < now) status = "completed";
    else status = "live";

    return {
      id: ev.id,
      name: ev.title,
      date: `${new Date(ev.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${ev.end_date ? `-${new Date(ev.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}`,
      status,
    };
  });

  // Fetch recent registrations as notices
  const { data: recentRegistrations } = await db
    .from("event_registrations")
    .select("id, created_at, events!inner(title)")
    .eq("events.organizer_id", profileId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentProjects } = await db
    .from("projects")
    .select("id, created_at, title")
    .eq("organizer_id", profileId)
    .order("created_at", { ascending: false })
    .limit(5);

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
