"use client";

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "@/components/org-switcher"
import OnboardingProgressWidget from "@/components/dashboard/onboarding-progress-widget"
import SkillTreeWidget from "@/components/skills/skill-tree-widget"
import SidebarNav from "@/components/sidebar-nav"
import { DashboardRoleSwitcher } from "@/components/dashboard/dashboard-role-switcher"
import { roleConfig, type DashboardSidebarProps } from "@/components/sidebar-config"

/**
 * Renders a role-specific dashboard sidebar with responsive navigation.
 *
 * @param role - The role whose styling and identity badge the sidebar displays
 * @param slugId - The identifier shown in the sidebar identity block
 * @param links - The navigation links displayed in the sidebar
 */
export default function DashboardSidebar({
  role,
  slugId,
  links,
  onboardingProfile,
  onboardingChapterCount,
  onboardingProjectCount,
}: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const config = roleConfig[role]

  const closeMobile = () => setMobileOpen(false)

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="border-b border-border">
        <DashboardRoleSwitcher currentRole={role} slugId={slugId} />
      </div>

      {onboardingProfile !== undefined && (
        <OnboardingProgressWidget
          profile={onboardingProfile}
          chapterCount={onboardingChapterCount}
          projectCount={onboardingProjectCount}
        />
      )}

      <SkillTreeWidget />

      <SidebarNav links={links} roleStyle={config} onLinkClick={closeMobile} />

      <div className="px-3 py-4 border-t border-border">
        <OrgSwitcher />
      </div>
    </div>
  )

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 min-w-[44px] min-h-[44px] p-2.5 rounded-lg bh-card text-text-secondary hover:text-primary bh-touch-manipulation"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30 bh-touch-manipulation"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "w-56 flex-shrink-0 flex flex-col",
          "bh-card rounded-none border-r border-border border-t-0 border-l-0 border-b-0",
          "hidden md:flex",
          mobileOpen && "!flex fixed inset-y-0 left-0 z-40 shadow-xl bh-overscroll-contain"
        )}
      >
        {renderSidebarContent()}
      </aside>

      {mobileOpen && (
        <aside className="md:hidden fixed inset-y-0 left-0 z-40 w-56 flex flex-col bh-card rounded-none border-r border-border shadow-xl bh-overscroll-contain">
          {renderSidebarContent()}
        </aside>
      )}
    </>
  )
}
