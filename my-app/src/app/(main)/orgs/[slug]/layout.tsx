import { auth0 } from "@/lib/auth0";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { OrgSwitcher } from "@/components/org-switcher";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ArrowLeft,
} from "lucide-react";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params;
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = await createClient();

  // Fetch chapter details
  const { data: chapter } = await supabase
    .from("chapters")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!chapter) {
    notFound();
  }

  // Resolve profile UUID for FK query
  const { data: membershipProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", userId)
    .single();

  // Check membership in this chapter via DB
  const { data: membership } = await supabase
    .from("chapter_members")
    .select("org_role")
    .eq("chapter_id", chapter.id)
    .eq("profile_id", membershipProfile?.id ?? 'none')
    .single();

  if (!membership) {
    // User is not a member of this chapter
    redirect("/dashboard");
  }

  const isAdmin = membership.org_role === "admin";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col lg-surface border-r border-glass">
        <div className="px-4 py-5 border-b border-glass space-y-3">
          {/* Back to main dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-primary/50 hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Dashboard
          </Link>

          {/* Chapter identity */}
          <div>
            <h2 className="text-sm font-bold text-primary/90 truncate">
              {chapter.name}
            </h2>
            <p className="text-[10px] font-mono text-primary/40 truncate">
              {isAdmin ? "Chapter Admin" : "Chapter Member"}
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <Link
            href={`/orgs/${slug}/dashboard`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary/60 hover:text-primary/90 hover:bg-surface/10 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href={`/orgs/${slug}/events`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary/60 hover:text-primary/90 hover:bg-surface/10 transition-all"
          >
            <CalendarDays className="w-4 h-4" />
            Events
          </Link>
          <Link
            href={`/orgs/${slug}/members`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary/60 hover:text-primary/90 hover:bg-surface/10 transition-all"
          >
            <Users className="w-4 h-4" />
            Members
          </Link>
        </nav>

        {/* Bottom: OrgSwitcher */}
        <div className="px-3 py-4 border-t border-glass">
          <OrgSwitcher />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
