"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardRoleSwitcher } from "@/components/dashboard/dashboard-role-switcher";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface MaintainerSidebarProps {
  slugId: string;
  links: NavLink[];
  /**
   * Drawer state owned by DashboardShell, whose topbar renders the hamburger.
   * This rail previously had no small-screen affordance at all -- a fixed
   * w-56 column and nothing to open it with -- so a maintainer on a phone had
   * no navigation to the eleven admin surfaces.
   */
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export default function MaintainerSidebar({
  slugId,
  links,
  mobileOpen = false,
  onNavigate,
}: MaintainerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-56 flex-shrink-0 flex flex-col bg-surface border-r border-border min-h-dvh",
        // Inside the shell's drawer the rail is the drawer's own body, so it
        // must not also be a fixed, h-full column.
        mobileOpen && "min-h-0 h-full",
      )}
      aria-label="Maintainer navigation"
    >
      {/* Profile header with role switcher */}
      <div className="border-b border-border">
        <DashboardRoleSwitcher currentRole="maintainer" slugId={slugId} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          // Prefix match, so /dashboard/maintainer/users keeps Users lit while
          // nested routes are open. Exact match left every parent unhighlighted
          // on any sub-page.
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? "bg-primary-red/10 border border-primary-red/20 text-primary font-medium"
                  : "text-muted-foreground hover:text-primary hover:bg-surface-hover",
              )}
            >
              <span className="flex-shrink-0 w-4 h-4">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Help & docs */}
      <div className="px-2 py-2 border-t border-border">
        <Link
          href="/docs/getting-started"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-surface-hover"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">Help &amp; Docs</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground/40" />
        </Link>
      </div>
    </aside>
  );
}
