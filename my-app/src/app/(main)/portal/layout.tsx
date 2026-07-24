import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

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
    href: "/portal/sponsors",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: "/portal/recruiters",
    label: "Discover Hackers",
    icon: <Search className="w-4 h-4" />,
  },
  {
    href: "/portal/bounties",
    label: "Bounties",
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    href: "/portal/sponsors/company",
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
  const userId = session?.user?.sub ?? "none";

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, slug_id")
    .eq("auth0_user_id", userId)
    .single();

  if (profile?.role && profile.role !== "sponsor" && profile.role !== "maintainer") {
    redirect(`/dashboard/${profile.role}`);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar
        role="sponsor"
        slugId={slugId}
        links={sponsorLinks}
      />
      <main className="flex-1 p-8 max-w-7xl mx-auto min-h-dvh flex flex-col">{children}</main>
    </div>
  );
}
