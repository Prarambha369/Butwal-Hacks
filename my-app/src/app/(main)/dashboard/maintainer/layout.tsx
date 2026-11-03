import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { maintainerNav } from "@/lib/dashboard-nav";

export const dynamic = "force-dynamic";

// ponytail: Command palette uses native dialog with no extra deps (no cmdk/kbar).
const DashboardNavProvider = NextDynamic(() =>
  import("@/components/dashboard-nav-provider").then((m) => m.DashboardNavProvider),
);

const MaintainerSidebar = NextDynamic(() =>
  import("@/components/maintainer-sidebar"),
);
const DashboardShell = NextDynamic(() =>
  import("@/components/dashboard/shell/dashboard-shell").then((m) => ({
    default: m.DashboardShell,
  })),
);
import { maintainerRedirect } from "@/lib/dashboard-access";

export default async function MaintainerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub ?? "none";

  const db = createServiceClient();
  const { data: profile } = await db
    .from("profiles")
    .select("role, slug_id")
    .eq("auth0_user_id", userId)
    .single();

  // Maintainer is not just the role. It also requires an authenticated
  // @butwalhacks.com address, which Auth0 reports as verified. The role column
  // alone was authority, and nothing in the schema stops a profile from
  // carrying role='maintainer' with any address -- so a compromised or
  // mis-assigned role reached every admin page in this section. The session
  // supplies both the address and the verification flag; `profiles` does not
  // store either.
  const blocked = maintainerRedirect({
    role: profile?.role,
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
  });
  if (blocked) {
    redirect(blocked);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <DashboardNavProvider links={maintainerNav}>
      <DashboardShell
        role="maintainer"
        slugId={slugId}
        links={maintainerNav}
        sidebar={({ open, onNavigate }) => (
          <MaintainerSidebar
            slugId={slugId}
            links={maintainerNav}
            mobileOpen={open}
            onNavigate={onNavigate}
          />
        )}
      >
        {children}
      </DashboardShell>
    </DashboardNavProvider>
  );
} // ponytail: Auth0 session for authentication and role verification.
