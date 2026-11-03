import { redirect, notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { roleRedirect } from "@/lib/role-gate";
import { EventTabs } from "./event-tabs";

/**
 * Event children layout — the single ownership gate for every event page.
 *
 * Five of the seven event children used to read `events` (and attendee
 * rosters) by raw `event_id` with only the organizer layout's role gate above
 * them, so one organizer could open another organizer's attendee names,
 * emails and QR roster. The sibling certificates page proved the convention:
 * resolve the caller, resolve the event, compare `organizer_id`. That check is
 * now applied once here and every child inherits it, so the pages no longer
 * repeat it (and the ones that never had it stop leaking).
 *
 * Authorization precedes every `createServiceClient()` use: the session check
 * is above the client, and the ownership comparison is above the children's
 * queries by construction.
 */
export default async function EventChildrenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;

  const session = await auth0.getSession();
  if (!session?.user) redirect("/sign-in");

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", session.user.sub)
    .maybeSingle();

  // Shared predicate, fail-closed — not an inline role comparison.
  const blocked = roleRedirect(profile?.role, ["organizer"]);
  if (blocked) {
    redirect(blocked);
  }

  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", event_id)
    .maybeSingle();
  if (!event) notFound();
  if (event.organizer_id !== profile?.id) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <EventTabs eventId={event_id} />
      {children}
    </div>
  );
}
