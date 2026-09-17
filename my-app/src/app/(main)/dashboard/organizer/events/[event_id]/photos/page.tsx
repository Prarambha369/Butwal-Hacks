import { notFound } from "next/navigation";
import { createServiceClient } from "@/utils/supabase";
import { getEventPhotos } from "@/lib/actions/photos";
import { EventPhotosClient } from "./photos-client";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return { ...buildPageMetadata({ title: "Event Photos", description: "Manage event photos", path: "/dashboard/organizer/events", keywords: [] }), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function EventPhotosPage({
  params,
}: {
  params: Promise<{ event_id: string }>;
}) {
  const { event_id } = await params;
  const supabase = createServiceClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug")
    .eq("id", event_id)
    .single();
  if (!event) notFound();

  // getEventPhotos enforces organizer-or-maintainer access server-side.
  let photos: Awaited<ReturnType<typeof getEventPhotos>> = [];
  try {
    photos = await getEventPhotos(event_id);
  } catch {
    // Access denied surfaces as notFound (no existence leak to strangers).
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {(event as { title: string }).title} — Photos
        </h1>
        <p className="text-sm text-muted-foreground">
          Member uploads, approvals, and the public gallery for this event.
        </p>
      </div>
      <EventPhotosClient
        eventId={event_id}
        eventSlug={(event as { slug?: string }).slug}
        initialPhotos={photos}
      />
    </div>
  );
}
