import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, LogIn } from "lucide-react";

import { auth0 } from "@/lib/auth0";
import {
  cloudinaryDownloadUrl,
  displayPhotoUrl,
  isVideoUrl,
  socialCardUrl,
  videoPlaybackUrl,
  videoPosterUrl,
} from "@/lib/cloudinary-url";
import { SITE_URL } from "@/lib/constants";
import { getGalleryPhoto } from "@/lib/gallery-photo";
import { buildPageMetadata } from "@/lib/seo";
import ShareButtons from "./share-buttons";

/**
 * Canonical per-photo page.
 *
 * The grid lightbox used to be the only way to see a photo, so a shared link
 * was always the gallery index — every share previewed the same page and no
 * photo was addressable. This route gives each approved photo its own URL,
 * its own Open Graph card, and a stable target for copy/share.
 *
 * Deliberately `noindex, follow`: the photos are public, but an unbounded set
 * of near-duplicate pages would compete with the curated /gallery and event
 * pages in search. They are not in the sitemap for the same reason.
 */

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;

/** Long date, or null when the stored value is missing/unparseable. */
function formatLongDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const photo = await getGalleryPhoto(id);

  // 404 before any metadata is emitted. Returning a normal metadata object for
  // an unapproved or deleted photo would leave a shareable Open Graph card
  // pointing at media the gallery has already pulled.
  if (!photo) notFound();

  const kind = isVideoUrl(photo.url) ? "Video" : "Photo";
  const date = formatLongDate(photo.date);
  const card = socialCardUrl(photo.url);

  const description = [
    `${kind} from the ${photo.event} event gallery`,
    date ? `, ${date}` : "",
    photo.uploader ? `, by ${photo.uploader}` : "",
    ".",
  ].join("");

  return buildPageMetadata({
    title: `${photo.event} — ${kind} · Butwal Hacks`,
    description,
    path: `/gallery/${id}`,
    robots: { index: false, follow: true },
    ...(card
      ? {
          image: {
            url: card.url,
            alt: `${photo.event} — ${kind}`,
            width: card.width,
            height: card.height,
          },
        }
      : {}),
  });
}

export default async function GalleryPhotoPage({ params }: Props) {
  const { id } = await params;
  // Deduped with the generateMetadata call by cache() in gallery-photo.
  const photo = await getGalleryPhoto(id);
  if (!photo) notFound();

  const isVideo = isVideoUrl(photo.url);
  const kind = isVideo ? "Video" : "Photo";
  const date = formatLongDate(photo.date);
  const shareUrl = `${SITE_URL}/gallery/${photo.id}`;
  const shareTitle = `${photo.event} — ${kind} · Butwal Hacks`;

  // Download gate: same rule as the grid. Signed-in viewers get the original
  // bytes via fl_attachment; everyone else gets a sign-in link.
  const session = await auth0.getSession().catch(() => null);

  return (
    <main className="min-h-dvh bg-background pt-28 pb-20 px-6 md:px-20">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/gallery"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to gallery
        </Link>

        <article className="space-y-6">
          <header className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-red">
              {kind}
            </p>
            <h1 className="text-3xl font-bold leading-tight text-primary md:text-4xl">
              {photo.event}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {date && <span className="font-mono">{date}</span>}
              {date && photo.uploader && <span aria-hidden="true">·</span>}
              {photo.uploader && <span>by {photo.uploader}</span>}
              {isVideo && photo.duration && (
                <span className="font-semibold text-primary-red">
                  {Math.round(photo.duration)}s
                </span>
              )}
            </div>
          </header>

          <div className="bh-card overflow-hidden">
            {isVideo ? (
              <video
                src={videoPlaybackUrl(photo.url, 1600)}
                controls
                playsInline
                preload="metadata"
                poster={videoPosterUrl(photo.url, 1600) ?? undefined}
                className="w-full bg-surface-inverse"
              />
            ) : (
              <Image
                src={displayPhotoUrl(photo.url, photo.optimize, 1600)}
                alt={photo.event}
                width={1600}
                height={1000}
                sizes="(max-width: 768px) 100vw, 900px"
                className="h-auto w-full object-contain"
                priority
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isVideo &&
              (session?.user ? (
                <a
                  href={cloudinaryDownloadUrl(photo.url)}
                  download
                  className="bh-btn-secondary"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download
                </a>
              ) : (
                <Link href="/sign-in" className="bh-btn-secondary">
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Sign in to download
                </Link>
              ))}

            {photo.event_slug && (
              <Link
                href={`/events/${photo.event_slug}`}
                className="bh-btn-secondary"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                View event
              </Link>
            )}

            <ShareButtons url={shareUrl} title={shareTitle} />
          </div>
        </article>
      </div>
    </main>
  );
}
