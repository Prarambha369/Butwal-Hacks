import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { organizerNav } from "@/lib/dashboard-nav";

export const dynamic = "force-dynamic";

// ponytail: Command palette uses native dialog with no extra deps (no cmdk/kbar).
const DashboardNavProvider = NextDynamic(() =>
  import("@/components/dashboard-nav-provider").then((m) => m.DashboardNavProvider),
);

const DashboardShell = NextDynamic(() =>
  import("@/components/dashboard/shell/dashboard-shell").then((m) => ({ default: m.DashboardShell })),
);
import { organizerRedirect } from "@/lib/dashboard-access";

export default async function OrganizerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub ?? "none";

  const db = createServiceClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, role, slug_id")
    .eq("auth0_user_id", userId)
    .single();

  const subject = {
    role: profile?.role,
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
  };

  // Identity comes from the Auth0 session, not from profiles: we do not store
  // the address or its verification state. Fetches the timeline only when the
  // role could actually be an organizer.
  const isOrganizerRole = subject.role === "organizer";
  const eventsQuery = isOrganizerRole
    ? await db.from("events").select("created_at, end_date").eq("organizer_id", profile?.id ?? "none")
    : null;
  if (eventsQuery?.error) redirect("/dashboard/hacker");
  const timelineEvents = eventsQuery?.data ?? [];

  const blocked = organizerRedirect(subject, timelineEvents);
  if (blocked) {
    redirect(blocked);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <DashboardNavProvider links={organizerNav}>
      <DashboardShell role="organizer" slugId={slugId} links={organizerNav}>
        {children}
      </DashboardShell>
    </DashboardNavProvider>
  );
} // ponytail: Auth0 session drives layout protection (replaced Supabase Auth).