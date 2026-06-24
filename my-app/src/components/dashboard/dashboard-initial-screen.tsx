"use client";

import { useState, useEffect, type ReactNode } from "react";
import { RoleSelector, ROLE_SELECTED_KEY } from "@/components/dashboard/role-selector";

interface DashboardInitialScreenProps {
  children: ReactNode;
  email: string;
  emailVerified: boolean;
  currentRole: string;
}

/**
 * DashboardInitialScreen — client wrapper that determines whether to show
 * the role selection screen (first visit) or the regular dashboard content.
 *
 * Skips the role selector entirely if the user already has a non-hacker role
 * (returning maintainer, organizer, or sponsor). For hackers, checks
 * localStorage to see if they've already dismissed/selected a role.
 */
export function DashboardInitialScreen({
  children,
  email,
  emailVerified,
  currentRole,
}: DashboardInitialScreenProps) {
  const [showRoleSelector, setShowRoleSelector] = useState<boolean | null>(null);

  // If the user already has a non-hacker role, never show the selector
  const hasEstablishedRole = currentRole !== "hacker";

  useEffect(() => {
    if (hasEstablishedRole) {
      setShowRoleSelector(false);
      return;
    }
    const roleSeen = localStorage.getItem(ROLE_SELECTED_KEY);
    setShowRoleSelector(roleSeen !== "true");
  }, [hasEstablishedRole]);

  // Still hydrating — render nothing to avoid flash
  if (showRoleSelector === null) {
    return (
      <div className="min-h-dvh bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-red/30 border-t-primary-red rounded-full animate-spin" />
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div className="min-h-dvh bg-bg-base flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <RoleSelector email={email} emailVerified={emailVerified} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
