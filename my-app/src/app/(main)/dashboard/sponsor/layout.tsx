import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const DashboardSidebar = NextDynamic(() => import("@/components/dashboard-sidebar"));
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Building2,
} from "lucide-react";

const sponsorLinks = [
  {
    href: "/dashboard/sponsor",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: "/dashboard/sponsor/hackers",
    label: "Discover Hackers",
    icon: <Search className="w-4 h-4" />,
  },
  {
    href: "/dashboard/sponsor/opportunities",
    label: "Opportunities",
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    href: "/dashboard/sponsor/company",
    label: "Company Profile",
    icon: <Building2 className="w-4 h-4" />,
  },
];

export default async function SponsorDashboardLayout({
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

  if (profile?.role && profile.role !== "sponsor") {
    redirect(`/dashboard/${profile.role}`);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role="sponsor"
        slugId={slugId}
        links={sponsorLinks}
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
