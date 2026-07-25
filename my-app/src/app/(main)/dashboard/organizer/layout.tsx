import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

export const dynamic = "force-dynamic";

// ponytail: Command palette uses native dialog with no extra deps (no cmdk/kbar).
const DashboardNavProvider = NextDynamic(() =>
  import("@/components/dashboard-nav-provider").then((m) => m.DashboardNavProvider),
);

const DashboardSidebar = NextDynamic(() => import("@/components/dashboard-sidebar"));
import {
  LayoutDashboard,
  CalendarDays,
  MapPin,
  KeyRound,
  KanbanSquare,
} from "lucide-react";

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
    .select("role, slug_id")
    .eq("auth0_user_id", userId)
    .single();

  if (profile?.role && profile.role !== "organizer" && profile.role !== "maintainer") {
    redirect(`/dashboard/${profile.role}`);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar
        role="organizer"
        slugId={slugId}
        links={organizerLinks}
      />
      <main className="flex-1 p-8 max-w-7xl mx-auto min-h-dvh flex flex-col">
        <DashboardNavProvider links={organizerLinks}>
          {children}
        </DashboardNavProvider>
      </main>
    </div>
  );
} // ponytail: Auth0 session drives layout protection (replaced Supabase Auth).