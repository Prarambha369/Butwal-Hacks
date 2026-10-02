import type { Metadata } from "next";

/**
 * Legacy redirect stub -- `page.tsx` always redirects to
 * `/projects/{id}#impact`, so it never renders content of its own.
 *
 * The page could not declare this itself: it is an async server component
 * that calls `redirect()`, and a redirect-only route should not be indexed at
 * all. Left to the root layout it inherited the homepage's title and
 * description, so a crawler saw a real-looking but contentless page at a URL
 * that 308s somewhere else.
 */
export const metadata: Metadata = {
  title: "Project impact report — moved | Butwal Hacks",
  robots: { index: false, follow: false },
};

export default function ImpactRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
