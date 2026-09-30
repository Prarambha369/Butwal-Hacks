"use client";

import { useAuthUser } from "@/components/auth-user-provider";
import Link from "next/link";
import { LogIn, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthAwareCtaProps {
  /** The href the user navigates to when signed in */
  actionHref: string;
  /** Label shown on the action button when user is authenticated */
  actionLabel: string;
  /** Label shown to signed-out users. Defaults to "Sign in to Continue". */
  signedOutLabel?: string;
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
  signedOutLabel = "Sign in to Continue",
  returnTo = "/",
  variant = "primary",
  className,
  onAction,
}: AuthAwareCtaProps) {
  const { user, isLoading } = useAuthUser();

  const baseClasses =
    "inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold transition-all active:scale-95 min-h-[44px]";

  const variantClasses =
    variant === "primary"
      ? "bg-bh-red-500 text-white hover:bg-deep-red shadow-[0_0_20px_var(--glow-bh-red)]"
      : "bg-surface border border-border text-primary hover:bg-surface-hover";

  // The loading state must occupy exactly the same box as the resolved button,
  // or swapping between them reflows the page. It previously wrapped an h-11
  // pulse block in `baseClasses`-less markup while `className` supplied
  // bh-btn-primary's padding, so the shell measured 64px against the resolved
  // 46px. That 18px collapse was the single largest layout shift on the site
  // (0.1168 measured on production) — it moved the Hero terminal up and
  // re-flowed the nav.
  //
  // The real label is rendered `invisible` rather than a fixed-width pulse
  // block: same class stack gives the same height, and the real text reserves
  // the exact width too. A fixed-width placeholder still shifted the box
  // horizontally (measured 0.0566 residual). This matches the server-rendered
  // state, which is always signed-out.
  if (isLoading) {
    return (
      <div
        className={cn(baseClasses, variantClasses, className)}
        aria-hidden="true"
      >
        <LogIn className="h-4 w-4 opacity-0" />
        <span className="invisible">{signedOutLabel}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
        className={cn(baseClasses, variantClasses, className)}
      >
        <LogIn className="h-4 w-4" />
        {signedOutLabel}
      </Link>
    );
  }

  if (onAction) {
    return (
      <button
        onClick={onAction}
        className={cn(baseClasses, variantClasses, className)}
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Link
      href={actionHref}
      className={cn(baseClasses, variantClasses, className)}
    >
      {actionLabel}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
