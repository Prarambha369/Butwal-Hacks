import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

export const dynamic = "force-dynamic";

// ponytail: Command palette uses native dialog with no extra deps (no cmdk/kbar).
const DashboardNavProvider = NextDynamic(() =>
  import("@/components/dashboard-nav-provider").then((m) => m.DashboardNavProvider),
);

const DashboardShell = NextDynamic(() =>
  import("@/components/dashboard/shell/dashboard-shell").then((m) => ({ default: m.DashboardShell })),
);
import {
  LayoutTemplate,
  LayoutDashboard,
  CalendarDays,
  MapPin,
  KeyRound,
  KanbanSquare,
} from "lucide-react";
import { organizerRedirect } from "@/lib/dashboard-access";

const organizerLinks = [
  {
    href: "/dashboard/organizer",
    label: "Overview",
    shortcut: "o",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/events",
    label: "Events",
    shortcut: "e",
    icon: <CalendarDays className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/work",
    label: "Team Work",
    shortcut: "w",
    icon: <KanbanSquare className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/issue-marker",
    label: "Issue Marker",
    shortcut: "i",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    // Was reachable only by typing the URL. It is a shipped feature -- the
    // editor, roster import, bulk issue and domain send all live here -- so
    // hiding it in the nav made it look unfinished to organizers.
    href: "/dashboard/organizer/certificates/templates",
    label: "Certificate Templates",
    shortcut: "t",
    icon: <LayoutTemplate className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/api-keys",
    label: "API Keys",
    shortcut: "k",
    icon: <KeyRound className="w-4 h-4" />,
  },
];

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
    <DashboardNavProvider links={organizerLinks}>
      <DashboardShell role="organizer" slugId={slugId} links={organizerLinks}>
        {children}
      </DashboardShell>
    </DashboardNavProvider>
  );
} // ponytail: Auth0 session drives layout protection (replaced Supabase Auth).