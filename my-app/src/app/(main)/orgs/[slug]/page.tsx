import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OrgRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/orgs/${slug}/dashboard`);
}
