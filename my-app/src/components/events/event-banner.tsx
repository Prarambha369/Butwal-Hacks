"use client";

import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { bannerLoader, isCloudinaryImage } from "@/lib/event-banner";
import { EVENT_TIME_ZONE } from "@/lib/event-status";
import { cn } from "@/lib/utils";

interface EventBannerProps {
  url: string | null;
  title: string;
  startDate: string;
  /** Rendered `sizes` for the srcset; the box is always 16:9. */
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Hover zoom inside a card. Off under prefers-reduced-motion. */
  zoomOnHover?: boolean;
}

const monthFmt = new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIME_ZONE, month: "short" });
const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIME_ZONE, day: "numeric" });

/**
 * An event banner in a fixed 16:9 box.
 *
 * The box owns the aspect ratio, so nothing below it moves while the image
 * loads (a skeleton fills it, as in the gallery's 4:3 tiles). Cloudinary
 * banners get a srcset of `w_<n>,q_auto,f_auto` URLs straight from Cloudinary.
 *
 * Without a banner the box still carries information instead of a blank
 * tint: the event's date, set large, on the design system's grid wash.
 */
export function EventBanner({
  url,
  title,
  startDate,
  sizes,
  priority = false,
  className,
  zoomOnHover = false,
}: EventBannerProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const start = new Date(startDate);
  const valid = !Number.isNaN(start.getTime());

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-muted", className)}>
      {url && !failed ? (
        <>
          {!loaded && (
            <Skeleton className="absolute inset-0 rounded-none motion-reduce:animate-none" />
          )}
          <Image
            src={url}
            alt={`${title} banner`}
            fill
            sizes={sizes}
            priority={priority}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "object-cover transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
              loaded ? "opacity-100" : "opacity-0",
              zoomOnHover && "group-hover:scale-[1.03] motion-reduce:group-hover:scale-100",
            )}
            {...(isCloudinaryImage(url) ? { loader: bannerLoader } : {})}
          />
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bh-bg-grid">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-red/[0.06] via-transparent to-transparent" />
          {valid && (
            <div className="absolute bottom-4 left-4 flex flex-col leading-none sm:bottom-5 sm:left-5">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-primary-red">
                {monthFmt.format(start)}
              </span>
              <span className="mt-1 text-5xl font-extrabold tracking-[-0.03em] text-text-primary tabular-nums sm:text-6xl">
                {dayFmt.format(start)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
