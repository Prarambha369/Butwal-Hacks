"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HelpCircle, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavLink as NavLinkType, RoleStyle } from "@/components/sidebar-config"

interface SidebarNavProps {
  links: NavLinkType[]
  roleStyle: RoleStyle
  onLinkClick?: () => void
}

export default function SidebarNav({ links, roleStyle, onLinkClick }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <>
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
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? cn(roleStyle.activeClass, "font-medium")
                  : "text-text-secondary hover:text-primary hover:bg-surface-hover"
              )}
            >
              <span className="flex-shrink-0 w-4 h-4">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-2 border-t border-border">
        <Link
          href="/docs/getting-started"
          onClick={onLinkClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-text-secondary hover:text-primary hover:bg-surface-hover"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">Help &amp; Docs</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground/40" />
        </Link>
      </div>
    </>
  )
}
