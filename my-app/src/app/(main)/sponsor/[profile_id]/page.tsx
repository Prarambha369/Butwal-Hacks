import { notFound } from "next/navigation";
import { createServiceClient } from "@/utils/supabase";
import { buildPageMetadata } from "@/lib/seo";
import { Metadata } from "next";
import SponsorProfileClient from "./sponsor-profile-client";

// ISR: cache sponsor profile for 60s, revalidate on next request if stale.
export const revalidate = 60;

type Props = {
  params: Promise<{ profile_id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { profile_id } = await params;
  const supabase = createServiceClient();

  const { data: sponsor } = await supabase
    .from("sponsor_profiles")
    .select("company_name, company_website")
    .eq("id", profile_id)
    .single();

  if (!sponsor) {
    return buildPageMetadata({
      title: "Sponsor Not Found",
      description: "No sponsor profile like that here.",
      path: `/sponsor/${profile_id}`,
    });
  }

  return buildPageMetadata({
    title: `${sponsor.company_name} | Butwal Hacks Sponsor`,
    description: sponsor.company_website
      ? `Sponsoring organization: ${sponsor.company_name}.`
      : `Sponsoring organization: ${sponsor.company_name}, backing free hackathons in Nepal.`,
    path: `/sponsor/${profile_id}`,
  });
}

export default async function SponsorProfilePage({ params }: Props) {
  const { profile_id } = await params;
  const supabase = createServiceClient();

  // Explicit allowlist — never `select("*")` on a service-role call.
  // Public sponsor profile renders only the fields below.
  const { data: sponsor, error } = await supabase
    .from("sponsor_profiles")
    .select(
      `id, profile_id, company_name, company_website, company_logo_url, description, locations, industries, created_at`,
    )
    .eq("id", profile_id)
    .single();

  if (error || !sponsor) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-background pt-24 pb-12 px-6 md:px-20">
      <div className="max-w-4xl mx-auto">
        <SponsorProfileClient sponsor={sponsor} />
      </div>
    </main>
  );
}
