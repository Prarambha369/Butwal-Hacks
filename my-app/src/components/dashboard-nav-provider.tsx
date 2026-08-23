"use client";

import { DashboardCommandPalette, type DashboardNavItem } from "./dashboard-command-palette";
import { useDashboardShortcuts } from "@/hooks/use-dashboard-shortcuts";

interface DashboardNavProviderProps {
  links: DashboardNavItem[];
  children: React.ReactNode;
}

/**
 * DashboardNavProvider — client-side wrapper that adds keyboard navigation
 * shortcuts and a command palette to dashboard layouts.
 *
 * Must be inside the dashboard layout's children area.
 */
export function DashboardNavProvider({
  links,
  children,
}: DashboardNavProviderProps) {
  useDashboardShortcuts(links);

  return (
    <>
      <DashboardCommandPalette links={links} />
      {children}
    </>
  );
}
