import { Calendar } from "lucide-react";
import { auth0 } from "@/lib/auth0";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { fetchGalleryPage, fetchGalleryTotals, fetchGalleryEvents } from "@/lib/actions/gallery";
import GalleryGrid from "./gallery-grid";

export const metadata: Metadata = buildPageMetadata({
  title: "Event Gallery",
  description: "Photos from Butwal Hacks hackathons and meetups across Lumbini. Real people, real builds.",
  path: "/gallery",
});

// This page fetches photos from Supabase at request time — must be server-rendered.
export const dynamic = "force-dynamic";

export type { GalleryPhoto } from "@/lib/actions/gallery";

export default async function GalleryPage() {
  // Totals, first page, and the event list are independent reads; run them together.
  const [page, totals, events] = await Promise.all([
    fetchGalleryPage(0),
    fetchGalleryTotals(),
    fetchGalleryEvents(),
  ]);
  const photos = page.photos;

  // Download gate: only signed-in users get full-quality file URLs.
  const session = await auth0.getSession().catch(() => null);

  return (
    <main className="min-h-dvh bg-background pt-28 pb-20 px-6 md:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 text-center space-y-4">
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

        {photos.length === 0 ? (
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
            canDownload={!!session?.user}
            totals={totals}
            hasMore={page.hasMore}
            events={events.map((e) => e.title)}
          />
        )}
      </div>
    </main>
  );
}
