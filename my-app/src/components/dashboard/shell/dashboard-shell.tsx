"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/use-focus-trap";
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

  // The drawer is the sidebar itself now, so the trap is attached to the node
  // that renderSidebar returns via a wrapper ref on the shell row.
  const shellRef = useRef<HTMLDivElement>(null);
  useFocusTrap(shellRef, navOpen);

  // Escape closes the drawer. Without it the overlay is a keyboard trap in the
  // other direction: focus is contained by the trap, and the only way out is
  // the close button, which you have to Tab to.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

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

  return (
    <div ref={shellRef} className="flex min-h-dvh bg-background">
      {/* One sidebar instance, always mounted. It is the desktop rail when
          closed and becomes the drawer when open, rather than being two
          subtrees that swap places: a swap remounts, and this sidebar mounts
          SkillTreeWidget and OrgSwitcher, so every drawer open would re-run
          getSkillTreeSummary() and the profiles query. Two live subtrees --
          the version before this -- ran both on every single open. */}
      {renderSidebar(navOpen)}

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

      {navOpen ? (
        <>
          {/* Presentational, not a control. As a <button> this was a second
              element named "Close navigation", so a screen reader announced two
              identical buttons for one action -- and a scrim is not where a
              keyboard or AT user aims. The X button and Escape cover that. */}
          <div
            aria-hidden="true"
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 bh-touch-manipulation"
          />
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
            className="fixed right-3 top-3 z-50 rounded-lg bg-surface p-2 text-secondary shadow-sm hover:bg-surface-hover bh-touch-manipulation"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      ) : null}

      {/* Keep the role in the DOM for the active-nav tint used by children. */}
      <span className="sr-only" data-dashboard-role={role}>
        {config.badgeText}
      </span>
    </div>
  );
}
