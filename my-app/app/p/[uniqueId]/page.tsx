import { notFound } from "next/navigation";
import { getHackerProfile } from "@/lib/hacker-id";
import { buildPageMetadata } from "@/lib/seo";
import { Metadata } from "next";
import ProfileClient from "@/components/hacker-id/profile-client";

type Props = {
  params: Promise<{ uniqueId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uniqueId } = await params;
  const profile = await getHackerProfile(uniqueId);

  if (!profile) {
    return buildPageMetadata({
      title: "Profile Not Found",
      description: "The requested Hacker ID does not exist.",
      path: `/p/${uniqueId}`,
    });
  }

  return buildPageMetadata({
    title: `${profile.name} | Hacker ID ${profile.uniqueId}`,
    description: `Official verification profile for ${profile.name} (${profile.uniqueId}) - Butwal Hacks.`,
    path: `/p/${uniqueId}`,
  });
}

export async function generateStaticParams() {
  // In a real app, we would fetch all unique IDs from the database
  // For now, we use the mock data from lib/hacker-id.ts
  return [
    { uniqueId: "BH-2024-001" },
    { uniqueId: "BH-2024-089" },
  ];
}

export default async function ProfilePage({ params }: Props) {
  const { uniqueId } = await params;
  const profile = await getHackerProfile(uniqueId);

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg-primary pt-24 pb-12 px-6 md:px-20">
      <ProfileClient profile={profile} />
    </main>
  );
}
