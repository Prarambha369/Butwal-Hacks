import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

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
    icon: <Terminal className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/users",
    label: "Users",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/audit-log",
    label: "Audit Log",
    icon: <ScrollText className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/trust-override",
    label: "Trust Override",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/site-config",
    label: "Site Config",
    icon: <Settings2 className="w-4 h-4" />,
  },
  {
    href: "/api-docs",
    label: "API Docs",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/dedicate-school",
    label: "Dedicate School",
    icon: <GraduationCap className="w-4 h-4" />,
  },
];

export default async function MaintainerDashboardLayout({
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

  if (profile?.role && profile.role !== "maintainer") {
    redirect(`/dashboard/${profile.role}`);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-background">
      <MaintainerSidebar slugId={slugId} links={maintainerLinks} />
      <main className="flex-1 p-8 max-w-6xl">{children}</main>
    </div>
  );
} // ponytail: Auth0 session for authentication and role verification.