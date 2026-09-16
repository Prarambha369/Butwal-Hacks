import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo"


export async function generateMetadata() {
  return buildPageMetadata({title: "Organization", description: "View organization details", path: "/orgs", keywords: []});
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OrgRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/orgs/${slug}/dashboard`);
}
