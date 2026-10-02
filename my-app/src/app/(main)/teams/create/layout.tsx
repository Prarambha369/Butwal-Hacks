import type { Metadata } from "next";

/**
 * Team creation is an authenticated action behind a form, not a page anyone
 * arrives at from search. `page.tsx` is a client component so it cannot
 * export metadata itself; declared here instead.
 *
 * Previously inherited the homepage title and description, which was the worse
 * of the two options: a search result promising the organization's homepage
 * for a route that renders an empty form.
 */
export const metadata: Metadata = {
  title: "Create a team | Butwal Hacks",
  description: "Create a team and invite collaborators on Butwal Hacks.",
  robots: { index: false, follow: false },
};

export default function CreateTeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
