import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { maintainerNav } from "@/lib/dashboard-nav";
// Imported directly, not through next/dynamic. This layout is a server
// component and the element below is a prop, so React renders the component
// into the slot before serialization. The dynamic wrapper renders a Fragment
// whose children are [PreloadChunks, Lazy] -- an array -- so the client
// received an array where DashboardShell expects one element, and
// cloneElement threw. A direct import is a client reference, which
// serializes as a single element.
import MaintainerSidebar from "@/components/maintainer-sidebar";

export const dynamic = "force-dynamic";

// ponytail: Command palette uses native dialog with no extra deps (no cmdk/kbar).
const DashboardNavProvider = NextDynamic(() =>
  import("@/components/dashboard-nav-provider").then((m) => m.DashboardNavProvider),
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
        // An element, not a function: this layout is a server component and
        // DashboardShell is a client component, so a function prop cannot
        // cross the boundary. DashboardShell clones the element with the
        // drawer state before rendering it.
        sidebar={<MaintainerSidebar slugId={slugId} links={maintainerNav} />}
      >
        {children}
      </DashboardShell>
    </DashboardNavProvider>
  );
} // ponytail: Auth0 session for authentication and role verification.
