import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import TeamMatching from "@/components/dashboard/team-matching";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "AI Team Matching",
    description: "Find your ideal hackathon teammates based on skills, interests, and experience levels.",
    path: "/dashboard/hacker/team-matching",
  });
}

export default async function TeamMatchingPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">AI Team Matching</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover hackers with complementary skills and shared interests for your next project.
        </p>
      </div>
      <TeamMatching />
    </div>
  );
}
