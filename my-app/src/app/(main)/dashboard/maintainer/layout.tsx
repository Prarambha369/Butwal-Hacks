import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

export const dynamic = "force-dynamic";

// ponytail: Command palette uses native dialog with no extra deps (no cmdk/kbar).
const DashboardNavProvider = NextDynamic(() =>
  import("@/components/dashboard-nav-provider").then((m) => m.DashboardNavProvider),
);

const MaintainerSidebar = NextDynamic(() => import("@/components/maintainer-sidebar"));
import {
  Terminal,
  Users,
  ScrollText,
  ShieldCheck,
  Settings2,
  BookOpen,
  GraduationCap,
} from "lucide-react";

const maintainerLinks = [
  {
    href: "/dashboard/maintainer",
    label: "Command Center",
    shortcut: "c",
    icon: <Terminal className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/users",
    label: "Users",
    shortcut: "u",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/audit-log",
    label: "Audit Log",
    shortcut: "a",
    icon: <ScrollText className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/trust-override",
    label: "Trust Override",
    shortcut: "t",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/site-config",
    label: "Site Config",
    shortcut: "s",
    icon: <Settings2 className="w-4 h-4" />,
  },
  {
    href: "/api-docs",
    label: "API Docs",
    shortcut: "d",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/dedicate-school",
    label: "Dedicate School",
    shortcut: "g",
    icon: <GraduationCap className="w-4 h-4" />,
  },
];

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

  if (profile?.role && profile.role !== "maintainer") {
    redirect(`/dashboard/${profile.role}`);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-background">
      <MaintainerSidebar slugId={slugId} links={maintainerLinks} />
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto min-h-dvh flex flex-col pb-20 md:pb-0">
        <DashboardNavProvider links={maintainerLinks}>
          {children}
        </DashboardNavProvider>
      </main>
    </div>
  );
} // ponytail: Auth0 session for authentication and role verification.