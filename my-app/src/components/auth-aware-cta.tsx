"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { LogIn, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthAwareCtaProps {
  /** The href the user navigates to when signed in */
  actionHref: string;
  /** Label shown on the action button when user is authenticated */
  actionLabel: string;
  /** Optional return path after sign-in redirect */
  returnTo?: string;
  /** Variant style */
  variant?: "primary" | "secondary";
  /** Extra class names */
  className?: string;
  /** Called on click when signed in (if provided, overrides actionHref) */
  onAction?: () => void;
}

export default function AuthAwareCta({
  actionHref,
  actionLabel,
  returnTo = "/",
  variant = "primary",
  className,
  onAction,
}: AuthAwareCtaProps) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <div className="h-11 w-32 rounded-full bg-surface-hover animate-pulse" />
      </div>
    );
  }

  const baseClasses =
    "inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold transition-all active:scale-95 min-h-[44px]";

  if (!user) {
    return (
      <Link
        href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
        className={cn(
          baseClasses,
          variant === "primary"
            ? "bg-bh-red-500 text-white hover:bg-deep-red shadow-[0_0_20px_var(--glow-bh-red)]"
            : "bg-surface border border-border text-primary hover:bg-surface-hover",
          className,
        )}
      >
        <LogIn className="h-4 w-4" />
        Sign in to Continue
      </Link>
    );
  }

  if (onAction) {
    return (
      <button
        onClick={onAction}
        className={cn(
          baseClasses,
          variant === "primary"
            ? "bg-bh-red-500 text-white hover:bg-deep-red shadow-[0_0_20px_var(--glow-bh-red)]"
            : "bg-surface border border-border text-primary hover:bg-surface-hover",
          className,
        )}
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Link
      href={actionHref}
      className={cn(
        baseClasses,
        variant === "primary"
          ? "bg-bh-red-500 text-white hover:bg-deep-red shadow-[0_0_20px_var(--glow-bh-red)]"
          : "bg-surface border border-border text-primary hover:bg-surface-hover",
        className,
      )}
    >
      {actionLabel}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
