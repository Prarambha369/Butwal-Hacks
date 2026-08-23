"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  User,
  ShieldCheck,
  CalendarDays,
  Building2,
  Users,
  ChevronDown,
  ExternalLink,
  Lock,
  CheckCircle2,
} from "lucide-react";

interface RoleEntry {
  id: string;
  label: string;
  icon: React.ReactNode;
  dot: string;
  badge: string;
  badgeText: string;
  description: string;
}

const ALL_DASHBOARDS: RoleEntry[] = [
  {
    id: "hacker",
    label: "Hacker",
    icon: <User className="w-4 h-4" />,
    dot: "bg-status-green",
    badge: "bg-status-green/10 text-status-green border-status-green/20",
    badgeText: "Hacker",
    description: "Normal User",
  },
  {
    id: "organizer",
    label: "Organizer",
    icon: <CalendarDays className="w-4 h-4" />,
    dot: "bg-status-yellow",
    badge: "bg-status-yellow/10 text-status-yellow border-status-yellow/20",
    badgeText: "Organizer",
    description: "Event Manager",
  },
  {
    id: "maintainer",
    label: "Maintainer",
    icon: <ShieldCheck className="w-4 h-4" />,
    dot: "bg-primary-red",
    badge: "bg-primary-red/10 text-primary-red border-primary-red/20",
    badgeText: "Maintainer",
    description: "Butwal Hacks Personnel",
  },
  {
    id: "sponsor",
    label: "Sponsor",
    icon: <Building2 className="w-4 h-4" />,
    dot: "bg-status-blue",
    badge: "bg-status-blue/10 text-status-blue border-status-blue/20",
    badgeText: "Sponsor",
    description: "Event Funders",
  },
  {
    id: "lead",
    label: "Lead",
    icon: <Users className="w-4 h-4" />,
    dot: "bg-status-orange",
    badge: "bg-status-orange/10 text-status-orange border-status-orange/20",
    badgeText: "Lead",
    description: "Chapter Lead",
  },
];

interface DashboardRoleSwitcherProps {
  currentRole: string;
  slugId: string;
}

export function DashboardRoleSwitcher({ currentRole, slugId }: DashboardRoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = ALL_DASHBOARDS.find((r) => r.id === currentRole) ?? ALL_DASHBOARDS[0];

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-surface-hover transition-colors group"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn("w-2 h-2 rounded-full shrink-0", current.dot)} />
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-bold text-primary">{current.label}</p>
          <p className="text-[10px] font-mono text-muted-foreground/60 truncate">
            {slugId}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground/40 transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bh-card p-1.5 shadow-xl border-border rounded-xl" role="listbox">
          <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">
            Switch dashboard
          </div>
          {ALL_DASHBOARDS.map((role) => {
            const isCurrent = role.id === currentRole;
            const dashboardPath = `/dashboard/${role.id}`;

            return (
              <Link
                key={role.id}
                href={dashboardPath}
                role="option"
                aria-selected={isCurrent}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isCurrent
                    ? "bg-primary-red/10 border border-primary-red/20"
                    : "hover:bg-surface-hover border border-transparent",
                )}
                onClick={() => setOpen(false)}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  role.badge,
                )}>
                  {role.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-primary">{role.label}</span>
                    {isCurrent && (
                      <CheckCircle2 className="w-3 h-3 text-primary-red" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 truncate">{role.description}</p>
                </div>
                {!isCurrent && (
                  <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary-red/50 transition-colors shrink-0" />
                )}
              </Link>
            );
          })}

          {/* Divider + role management link */}
          <div className="mt-1 pt-1.5 border-t border-border">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors"
              onClick={() => setOpen(false)}
            >
              <Lock className="w-3 h-3" />
              Request role upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
