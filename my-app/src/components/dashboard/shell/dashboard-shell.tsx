"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/shell/dashboard-topbar";
import { roleConfig, type NavLink, type Role } from "@/components/sidebar-config";
import type { SlimProfile } from "@/components/sidebar-config";

/**
 * The shared dashboard chrome.
 *
 * All three role dashboards previously repeated the same flex row, sidebar
 * props and `max-w-7xl mx-auto` main element inline, which is why the rail
 * width, padding and mobile behaviour had drifted apart between them. This
 * owns that arrangement once.
 *
 * The sidebar keeps its own widgets (role switcher, onboarding progress, skill
 * tree, org switcher) -- the redesign changes the layout around them, not the
 * functionality inside. Its private mobile toggle is suppressed here because
 * the topbar owns the hamburger, so two triggers would fight over one drawer.
 */
export function DashboardShell({
  role,
  slugId,
  links,
  title,
  sidebar,
  onboardingProfile,
  onboardingChapterCount,
  onboardingProjectCount,
  children,
}: {
  role: Role;
  slugId: string;
  links: NavLink[];
  title?: string;
  /**
   * Swap in a different rail. The maintainer dashboard has its own sidebar --
   * it is a moderation console, not a builder workspace, and it carries a docs
   * link instead of the org switcher. Forcing it onto the shared rail would
   * have meant deleting real functionality.
   *
   * Receives the drawer state so the override cannot reintroduce a second,
   * conflicting hamburger.
   */
  sidebar?: (opts: { open: boolean; onNavigate: () => void }) => React.ReactNode;
  onboardingProfile?: SlimProfile | null;
  onboardingChapterCount?: number;
  onboardingProjectCount?: number;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const config = roleConfig[role];

  const renderSidebar = (open: boolean) =>
    sidebar ? (
      sidebar({ open, onNavigate: () => setNavOpen(false) })
    ) : (
      <DashboardSidebar
        role={role}
        slugId={slugId}
        links={links}
        onboardingProfile={onboardingProfile}
        onboardingChapterCount={onboardingChapterCount}
        onboardingProjectCount={onboardingProjectCount}
        mobileOpen={open}
        onNavigate={() => setNavOpen(false)}
      />
    );

  const sidebarNode = renderSidebar(navOpen);

  return (
    <div className="flex min-h-dvh bg-background">
      <div className="hidden md:flex md:flex-shrink-0">{renderSidebar(false)}</div>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          role={role}
          title={title}
          slugId={slugId}
          onOpenNav={() => setNavOpen(true)}
        />
        <main
          className={cn(
            "flex-1 px-4 py-6 md:px-6 lg:px-8",
            "bh-overscroll-none pb-20 md:pb-10",
          )}
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile drawer. Rendered by the shell so the topbar's hamburger is the
          only trigger, and it sits above the content rather than inside the
          desktop rail. */}
      {navOpen ? (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/40 bh-touch-manipulation"
          />
          <div className="relative flex h-full w-64 flex-col border-r border-border bg-surface shadow-xl bh-overscroll-contain">
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-3 z-10 rounded-lg p-2 text-secondary hover:bg-surface-hover bh-touch-manipulation"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {sidebarNode}
          </div>
        </div>
      ) : null}

      {/* Keep the role in the DOM for the active-nav tint used by children. */}
      <span className="sr-only" data-dashboard-role={role}>
        {config.badgeText}
      </span>
    </div>
  );
}
