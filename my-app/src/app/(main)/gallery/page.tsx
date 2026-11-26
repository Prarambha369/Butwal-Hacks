import { Calendar } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { fetchGalleryPage, fetchGalleryTotals, fetchGalleryEvents } from "@/lib/actions/gallery";
import GalleryGrid from "./gallery-grid";

export const metadata: Metadata = buildPageMetadata({
  title: "Event Gallery",
  description: "Photos from Butwal Hacks hackathons and meetups across Lumbini. Real people, real builds.",
  path: "/gallery",
});

// ISR: the page is the same for every visitor, so it is rendered once and
// served from the CDN. Approving, deleting or re-optimising a photo calls
// revalidatePath("/gallery") (lib/actions/photos.ts, photo-optimize.ts); the
// timer is only a backstop. The ?event= filter and the download gate are read
// on the client by GalleryGrid — reading searchParams or the session here
// would force a full server render (and three Supabase reads) per request.
export const revalidate = 300;

export type { GalleryPhoto } from "@/lib/actions/gallery";

export default async function GalleryPage() {
  // Totals, first page, and the event list are independent reads; run them
  // together. A failed page read throws (so the client grid can retry it); on
  // the server render, degrade to an empty first page rather than taking down
  // the route.
  const emptyPage = { photos: [], hasMore: false };
  const [page, totals, events] = await Promise.all([
    fetchGalleryPage(0).catch(() => emptyPage),
    fetchGalleryTotals(),
    fetchGalleryEvents(),
  ]);
  const photos = page.photos;
  const galleryEmpty =
    photos.length === 0 && totals.photos + totals.videos === 0;

  return (
    <main className="min-h-dvh bg-background pt-28 pb-20 px-6 md:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-red">
            Memories
          </p>
          <h1 className="text-4xl font-bold leading-tight text-primary md:text-5xl">
            Event Gallery
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Photos from hackathons, workshops, game jams, and community meetups
            across Butwal and Lumbini Province.
          </p>
        </div>

        {galleryEmpty ? (
          <div className="bh-card p-20 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-primary">No photos yet</p>
              <p className="text-muted-foreground max-w-md mx-auto">
                Photos from events will appear here once they are uploaded.
              </p>
            </div>
          </div>
        ) : (
          <GalleryGrid
            photos={photos}
            totals={totals}
            hasMore={page.hasMore}
            events={events.map((e) => e.title)}
          />
        )}
      </div>
    </main>
  );
}
