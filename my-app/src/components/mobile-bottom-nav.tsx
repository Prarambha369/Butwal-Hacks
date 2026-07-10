"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  User,
  Home,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/profile", label: "Profile", icon: User },
];

/**
 * MobileBottomNav — fixed bottom tab bar for mobile PWA feel.
 * Only visible on small screens (md:hidden). Shows 5 core nav items.
 * Active state uses bh-red-500 highlight matching the design system.
 *
 * ponytail: no animation library, no complex state — just a nav bar.
 */
export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="bg-[#434343]/80 backdrop-blur-[30px] saturate-[180%] border-t border-[#656565]/30 px-2 py-1.5">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
                  active
                    ? "text-bh-red-500"
                    : "text-secondary/60 hover:text-primary"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
