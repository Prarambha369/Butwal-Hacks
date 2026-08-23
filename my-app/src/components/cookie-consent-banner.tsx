"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { X, Cookie, Shield } from "lucide-react";

const CONSENT_KEY = "bh:cookie-consent";
const CONSENT_GRANTED = "granted";
const CONSENT_DENIED = "denied";

/**
 * Check whether the user has granted cookie consent.
 * Can be called from anywhere to gate analytics initialization.
 */
export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(CONSENT_KEY);
  return stored === CONSENT_GRANTED;
}

/**
 * CookieConsentBanner — GDPR-compliant consent banner.
 *
 * Shows at the bottom of the page until the user accepts or denies.
 * Once accepted, PostHog (and other analytics) may initialize.
 * Stores preference in localStorage so it only shows once per decision.
 *
 * Usage: render once at the layout level, outside any provider that
 * depends on cookie consent.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === CONSENT_GRANTED || stored === CONSENT_DENIED) {
      setDismissed(true);
      return;
    }
    // Slight delay so banner slides in after page paint
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, CONSENT_GRANTED);
    setVisible(false);
    setDismissed(true);
    // Dispatch event so PostHog provider can initialize
    window.dispatchEvent(new CustomEvent("bh:consent-granted"));
  }, []);

  const handleDeny = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, CONSENT_DENIED);
    setVisible(false);
    setDismissed(true);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[100] p-4 pb-20 md:p-6 md:pb-6 transition-all duration-500 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      )}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative rounded-xl border border-border bg-surface p-5 md:p-6 shadow-xl">
          {/* Close button */}
          <button
            onClick={handleDeny}
            className="absolute right-3 top-3 min-w-[44px] min-h-[44px] p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors flex items-center justify-center"
            aria-label="Dismiss cookie notice"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary-red/10 items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-primary-red" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Cookie className="w-4 h-4 text-primary-red sm:hidden" />
                <p className="text-sm font-bold text-primary">This site uses cookies</p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                We use essential and analytics cookies to improve your experience.
                Analytics (PostHog) only activate with your consent.
                <Link
                  href="/cookie-policy"
                  className="inline-flex items-center gap-1 ml-1 text-primary-red hover:underline font-medium"
                >
                  <Shield className="w-3 h-3" />
                  Learn more
                </Link>
              </p>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleAccept}
                  className="inline-flex items-center gap-1.5 rounded-full bg-bh-red-500 px-5 py-2 text-xs font-bold text-white hover:bg-deep-red transition-all active:scale-95"
                >
                  Accept All
                </button>
                <button
                  onClick={handleDeny}
                  className="rounded-full border border-border px-5 py-2 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-surface-hover transition-all active:scale-95"
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
