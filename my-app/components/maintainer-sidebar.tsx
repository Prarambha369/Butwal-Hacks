"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavLink {
  href: string
  label: string
  icon: React.ReactNode
}

interface MaintainerSidebarProps {
  slugId: string
  links: NavLink[]
}

function SidebarContent({
  slugId,
  links,
  onLinkClick,
}: {
  slugId: string
  links: NavLink[]
  onLinkClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Identity block */}
      <div className="px-4 py-5 border-b border-red-900/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            maintainer
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
            (link.href !== "/dashboard/maintainer" &&
              pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? "bh-glass-red font-medium text-white"
                  : "text-white/60 hover:text-white/90 hover:bg-red-900/20"
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
}

export default function MaintainerSidebar({
  slugId,
  links,
}: MaintainerSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1C1C1E] border border-red-900/50 text-white/80 hover:text-white"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#1C1C1E] border-r border-red-900/50 hidden md:flex flex-col">
        <SidebarContent slugId={slugId} links={links} />
      </aside>

      {/* Mobile slide-in sidebar */}
      {mobileOpen && (
        <aside className="md:hidden fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-[#1C1C1E] border-r border-red-900/50 shadow-2xl">
          <SidebarContent
            slugId={slugId}
            links={links}
            onLinkClick={() => setMobileOpen(false)}
          />
        </aside>
      )}
    </>
  )
}
