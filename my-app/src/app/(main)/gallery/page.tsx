import { Calendar } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import GalleryGrid from "./gallery-grid";

export const metadata: Metadata = buildPageMetadata({
  title: "Event Gallery",
  description: "Browse photos from Butwal Hacks hackathons, workshops, and community meetups across Lumbini Province, Nepal.",
  path: "/gallery",
});

// This page fetches photos from Supabase at request time — must be server-rendered.
export const dynamic = "force-dynamic";

export type GalleryPhoto = {
  id: string;
  url: string;
  event: string;
  event_slug: string | null;
  date: string;
  span: number;
  uploader: string | null;
  /** Duration in seconds — only set for video entries */
  duration?: number;
};

async function getPhotos(): Promise<GalleryPhoto[]> {
  const supabase = createClient();

  const { data: photos } = await supabase
    .from("photos")
    .select(`
      id, url, span, created_at,
      events ( id, title, slug ),
      profiles!photos_uploader_id_fkey ( full_name )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!photos) return [];

  return photos.map((p) => {
    const ev = Array.isArray(p.events) ? p.events[0] : p.events;
    const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return {
      id: p.id,
      url: p.url,
      event: (ev as { title?: string })?.title ?? "Unknown Event",
      event_slug: (ev as { slug?: string })?.slug ?? null,
      date: p.created_at,
      span: (p as { span?: number }).span ?? 1,
      uploader: (prof as { full_name?: string })?.full_name ?? null,
    };
  });
}

export default async function GalleryPage() {
  const photos = await getPhotos();

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

        {/* Empty state */}
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
          <GalleryGrid photos={photos} />
        )}
      </div>
    </main>
  );
}
