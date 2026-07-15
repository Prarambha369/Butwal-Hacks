"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface MaintainerSidebarProps {
  slugId: string;
  links: NavLink[];
}

export default function MaintainerSidebar({ slugId, links }: MaintainerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-surface border-r border-border min-h-dvh">
      {/* Profile header */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-bh-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary-red/10 text-primary-red border border-primary-red/20">
            maintainer
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-0.5 font-mono">ID</p>
        <p className="text-sm text-primary font-semibold tracking-wide truncate font-mono">
          {slugId}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
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
    </aside>
  );
}
