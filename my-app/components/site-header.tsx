"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"
import { navConfig } from "@/lib/nav-config"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Butwal Hacks home"
        >
          <Image 
            src="/logo.png" 
            alt="Butwal Hacks logo" 
            width={40} 
            height={40} 
            className="rounded-full border border-border" 
          />
          <span className="text-base font-semibold text-foreground">Butwal Hacks</span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary navigation" className="hidden gap-6 text-sm md:flex items-center">
          {navConfig.map((item) => {
            if (item.children) {
              return (
                <div key={item.href} className="relative group">
                  <button
                    className="flex h-10 items-center gap-1 rounded-md px-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-haspopup="menu"
                    aria-label={`${item.label} menu`}
                  >
                    {item.label}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
                    <div className="bg-background border border-border rounded-lg shadow-lg py-2 min-w-[200px]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="flex min-h-10 items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <span>{child.label}</span>
                          {child.badge && (
                            <span className="text-xs px-2 py-0.5 rounded bg-muted border border-border">
                              {child.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }
            
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:flex md:items-center md:gap-2">
          <Link
            href="/community"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Join Movement
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="h-11 w-11 rounded-lg border border-border bg-card p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav 
          aria-label="Mobile navigation" 
          className="md:hidden border-t border-border bg-background"
        >
          <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
            {navConfig.map((item) => {
              if (item.children) {
                return (
                  <div key={item.href} className="mb-2">
                    <button
                      onClick={() =>
                        setOpenMobileSubmenu((prev) => (prev === item.href ? null : item.href))
                      }
                      className="flex min-h-11 items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="flex items-center gap-2">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        {item.label}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${openMobileSubmenu === item.href ? "rotate-90" : ""}`}
                      />
                    </button>
                    
                    {openMobileSubmenu === item.href && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex min-h-10 items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          >
                            <span className="flex items-center gap-2">
                              {child.icon && <child.icon className="w-4 h-4" />}
                              {child.label}
                            </span>
                            {child.badge && (
                              <span className="text-xs px-2 py-0.5 rounded bg-muted border border-border">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        ))}
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
                  className="flex min-h-10 items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              )
            })}

            <Link
              href="/community"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Join Movement
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
