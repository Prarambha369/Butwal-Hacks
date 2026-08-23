"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useOnboardingProgress,
  WIZARD_DISMISSED_KEY,
} from "@/hooks/use-onboarding-progress";
import { ArrowRight, X, Sparkles } from "lucide-react";

type SlimProfile = {
  full_name?: string | null;
  bio?: string | null;
  socials?: Record<string, string> | null;
  xp?: number | null;
  trust_markers?: unknown[] | null;
};

interface OnboardingProgressWidgetProps {
  profile: SlimProfile | null;
  chapterCount?: number;
  projectCount?: number;
}

/**
 * OnboardingProgressWidget — compact sidebar widget showing onboarding
 * completion as a progress bar with percentage. Clicking "Continue" or
 * the step name takes the user to the next incomplete step.
 *
 * Syncs dismissal state (localStorage) with the full onboarding card
 * on /dashboard so dismissing one hides both.
 */
export default function OnboardingProgressWidget({
  profile,
  chapterCount = 0,
  projectCount = 0,
}: OnboardingProgressWidgetProps) {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(WIZARD_DISMISSED_KEY);
    setIsDismissed(stored === "true");
  }, []);

  const { progress, completedCount, totalCount, allComplete, steps, currentStepIndex } =
    useOnboardingProgress(profile, chapterCount, projectCount);

  if (!isMounted) return null;
  if (isDismissed || allComplete) return null;

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  return (
    <div className="px-3 py-4 border-b border-border">
      <div className="rounded-lg bg-bh-red-500/5 border border-bh-red-500/15 p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-red" />
            <span className="text-[11px] font-bold text-primary">
              Onboarding
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold text-primary-red">
              {progress}%
            </span>
            <button
              onClick={() => {
                localStorage.setItem(WIZARD_DISMISSED_KEY, "true");
                setIsDismissed(true);
              }}
              className="p-0.5 rounded hover:bg-bh-red-500/10 text-muted-foreground hover:text-primary-red transition-colors"
              aria-label="Dismiss onboarding widget"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-red rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step count */}
        <p className="text-[10px] text-muted-foreground font-mono">
          {completedCount} of {totalCount} steps
        </p>

        {/* Next step CTA */}
        {currentStep && (
          <Link
            href={currentStep.href}
            className="flex items-center justify-center gap-1 w-full py-1.5 rounded-md bg-primary-red text-white text-[10px] font-bold hover:bg-deep-red transition-all active:scale-[0.97]"
          >
            {currentStep.title}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
