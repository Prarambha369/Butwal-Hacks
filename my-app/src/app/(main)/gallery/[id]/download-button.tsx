"use client";

import Link from "next/link";
import { Download, LogIn } from "lucide-react";
import { useAuthUser } from "@/components/auth-user-provider";
import { cloudinaryDownloadUrl } from "@/lib/cloudinary-url";

/**
 * Download control for the photo page — the same rule as the grid's
 * DownloadControl: signed-in viewers get a Download link, everyone else a
 * sign-in link. The session is read on the client (from the shared
 * /auth/profile probe) so the page stays ISR-cached instead of rendering per
 * request just to read the session cookie.
 *
 * `url` is the public Cloudinary delivery URL the page already displays; the
 * fl_attachment variant only adds a download disposition. Like the grid, this
 * is a convenience gate, not access control: the originals are public.
 */
export default function DownloadButton({ url }: { url: string }) {
  const { user } = useAuthUser();
  if (user) {
    return (
      <a href={cloudinaryDownloadUrl(url)} download className="bh-btn-secondary">
        <Download className="h-4 w-4" aria-hidden="true" />
        Download
      </a>
    );
  }
  return (
    <Link href="/sign-in" className="bh-btn-secondary">
      <LogIn className="h-4 w-4" aria-hidden="true" />
      Sign in to download
    </Link>
  );
}
