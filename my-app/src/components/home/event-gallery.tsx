import { getCoverPhotos } from "@/lib/actions/photos";
import EventGalleryClient from "./event-gallery-client";

/**
 * Homepage gallery — maintainer-picked cover photos only.
 * Honest empty: renders nothing until a maintainer sets a cover.
 * No stock imagery, ever.
 */
export default async function EventGallery() {
  const covers = await getCoverPhotos(6);
  if (covers.length === 0) return null;

  return (
    <EventGalleryClient
      photos={covers.map((c) => ({
        url: c.url,
        event: c.event_title ?? "Butwal Hacks",
        slug: c.event_slug,
      }))}
    />
  );
}
