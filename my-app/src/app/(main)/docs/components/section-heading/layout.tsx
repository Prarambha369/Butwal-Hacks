import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Metadata for a page that is a client component.
 *
 * `page.tsx` here is `"use client"`, and Next.js forbids exporting `metadata`
 * from a client module -- which is why the page carries a comment saying so
 * rather than a title. A layout is the supported place to declare it, and its
 * metadata merges down. Inventing a title on the page itself would not
 * compile, and dropping the metadata entirely is what left this page
 * inheriting the homepage's title and description verbatim.
 */
export const metadata: Metadata = {
  title: "Section Heading — Component reference | Butwal Hacks",
  description:
    "Reference for the SectionHeading component: heading level, optional description, and icon variants used across Butwal Hacks pages.",
  alternates: { canonical: "/docs/components/section-heading" },
  robots: { index: true, follow: true },
};

export default function SectionHeadingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return children;
}
