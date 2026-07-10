"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

type BreadcrumbItem = { label: string; href?: string }

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

const labelMap: Record<string, string> = {
  about: "About",
  contact: "Contact",
  donors: "Donors",
  events: "Events",
  list: "All Events",
  community: "Community",
  blog: "Blog",
  initiatives: "Programs",
  governance: "Governance",
  support: "Support",
  resources: "Resources",
  privacy: "Privacy",
  terms: "Terms",
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()

  // If explicit items are provided, render those
  if (items) {
    return (
      <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-xs font-medium text-secondary", className)}>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 opacity-40" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-primary">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    )
  }

  // Fall back to auto-generation from pathname
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-xs font-medium text-secondary", className)}>
      <Link href="/" className="hover:text-primary transition-colors" aria-label="Home">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/")
        const label = labelMap[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        const isLast = i === segments.length - 1

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 opacity-40" />
            {isLast ? (
              <span className="text-primary">{label}</span>
            ) : (
              <Link href={href} className="hover:text-primary transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
