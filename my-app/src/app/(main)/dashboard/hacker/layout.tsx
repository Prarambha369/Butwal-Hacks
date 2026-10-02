import { PROFILE_SETTINGS_PATH } from "@/lib/routes";
import { redirect } from "next/navigation";
import NextDynamic from "next/dynamic";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { roleRedirect } from "@/lib/role-gate";

// ponytail: Command palette uses native dialog with no extra deps (no cmdk/kbar).
// g+key shortcuts work via a simple useEffect keydown listener.
const DashboardNavProvider = NextDynamic(() =>
  import("@/components/dashboard-nav-provider").then((m) => m.DashboardNavProvider),
);

const DashboardShell = NextDynamic(() =>
  import("@/components/dashboard/shell/dashboard-shell").then((m) => ({ default: m.DashboardShell })),
);

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
    href: PROFILE_SETTINGS_PATH,
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
    .select("id, role, slug_id, full_name, bio, socials, trust_markers")
    .eq("auth0_user_id", userId)
    .single();

  // Lead users fall through to the hacker dashboard as a fallback
  // until a dedicated /dashboard/lead layout is created.
  //
  // `roleRedirect` rather than an inline `profile?.role && ...` test. The
  // truthiness form skipped the whole guard whenever `profile` was null, so an
  // unknown role rendered the dashboard instead of being redirected -- the
  // exact fail-open bug role-gate.ts exists to prevent, and the reason
  // maintainer and organizer layouts were already converted. Reachable
  // whenever the bootstrap in dashboard/layout.tsx fails on both the
  // create_profile_with_bh_id RPC and the insert fallback.
  const blocked = roleRedirect(profile?.role, ["hacker", "lead", "maintainer"]);
  if (blocked) {
    redirect(blocked);
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
        trust_markers: profile.trust_markers as unknown[] | null,
      }
    : null;

  // Top 5 links for the mobile bottom nav
  const topNavLinks = hackerLinks.slice(0, 5);

  return (
    <DashboardNavProvider links={hackerLinks}>
      <DashboardShell
        role="hacker"
        slugId={slugId}
        links={hackerLinks}
        onboardingProfile={onboardingProfile}
        onboardingChapterCount={chapterCount}
        onboardingProjectCount={projectCount}
      >
        {children}
      </DashboardShell>

      <DashboardBottomNav links={topNavLinks} />
    </DashboardNavProvider>
  );
} // ponytail: Uses Auth0 session for user validation and profile role check.