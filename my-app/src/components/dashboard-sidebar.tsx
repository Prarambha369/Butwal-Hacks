"use client";

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "@/components/org-switcher"

type Role = "hacker" | "sponsor" | "organizer" | "maintainer" | "lead"

interface NavLink {
  href: string
  label: string
  icon: React.ReactNode
}

interface DashboardSidebarProps {
  role: Role
  slugId: string
  links: NavLink[]
}

const roleConfig: Record<
  Role,
  { dot: string; badge: string; badgeText: string; activeClass: string }
> = {
  hacker: {
    dot: "bg-status-green",
    badge: "bg-status-green/10 text-status-green border border-status-green/20",
    badgeText: "hacker",
    activeClass: "bg-surface-hover text-primary font-semibold",
  },
  sponsor: {
    dot: "bg-status-blue",
    badge: "bg-status-blue/10 text-status-blue border border-status-blue/20",
    badgeText: "sponsor",
    activeClass: "bg-status-blue/8 text-primary font-semibold",
  },
  organizer: {
    dot: "bg-status-yellow",
    badge: "bg-status-yellow/10 text-status-yellow border border-status-yellow/20",
    badgeText: "organizer",
    activeClass: "bg-surface-hover text-primary font-semibold",
  },
  maintainer: {
    dot: "bg-primary-red",
    badge: "bg-primary-red/10 text-primary-red border border-primary-red/20",
    badgeText: "maintainer",
    activeClass: "bg-primary-red/8 text-primary-red font-semibold border border-primary-red/20",
  },
  lead: {
    dot: "bg-status-purple",
    badge: "bg-status-purple/10 text-status-purple border border-status-purple/20",
    badgeText: "lead",
    activeClass: "bg-status-purple/8 text-status-purple font-semibold border border-status-purple/20",
  },
}

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
}: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const config = roleConfig[role]

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Identity block */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn("w-2 h-2 rounded-full flex-shrink-0", config.dot)}
          />
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              config.badge
            )}
          >
            {config.badgeText}
          </span>
        </div>          <p className="text-xs text-muted-foreground mb-0.5 font-mono">
            ID
          </p>
          <p className="text-sm text-primary font-semibold tracking-wide truncate font-mono">
            {slugId}
          </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard/hacker" &&
              link.href !== "/dashboard/sponsor" &&
              link.href !== "/dashboard/organizer" &&
              link.href !== "/dashboard/maintainer" &&
              pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? cn(config.activeClass, "font-medium")
                  : "text-text-secondary hover:text-primary hover:bg-surface-hover"
              )}
            >
              <span className="flex-shrink-0 w-4 h-4">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* OrgSwitcher — chapter switching */}
      <div className="px-3 py-4 border-t border-border">
        <OrgSwitcher />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button — visible only on small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bh-card text-text-secondary hover:text-primary"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static; mobile: slide-in overlay */}
      <aside
        className={cn(
          "w-56 flex-shrink-0 flex flex-col",
          "bh-card rounded-none border-r border-border border-t-0 border-l-0 border-b-0",
          // Desktop: always visible, part of flex layout
          "hidden md:flex",
          // Mobile: fixed slide-in when open
          mobileOpen &&
            "!flex fixed inset-y-0 left-0 z-40 shadow-xl"
        )}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile sidebar rendered separately to avoid display conflicts */}
      {mobileOpen && (
        <aside
          className="md:hidden fixed inset-y-0 left-0 z-40 w-56 flex flex-col bh-card rounded-none border-r border-border shadow-xl"
        >
          {renderSidebarContent()}
        </aside>
      )}
    </>
  )
}
