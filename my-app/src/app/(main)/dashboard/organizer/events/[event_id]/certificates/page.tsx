import { auth0 } from "@/lib/auth0";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/utils/supabase";
import CertificateRosterPanel from "@/components/certificates/roster-panel";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Certificates",
    description: "Import a roster, issue certificates, and send them by domain",
    path: "/dashboard/organizer/events/certificates",
    keywords: [],
  }),
  robots: { index: false, follow: false },
};

/** Mirrors requireIssuer(): a chapter lead must not reach this page either. */
const ISSUER_ROLES = new Set(["organizer", "maintainer"]);

export default async function EventCertificatesPage({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id: eventId } = await params;

  const session = await auth0.getSession();
  if (!session?.user) redirect("/sign-in");

  const supabase = createServiceClient();
  const { data: caller } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", session.user.sub)
    .maybeSingle();

  if (!caller || !ISSUER_ROLES.has(caller.role)) redirect("/dashboard");

  const { data: event } = await supabase
    .from("events")
    .select("id, title, organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();
  if (caller.role === "organizer" && event.organizer_id !== caller.id) redirect("/dashboard");

  const { count } = await supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Certificates</h1>
        <p className="text-muted-foreground">
          For {event.title}. {count ?? 0} issued so far.
        </p>
      </div>

      <CertificateRosterPanel eventId={eventId} />

      <div className="bh-card p-6">
        <h2 className="mb-1 text-base font-semibold">Template</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Certificates render with this event&apos;s template, falling back to the organisation default.
        </p>
        <Link
          href={`/dashboard/maintainer/certificates/templates?event=${eventId}`}
          className="inline-block rounded bg-stone-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Edit the template
        </Link>
      </div>
    </div>
  );
}
