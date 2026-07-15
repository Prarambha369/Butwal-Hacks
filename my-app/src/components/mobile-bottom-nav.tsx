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
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/", i18nKey: "nav.home", icon: Home },
  { href: "/dashboard", i18nKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/events", i18nKey: "nav.events", icon: CalendarDays },
  { href: "/explore", i18nKey: "nav.explore", icon: Search },
  { href: "/profile", i18nKey: "nav.profile", icon: User },
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
  const { locale } = useLanguage();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bh-pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="bg-surface border-t border-border px-2 py-1.5 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
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
                    ? "text-primary-red"
                    : "text-secondary/60 hover:text-primary"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold tracking-tight">
                  {t(item.i18nKey, locale)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
