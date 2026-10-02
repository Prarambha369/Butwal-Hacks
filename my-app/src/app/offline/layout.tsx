import type { Metadata } from "next";

/**
 * The PWA offline fallback. It is only ever served to a browser that has
 * already lost connectivity, so there is nothing here for a crawler and no
 * reason to let it into an index -- it would otherwise be the one page a
 * crawler is guaranteed to fail to fetch meaningfully.
 *
 * `page.tsx` is a client component and cannot export metadata.
 */
export const metadata: Metadata = {
  title: "You're offline | Butwal Hacks",
  description:
    "This page needs a connection. Your saved work is unaffected — reconnect and try again.",
  robots: { index: false, follow: false },
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
