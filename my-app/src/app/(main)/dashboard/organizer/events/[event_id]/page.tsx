import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

import { CloseEventClientButton } from "./close-event-button";

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", event_id)
    .single();

  if (error || !event) {
    notFound();
  }

  const { count: registrationCount } = await supabase
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{event.title}</h1>
          <p className="text-sm text-muted-foreground">Organizer Command Center</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/dashboard/organizer/events/${event_id}/attendees`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-surface-hover transition-all"
          >
            <Users className="w-4 h-4" />
            Attendees
          </Link>
          <Link 
            href={`/dashboard/organizer/events/${event_id}/analytics`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-surface-hover transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bh-card p-6 md:col-span-2 space-y-5">
          <div>
            <h2 className="text-base font-bold text-primary">Event Overview</h2>
            <p className="text-xs text-muted-foreground">General information and configuration</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location || "Virtual / TBD"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{registrationCount || 0} Registered Participants</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {event.is_published ? (
                <><Unlock className="w-4 h-4 text-status-green" /> <span>Status: Published</span></>
              ) : (
                <><Lock className="w-4 h-4 text-primary-red" /> <span>Status: Closed/Draft</span></>
              )}
            </div>
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            <h4 className="text-sm font-bold text-primary">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {event.description || "No description provided."}
            </p>
          </div>
        </div>

        <div className="bh-card p-6 border-primary-red/20 space-y-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary-red" />
            <h2 className="text-base font-bold text-primary">Closure Actions</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Closing an event will stop registrations and automatically issue certificates to attended participants.
          </p>
          <CloseEventButton eventId={event_id} isPublished={event.is_published} />
          <p className="text-[11px] text-center text-muted-foreground">
            This action is irreversible.
          </p>
        </div>
      </div>
    </div>
  );
}

async function CloseEventButton({ eventId, isPublished }: { eventId: string, isPublished: boolean }) {
  if (!isPublished) {
    return (
      <button disabled className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed">
        Event Already Closed
      </button>
    );
  }

  return <CloseEventClientButton eventId={eventId} />;
}
