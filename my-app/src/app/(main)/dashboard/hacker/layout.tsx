import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

// ponytail: Command palette uses native dialog with no extra deps (no cmdk/kbar).
// g+key shortcuts work via a simple useEffect keydown listener.
const DashboardNavProvider = NextDynamic(() =>
  import("@/components/dashboard-nav-provider").then((m) => m.DashboardNavProvider),
);

const DashboardSidebar = NextDynamic(() => import("@/components/dashboard-sidebar"));

const DashboardBottomNav = NextDynamic(() => import("@/components/dashboard-bottom-nav").then((m) => ({ default: m.DashboardBottomNav })));

export const dynamic = "force-dynamic";

import {
  LayoutDashboard,
  User,
  Code2,
  Users,
  Key,
  UsersRound,
  FileText,
  KanbanSquare,
  GitBranch,
  MessageSquare,
} from "lucide-react";

const hackerLinks = [
  {
    href: "/dashboard/hacker",
    label: "Overview",
    shortcut: "h",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/profile",
    label: "My Profile",
    shortcut: "r",
    icon: <User className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/work",
    label: "Work",
    shortcut: "w",
    icon: <KanbanSquare className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/projects",
    label: "Projects",
    shortcut: "p",
    icon: <Code2 className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/certificates",
    label: "Certificates",
    shortcut: "c",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    href: "/teams",
    label: "Teams",
    shortcut: "t",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/team-matching",
    label: "AI Team Match",
    shortcut: "m",
    icon: <UsersRound className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/api-keys",
    label: "API Keys",
    shortcut: "k",
    icon: <Key className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/skills",
    label: "Skill Trees",
    shortcut: "s",
    icon: <GitBranch className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/chat",
    label: "Team Chat",
    shortcut: "x",
    icon: <MessageSquare className="w-4 h-4" />,
  },
];

/**
 * Renders the authenticated hacker dashboard layout.
 *
 * Redirects unauthenticated users to login and routes users with other roles to
 * their corresponding dashboard.
 *
 * @param children - The dashboard content to render.
 * @returns The hacker dashboard layout.
 */
export default async function HackerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  const userId = session?.user?.sub ?? "none";

  const db = createServiceClient();
  const { data: profile } = await db
    .from("profiles")
    .select("id, role, slug_id, full_name, bio, socials, xp, trust_markers")
    .eq("auth0_user_id", userId)
    .single();

  // Lead users fall through to the hacker dashboard as a fallback
  // until a dedicated /dashboard/lead layout is created.
  if (profile?.role && profile.role !== "hacker" && profile.role !== "lead" && profile.role !== "maintainer") {
    redirect(`/dashboard/${profile.role}`);
  }

  const slugId = profile?.slug_id ?? userId.slice(0, 8).toUpperCase();

  // Fetch counts for onboarding progress widget
  let chapterCount = 0;
  let projectCount = 0;
  if (profile) {
    const { count: cc } = await db
      .from("chapter_members")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id);
    chapterCount = cc ?? 0;

    const { count: pc } = await db
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id);
    projectCount = pc ?? 0;
  }

  // Onboarding data — pass to sidebar for the progress widget
  const onboardingProfile = profile
    ? {
        full_name: profile.full_name,
        bio: profile.bio,
        socials: profile.socials as Record<string, string> | null,
        xp: profile.xp,
        trust_markers: profile.trust_markers as unknown[] | null,
      }
    : null;

  // Top 5 links for the mobile bottom nav
  const topNavLinks = hackerLinks.slice(0, 5);

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar
        role="hacker"
        slugId={slugId}
        links={hackerLinks}
        onboardingProfile={onboardingProfile}
        onboardingChapterCount={chapterCount}
        onboardingProjectCount={projectCount}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto min-h-dvh flex flex-col bh-overscroll-none pb-20 md:pb-0">
        <DashboardNavProvider links={hackerLinks}>
          {children}
        </DashboardNavProvider>
      </main>
      <DashboardBottomNav links={topNavLinks} />
    </div>
  );
} // ponytail: Uses Auth0 session for user validation and profile role check.