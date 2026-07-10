"use client";

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client"

import { ThemeToggle } from "@/components/theme-toggle"
import LanguageSwitcher from "@/components/language-switcher"
import { navConfig } from "@/lib/nav-config"
import { cn } from "@/lib/utils"
import type { NavItem } from "@/lib/nav-config"

type SiteHeaderProps = {
  pageShell?: boolean
}

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function MobileNavItem({ item, pathname, openMobileSubmenu, setOpenMobileSubmenu, setMobileMenuOpen }: { item: NavItem; pathname: string; openMobileSubmenu: string | null; setOpenMobileSubmenu: React.Dispatch<React.SetStateAction<string | null>>; setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  const itemActive = item.children
    ? item.children.some((child) => isPathActive(pathname, child.href)) || isPathActive(pathname, item.href)
    : isPathActive(pathname, item.href)

  if (item.children) {
    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() =>
            setOpenMobileSubmenu((prev: string | null) => (prev === item.href ? null : item.href))
          }
          className={cn(
            "flex min-h-12 w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            itemActive ? "bg-surface text-primary" : "text-primary hover:bg-surface hover:text-primary",
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
          <div className="ml-3 mt-1 space-y-1 border-l border-glass pl-3">
            {item.children.map((child) => {
              const childActive = isPathActive(pathname, child.href)
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={childActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    childActive
                      ? "bg-surface text-primary"
                      : "text-secondary hover:bg-surface hover:text-primary",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {child.icon && <child.icon className="h-4 w-4" />}
                    {child.label}
                  </span>
                  {child.badge && (
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-burgundy">
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
      href={item.href}
      onClick={() => setMobileMenuOpen(false)}
      aria-current={itemActive ? "page" : undefined}
      className={cn(
        "mb-1 flex min-h-11 items-center gap-2 rounded-xl px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        itemActive ? "bg-surface text-primary" : "text-secondary hover:bg-surface hover:text-primary",
      )}
    >
      {item.icon && <item.icon className="h-4 w-4" />}
      {item.label}
    </Link>
  )
}

export default function SiteHeader({}: SiteHeaderProps) {
  const { user } = useUser()
  const isSignedIn = !!user
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeMobileSubmenu =
    navConfig.find((item) => item.children?.some((child) => isPathActive(pathname, child.href)))?.href ?? null
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(activeMobileSubmenu)

  return (
    <header className="sticky top-0 z-50 border-b border-glass bg-glass-bg backdrop-blur-[30px] saturate-[1.8] supports-backdrop-filter:bg-glass-bg">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Butwal Hacks home"
        >
          <Image
            src="/logo.png"
            alt="Butwal Hacks logo"
            width={44}
            height={44}
            priority
            className="rounded-full border border-glass bg-background object-cover shadow-sm"
            suppressHydrationWarning
          />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight text-primary">Butwal Hacks</span>
            <span className="text-[11px] uppercase tracking-[0.28em] text-secondary">Youth Tech Initiative</span>
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
                      "inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      itemActive
                        ? "bg-surface text-primary"
                        : "text-primary/80 hover:bg-surface hover:text-primary",
                    )}
                    aria-haspopup="menu"
                    aria-label={`${item.label} menu`}
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  <div className="absolute left-0 top-full z-50 pt-3 opacity-0 invisible transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="min-w-55 rounded-2xl border border-glass bg-background p-2 shadow-[0_24px_60px_var(--glow-bh-red)]">
                      {item.children.map((child) => {
                        const childActive = isPathActive(pathname, child.href)

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            aria-current={childActive ? "page" : undefined}
                            className={cn(
                              "flex min-h-11 items-center justify-between gap-4 rounded-xl px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              childActive
                                ? "bg-surface text-primary"
                                : "text-secondary hover:bg-surface hover:text-primary",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              {child.icon && <child.icon className="h-4 w-4" />}
                              {child.label}
                            </span>
                            {child.badge && (
                              <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-burgundy">
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
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  itemActive ? "bg-surface text-primary" : "text-primary/80 hover:bg-surface hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isSignedIn ? (
            <Link
              href="/sign-out"
              className="inline-flex h-12 items-center rounded-full border border-glass bg-background px-5 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-surface active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Sign Out
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center rounded-full border border-glass bg-background px-5 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-surface active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Sign In
            </Link>
          )}
          <Link
            href="/sign-up"
            className="inline-flex h-12 items-center rounded-full bg-bh-red-500 px-6 text-sm font-semibold text-white shadow-[0_0_20px_var(--glow-bh-red)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-bh-red-600 hover:shadow-[0_0_30px_var(--glow-bh-red)] active:translate-y-0 active:bg-bh-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bh-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign Up
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-glass bg-background text-primary shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bh-red-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-glass bg-background/95 md:hidden">
          <div className="mx-auto max-h-[70vh] w-full max-w-7xl overflow-y-auto px-4 py-3 sm:px-6">
            {navConfig.map((item) => (
              <MobileNavItem 
                key={item.href} 
                item={item} 
                pathname={pathname} 
                openMobileSubmenu={openMobileSubmenu} 
                setOpenMobileSubmenu={setOpenMobileSubmenu} 
                setMobileMenuOpen={setMobileMenuOpen}
              />
            ))}

            <Link
              href="/sign-up"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-bh-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_var(--glow-bh-red)] transition-all hover:-translate-y-0.5 hover:bg-bh-red-600 hover:shadow-[0_0_30px_var(--glow-bh-red)] active:translate-y-0 active:bg-bh-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bh-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
            Sign Up
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
