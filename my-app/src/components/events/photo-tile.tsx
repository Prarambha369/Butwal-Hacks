"use client";

import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A gallery preview image in a fixed 4:3 tile (the parent owns the box),
 * with the gallery's skeleton until it loads. `src` is already a sized
 * Cloudinary URL, so next/image is told not to re-optimize it.
 */
export function PhotoTile({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none motion-reduce:animate-none" />}
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 50vw, 25vw"
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-[opacity,transform] duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}
