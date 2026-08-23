"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface BottomNavLink {
  href: string;
  label: string;
  icon: ReactNode;
}

interface DashboardBottomNavProps {
  links: BottomNavLink[];
}

/**
 * DashboardBottomNav — mobile-only bottom navigation bar.
 *
 * Shows 4-5 most frequently used links as a fixed bottom bar
 * on small screens. Hidden on md+ (768px) where the sidebar is visible.
 *
 * Features:
 * - Active route highlighting
 * - 44px minimum touch targets
 * - Safe area padding for notched devices
 * - Auto-hides keyboard on link tap via blur
 */
export function DashboardBottomNav({ links }: DashboardBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard/hacker") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface border-t border-border bh-pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 pt-2">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-0.5 min-w-0 flex-1 min-h-[44px] py-1.5 rounded-lg transition-all [&_svg]:w-5 [&_svg]:h-5 ${
                active
                  ? "text-primary-red"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <span className={`${active ? "scale-110" : ""} transition-transform flex items-center justify-center`}>
                {link.icon}
              </span>
              <span className={`text-[10px] font-bold leading-tight ${
                active ? "text-primary-red" : "text-muted-foreground"
              }`}>
                {link.label}
              </span>
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary-red" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
