import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const DashboardSidebar = NextDynamic(() => import("@/components/dashboard-sidebar"));
import {
  LayoutDashboard,
  User,
  Code2,
  Users,
  UserPlus,
  Calendar,
} from "lucide-react";

const hackerLinks = [
  {
    href: "/dashboard/hacker",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/profile",
    label: "My Profile",
    icon: <User className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/events",
    label: "Events",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/projects",
    label: "Projects",
    icon: <Code2 className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/teams",
    label: "Teams",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/teammates",
    label: "Find Teammates",
    icon: <UserPlus className="w-4 h-4" />,
  },
];

export default async function HackerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, slug_id")
    .eq("auth0_user_id", userId)
    .single();

  if (profile?.role && profile.role !== "hacker") {
    redirect(`/dashboard/${profile.role}`);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="hacker" slugId={slugId} links={hackerLinks} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
} // ponytail: Switched to Clerk user validation and aligned `profiles` role check.