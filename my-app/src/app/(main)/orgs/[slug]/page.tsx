import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo"


export async function generateMetadata() {
  return buildPageMetadata({title: "Organization", description: "Organizations and chapters in the Butwal Hacks network across Nepal.", path: "/orgs", keywords: []});
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OrgRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/orgs/${slug}/dashboard`);
}
