import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AnnualReportClient from "./annual-report-client";

export const dynamic = "force-dynamic";

export default async function AnnualReportPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/sign-in");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (profile?.role !== "maintainer") redirect("/dashboard");

  return <AnnualReportClient />;
}
