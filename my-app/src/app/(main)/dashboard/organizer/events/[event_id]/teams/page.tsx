import { createServiceClient } from "@/utils/supabase/service"
import { notFound } from "next/navigation"
import { GraduationCap, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TeamFormationClient } from "./team-formation-client"
import { getEventTeams, getUnassignedAttendees } from "@/lib/actions/teams"
import type { Metadata } from "next"

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team Formation — Butwal Hacks",
  description: "Manually create teams and assign members for your event.",
};

export default async function EventTeamsPage({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  const supabase = createServiceClient();

  // Verify event exists
  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", event_id)
    .single();

  if (!event) notFound();

  // Fetch teams and unassigned attendees in parallel
  const [teams, unassigned] = await Promise.all([
    getEventTeams(event_id),
    getUnassignedAttendees(event_id),
  ]);

  return (
    <main className="min-h-dvh bg-background pt-28 pb-16 px-6 md:px-20">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href={`/dashboard/organizer/events/${event_id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Event
            </Link>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-10 h-10 rounded-xl bg-primary-red/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-red" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary tracking-tight">Team Formation</h1>
                <p className="text-sm text-muted-foreground">{event.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Users className="w-3.5 h-3.5" />
            {unassigned.length} unassigned
          </div>
        </div>

        {/* Team formation client component */}
        <TeamFormationClient
          eventId={event_id}
          initialTeams={teams}
          initialUnassigned={unassigned}
        />
      </div>
    </main>
  );
}
