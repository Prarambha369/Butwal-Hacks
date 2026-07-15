"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  User,
  Building2,
  Code2,
  Award,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";
import {
  useOnboardingProgress,
  WIZARD_DISMISSED_KEY,
} from "@/hooks/use-onboarding-progress";

type Profile = {
  full_name?: string | null;
  bio?: string | null;
  socials?: Record<string, string> | null;
  xp?: number | null;
  trust_markers?: unknown[] | null;
};

interface OnboardingStepsProps {
  profile: Profile | null;
  projectCount: number;
  chapterCount: number;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  profile: <User className="w-5 h-5" />,
  chapter: <Building2 className="w-5 h-5" />,
  project: <Code2 className="w-5 h-5" />,
  marker: <Award className="w-5 h-5" />,
};

/**
 * OnboardingSteps — inline onboarding checklist embedded in the dashboard page.
 * Shows progress, step-by-step tasks with their status, and a skip button.
 * This replaces the old modal-based FirstRunWizard for the main /dashboard page.
 */
export function OnboardingSteps({
  profile,
  projectCount,
  chapterCount,
}: OnboardingStepsProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(WIZARD_DISMISSED_KEY);
    if (stored === "true") setIsDismissed(true);
  }, []);

  const {
    steps,
    completedCount,
    totalCount,
    allComplete,
    progress,
    currentStepIndex,
  } = useOnboardingProgress(profile, chapterCount, projectCount);

  const handleDismiss = () => {
    localStorage.setItem(WIZARD_DISMISSED_KEY, "true");
    setIsDismissed(true);
  };

  const handleReset = () => {
    localStorage.removeItem(WIZARD_DISMISSED_KEY);
    setIsDismissed(false);
  };

  // Don't render until hydrated on client
  if (!isMounted) return null;
  if (isDismissed) {
    return (
      <div className="bh-card p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-bold text-primary">Onboarding dismissed</p>
              <p className="text-xs text-muted-foreground">
                You can always revisit the onboarding steps.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-xs font-bold text-primary-red hover:text-deep-red transition-colors"
          >
            Show again
          </button>
        </div>
      </div>
    );
  }

  if (allComplete) {
    return (
      <div className="bh-card border border-status-green/20 overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-status-green/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-status-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-primary">
                All done! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                You&apos;ve completed all {totalCount} onboarding steps. Your profile is ready to go.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Link
                  href="/dashboard/hacker"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all"
                >
                  Go to Dashboard <ArrowRight className="w-3 h-3" />
                </Link>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bh-card overflow-hidden">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-red/10">
              <Sparkles className="w-5 h-5 text-primary-red" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">
                Get Started — {completedCount} of {totalCount} done
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete these steps to get started
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors"
            aria-label="Skip onboarding"
            title="Skip for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-red rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {completedCount >= totalCount - 1 && !allComplete && (
          <p className="mt-2 text-[11px] text-primary-red/70 font-medium">
            One more step — you&apos;re almost there!
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {steps.map((step, i) => {
          const isCurrent = i === currentStepIndex;
          const isComplete = step.isComplete;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-4 p-4 md:p-5 transition-all",
                isCurrent && "bg-primary-red/[0.03]",
                isComplete && "opacity-60"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isComplete && "bg-status-green/20 text-status-green",
                  isCurrent && "bg-primary-red text-white",
                  !isComplete && !isCurrent && "bg-surface-hover text-muted-foreground border border-border"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  STEP_ICONS[step.id] ?? <User className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isComplete ? "text-primary/60" : "text-primary"
                    )}
                  >
                    {step.title}
                  </span>
                  {isComplete && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-status-green bg-status-green/10 px-1.5 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary-red bg-primary-red/10 px-1.5 py-0.5 rounded-full">
                      Next
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs leading-relaxed mt-0.5",
                    isComplete ? "text-primary/30" : "text-muted-foreground"
                  )}
                >
                  {step.description}
                </p>
              </div>

              {/* CTA */}
              <div className="shrink-0">
                {isComplete ? (
                  <div className="w-8 h-8 rounded-lg bg-status-green/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-status-green" />
                  </div>
                ) : (
                  <Link
                    href={step.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-full transition-all",
                      isCurrent
                        ? "bg-primary-red text-white hover:bg-deep-red shadow-[--bh-glow-red-soft]"
                        : "bg-surface-hover text-muted-foreground border border-border hover:text-primary"
                    )}
                  >
                    {step.cta}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 md:p-5 border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/40">
          {completedCount}/{totalCount} steps completed
        </p>
        <button
          onClick={handleDismiss}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
