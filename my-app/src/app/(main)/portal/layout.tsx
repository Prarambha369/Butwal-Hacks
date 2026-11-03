import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import type { Metadata } from "next";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { sponsorNav } from "@/lib/dashboard-nav";

export const dynamic = "force-dynamic";

/**
 * Noindex once for the whole /portal segment. These pages are
 * authenticated-only and offer a crawler nothing; previously they declared no
 * robots meta at all, so Next's default (`index: true`) applied.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};


const DashboardSidebar = NextDynamic(() => import("@/components/dashboard-sidebar"));
import { portalRedirect } from "@/lib/dashboard-access";

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

// Same rule as the maintainer dashboard: the maintainer role is only
  // authority on a verified staff address. Without this, role='maintainer' on
  // an unverified address would be refused at /dashboard/maintainer and then
  // admitted here.
  const blocked = portalRedirect({
    role: profile?.role,
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
  });
  if (blocked) {
    redirect(blocked);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar
        role="sponsor"
        slugId={slugId}
        links={sponsorNav}
      />
      <main className="flex-1 p-8 max-w-7xl mx-auto min-h-dvh flex flex-col">{children}</main>
    </div>
  );
}
