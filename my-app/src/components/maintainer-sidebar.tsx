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
    <aside className="w-56 flex-shrink-0 flex flex-col lg-surface border-r border-glass min-h-screen">
      <div className="px-4 py-5 border-b border-glass">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-bh-red-500" />
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-bh-red-500/20 text-bh-red-500 border border-bh-red-500/30">
            maintainer
          </span>
        </div>
        <p className="text-xs text-primary/50 mb-0.5 font-mono">ID</p>
        <p className="text-sm text-primary/90 font-semibold tracking-wide truncate font-mono">
          {slugId}
        </p>
      </div>

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
                  ? "bg-bh-red-600/80 backdrop-blur-xl border border-bh-red-500/50 shadow-[0_4px_20px_var(--glow-bh-red)] text-primary font-medium"
                  : "text-primary/60 hover:text-primary/90 hover:bg-surface/10",
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
