"use client";

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "@/components/org-switcher"

type Role = "hacker" | "sponsor" | "organizer" | "maintainer"

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
    badge: "bg-status-green/20 text-status-green border border-status-green/30",
    badgeText: "hacker",
    activeClass: "bg-surface/10 text-primary",
  },
  sponsor: {
    dot: "bg-status-blue",
    badge: "bg-status-blue/20 text-status-blue border border-status-blue/30",
    badgeText: "sponsor",
    activeClass: "bg-status-blue/20 text-primary",
  },
  organizer: {
    dot: "bg-status-yellow",
    badge: "bg-status-yellow/20 text-status-yellow border border-status-yellow/30",
    badgeText: "organizer",
    activeClass: "bg-surface/10 text-primary",
  },
  maintainer: {
    dot: "bg-bh-red-500",
    badge: "bg-bh-red-500/20 text-bh-red-500 border border-bh-red-500/30",
    badgeText: "maintainer",
    activeClass: "bg-bh-red-600/80 backdrop-blur-xl saturate-150 border border-bh-red-500/50 shadow-[0_4px_20px_var(--glow-bh-red)] text-primary",
  },
}

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
      <div className="px-4 py-5 border-b border-glass">
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
        </div>
        <p className="text-xs text-primary/50 mb-0.5 font-mono">
          ID
        </p>
        <p className="text-sm text-primary/90 font-semibold tracking-wide truncate font-mono">
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
                  : "text-primary/60 hover:text-primary/90 hover:bg-surface/10"
              )}
            >
              <span className="flex-shrink-0 w-4 h-4">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* OrgSwitcher — chapter switching */}
      <div className="px-3 py-4 border-t border-glass">
        <OrgSwitcher />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button — visible only on small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg lg-surface text-primary/80 hover:text-primary"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/60 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static; mobile: slide-in overlay */}
      <aside
        className={cn(
          "w-56 flex-shrink-0 flex flex-col",
          "lg-surface border-r border-glass",
          // Desktop: always visible, part of flex layout
          "hidden md:flex",
          // Mobile: fixed slide-in when open
          mobileOpen &&
            "!flex fixed inset-y-0 left-0 z-40 shadow-2xl"
        )}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile sidebar rendered separately to avoid display conflicts */}
      {mobileOpen && (
        <aside
          className="md:hidden fixed inset-y-0 left-0 z-40 w-56 flex flex-col lg-surface border-r border-glass shadow-2xl"
        >
          {renderSidebarContent()}
        </aside>
      )}
    </>
  )
}
