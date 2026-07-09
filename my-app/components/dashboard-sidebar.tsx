"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Role = "hacker" | "organizer" | "maintainer"

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
    dot: "bg-green-400",
    badge: "bg-green-500/20 text-green-400 border border-green-500/30",
    badgeText: "hacker",
    activeClass: "bg-white/10 text-white",
  },
  organizer: {
    dot: "bg-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    badgeText: "organizer",
    activeClass: "bg-white/10 text-white",
  },
  maintainer: {
    dot: "bg-red-500",
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    badgeText: "maintainer",
    activeClass: "bh-glass-red text-white",
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Identity block */}
      <div className="px-4 py-5 border-b border-white/10">
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
        <p
          className="text-xs text-white/50 mb-0.5"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ID
        </p>
        <p
          className="text-sm text-white/90 font-semibold tracking-wide truncate"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {slugId}
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard/hacker" &&
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
                  : "text-white/60 hover:text-white/90 hover:bg-white/5"
              )}
            >
              <span className="flex-shrink-0 w-4 h-4">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button — visible only on small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bh-glass-surface text-white/80 hover:text-white"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static; mobile: slide-in overlay */}
      <aside
        className={cn(
          "w-56 flex-shrink-0 flex flex-col",
          "bh-glass-surface border-r border-white/10",
          // Desktop: always visible, part of flex layout
          "hidden md:flex",
          // Mobile: fixed slide-in when open
          mobileOpen &&
            "!flex fixed inset-y-0 left-0 z-40 shadow-2xl"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar rendered separately to avoid display conflicts */}
      {mobileOpen && (
        <aside
          className="md:hidden fixed inset-y-0 left-0 z-40 w-56 flex flex-col bh-glass-surface border-r border-white/10 shadow-2xl"
        >
          <SidebarContent />
        </aside>
      )}
    </>
  )
}
