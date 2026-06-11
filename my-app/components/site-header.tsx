"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { useShell } from "@/components/shell-provider"
import { navConfig } from "@/lib/nav-config"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  forceRender?: boolean
  pageShell?: boolean
}

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function SiteHeader({ forceRender = false }: SiteHeaderProps) {
  const { hasGlobalHeader } = useShell()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeMobileSubmenu =
    navConfig.find((item) => item.children?.some((child) => isPathActive(pathname, child.href)))?.href ?? null
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(activeMobileSubmenu)

  if (hasGlobalHeader && !forceRender) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 border-b border-red-100/80 bg-background/90 backdrop-blur-xl supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Butwal Hacks home"
        >
          <Image
            src="/logo.png"
            alt="Butwal Hacks logo"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full border border-red-100 bg-white object-cover shadow-sm"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight text-foreground">Butwal Hacks</span>
            <span className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Youth Tech Initiative</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          {navConfig.map((item) => {
            const itemActive = item.children
              ? item.children.some((child) => isPathActive(pathname, child.href)) || isPathActive(pathname, item.href)
              : isPathActive(pathname, item.href)

            if (item.children) {
              return (
                <div key={item.href} className="group relative">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      itemActive
                        ? "bg-red-50 text-primary"
                        : "text-foreground/80 hover:bg-red-50 hover:text-primary",
                    )}
                    aria-haspopup="menu"
                    aria-label={`${item.label} menu`}
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  <div className="absolute left-0 top-full z-50 pt-3 opacity-0 invisible transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="min-w-55 rounded-2xl border border-red-100 bg-background p-2 shadow-[0_24px_60px_rgba(166,40,31,0.12)]">
                      {item.children.map((child) => {
                        const childActive = isPathActive(pathname, child.href)

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            aria-current={childActive ? "page" : undefined}
                            className={cn(
                              "flex min-h-11 items-center justify-between gap-4 rounded-xl px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              childActive
                                ? "bg-red-50 text-primary"
                                : "text-muted-foreground hover:bg-red-50 hover:text-primary",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              {child.icon && <child.icon className="h-4 w-4" />}
                              {child.label}
                            </span>
                            {child.badge && (
                              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-burgundy">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={itemActive ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  itemActive ? "bg-red-50 text-primary" : "text-foreground/80 hover:bg-red-50 hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/community"
            className="inline-flex h-12 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#C93526] active:translate-y-0 active:bg-[#A6281F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Join Movement
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-100 bg-white text-primary shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => {
              setMobileMenuOpen((prev: boolean) => {
                const next = !prev
                if (next) setOpenMobileSubmenu(activeMobileSubmenu)
                return next
              })
            }}
            aria-label="Toggle mobile menu"
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-red-100 bg-background/95 md:hidden">
          <div className="mx-auto max-h-[70vh] w-full max-w-7xl overflow-y-auto px-4 py-3 sm:px-6">
            {navConfig.map((item) => {
              const itemActive = item.children
                ? item.children.some((child) => isPathActive(pathname, child.href)) || isPathActive(pathname, item.href)
                : isPathActive(pathname, item.href)

              if (item.children) {
                return (
                  <div key={item.href} className="mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMobileSubmenu((prev: string | null) => (prev === item.href ? null : item.href))
                      }
                      className={cn(
                        "flex min-h-12 w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        itemActive ? "bg-red-50 text-primary" : "text-foreground hover:bg-red-50 hover:text-primary",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        {item.label}
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          openMobileSubmenu === item.href ? "rotate-90" : "",
                        )}
                      />
                    </button>

                    {openMobileSubmenu === item.href && (
                      <div className="ml-3 mt-1 space-y-1 border-l border-red-100 pl-3">
                        {item.children.map((child) => {
                          const childActive = isPathActive(pathname, child.href)

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "flex min-h-11 items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                childActive
                                  ? "bg-red-50 text-primary"
                                  : "text-muted-foreground hover:bg-red-50 hover:text-primary",
                              )}
                            >
                              <span className="flex items-center gap-2">
                                {child.icon && <child.icon className="h-4 w-4" />}
                                {child.label}
                              </span>
                              {child.badge && (
                                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-burgundy">
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={itemActive ? "page" : undefined}
                  className={cn(
                    "mb-1 flex min-h-11 items-center gap-2 rounded-xl px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    itemActive ? "bg-red-50 text-primary" : "text-muted-foreground hover:bg-red-50 hover:text-primary",
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              )
            })}

            <Link
              href="/community"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#C93526] active:translate-y-0 active:bg-[#A6281F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87E6C] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Join Movement
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
