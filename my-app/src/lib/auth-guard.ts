import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/utils/supabase/service";

export async function requireAuth() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return session.user.sub;
}

export async function requireRole(role: "hacker" | "sponsor" | "organizer" | "maintainer") {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  const roles = {
    hacker: 1,
    sponsor: 2,
    organizer: 3,
    maintainer: 4,
  };

  const userRole = (profile?.role as keyof typeof roles) || "hacker";

  if (roles[userRole] < roles[role]) {
    redirect("/dashboard");
  }

  return session.user.sub;
}
