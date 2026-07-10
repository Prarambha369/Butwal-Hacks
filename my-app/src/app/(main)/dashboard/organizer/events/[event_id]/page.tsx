import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

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
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-secondary">Organizer Command Center</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/dashboard/organizer/events/${event_id}/attendees`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 border"
          >
            <Users className="mr-2 h-4 w-4" />
            Attendees
          </Link>
          <Link 
            href={`/dashboard/organizer/events/${event_id}/analytics`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 border"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Analytics
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Event Overview</CardTitle>
            <CardDescription>General information and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-secondary" />
                <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>{event.location || "Virtual / TBD"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-secondary" />
                <span>{registrationCount || 0} Registered Participants</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {event.is_published ? (
                  <><Unlock className="h-4 w-4 text-status-green" /> <span>Status: Published</span></>
                ) : (
                  <><Lock className="h-4 w-4 text-bh-red-500" /> <span>Status: Closed/Draft</span></>
                )}
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-secondary leading-relaxed">
                {event.description || "No description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Closure Actions
            </CardTitle>
            <CardDescription>
              Closing an event will stop registrations and automatically issue certificates to attended participants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CloseEventButton eventId={event_id} isPublished={event.is_published} />
          </CardContent>
          <CardFooter className="text-xs text-center text-secondary">
            This action is irreversible.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

async function CloseEventButton({ eventId, isPublished }: { eventId: string, isPublished: boolean }) {
  if (!isPublished) {
    return (
      <Button disabled className="w-full" variant="outline">
        Event Already Closed
      </Button>
    );
  }

  return <CloseEventClientButton eventId={eventId} />;
}
