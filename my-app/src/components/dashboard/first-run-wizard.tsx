"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  User,
  Building2,
  Code2,
  Award,
  Sparkles,
  X,
  ChevronRight,
} from "lucide-react";
import {
  useOnboardingProgress,
  type StepState,
  WIZARD_DISMISSED_KEY,
} from "@/hooks/use-onboarding-progress";
import { useAnalytics } from "@/hooks/use-analytics";
import { WizardStepItem } from "@/components/dashboard/wizard-step-item";
import { WizardCompleteCard } from "@/components/dashboard/wizard-complete-card";

type Profile = {
  full_name?: string | null;
  bio?: string | null;
  socials?: Record<string, string> | null;
  xp?: number | null;
  trust_markers?: unknown[] | null;
};

interface FirstRunWizardProps {
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

export default function FirstRunWizard({
  profile,
  projectCount,
  chapterCount,
}: FirstRunWizardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { capture } = useAnalytics();

  const {
    steps,
    completedCount,
    totalCount,
    allComplete,
    progress,
    currentStepIndex,
  } = useOnboardingProgress(profile, chapterCount, projectCount);

  // Hydration-safe: only show after mount
  useEffect(() => {
    const stored = localStorage.getItem(WIZARD_DISMISSED_KEY);
    if (stored === "true") {
      capture("wizard_already_dismissed");
      setIsDismissed(true);
      return;
    }

    capture("wizard_shown", { completedCount });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);

    // Lock body scroll
    document.body.style.overflow = "hidden";

    // Small delay so elements mount before animating in
    const timer = setTimeout(() => setIsVisible(true), 400);
    return () => {
      clearTimeout(timer);
      mq.removeEventListener("change", handler);
      document.body.style.overflow = "";
    };
  }, []);  

  // Stable ref so Escape key listener doesn't re-register on every step
  const dismissRef = useRef<() => void>(() => {});

  const handleDismiss = useCallback(() => {
    capture("wizard_dismissed", {
      completedCount,
      totalCount,
      progress,
    });
    localStorage.setItem(WIZARD_DISMISSED_KEY, "true");
    setIsVisible(false);
    setShowCelebration(false);
  }, [capture, completedCount, totalCount, progress]);

  // Sync ref with handler — must be in effect to avoid ref access during render
  useEffect(() => {
    dismissRef.current = handleDismiss;
  }, [handleDismiss]);

  // Escape key dismisses the wizard
  useEffect(() => {
    if (!isVisible || isDismissed) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isVisible, isDismissed]);

  // Track progress when steps complete
  useEffect(() => {
    if (!isVisible || isDismissed) return;
    if (completedCount > 0) {
      capture("wizard_progress", { completedCount, totalCount, progress });
    }
  }, [completedCount]);  

  // When all steps become complete, show celebration
  useEffect(() => {
    if (allComplete && isVisible && !showCelebration) {
      capture("wizard_completed", { completedCount, totalCount });
      // Brief delay after steps complete before celebration appears
      const timer = setTimeout(() => setShowCelebration(true), 500);
      return () => clearTimeout(timer);
    }
  }, [allComplete, isVisible, showCelebration, completedCount, totalCount]);  

  // Nothing to show if dismissed or all-complete celebration is showing
  if (isDismissed) return null;
  if (allComplete && showCelebration) {
    return (
      <WizardCompleteCard
        completedCount={completedCount}
        totalCount={totalCount}
        projectCount={projectCount}
        trustMarkerCount={profile?.trust_markers?.length ?? 0}
        onDismiss={handleDismiss}
      />
    );
  }
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50",
          reducedMotion ? "" : "animate-in fade-in duration-300"
        )}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Wizard Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Onboarding wizard"
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg",
          reducedMotion ? "" : "animate-in fade-in zoom-in-95 duration-300"
        )}
      >
        <div className="bh-card shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary-red/10">
                  <Sparkles className="w-5 h-5 text-primary-red" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">
                    {completedCount > 0
                      ? "Keep going, you&apos;re doing great!"
                      : "Welcome to Butwal Hacks!"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedCount > 0
                      ? `${completedCount} of ${totalCount} steps done`
                      : "Let&apos;s get you started in 4 quick steps"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors"
                aria-label="Dismiss wizard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-bh-red-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* "Almost there" hint */}
            {completedCount >= totalCount - 1 && !allComplete && (
              <p className="mt-3 text-[11px] text-primary-red/70 font-medium text-center">
                One more step — you&apos;re almost ready to go!
              </p>
            )}
          </div>

          {/* Steps */}
          <div className="px-6 py-4 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {steps.map((step, i) => {
              const stepState: StepState = step.isComplete
                ? "completed"
                : i === currentStepIndex
                ? "current"
                : "pending";

              return (
                <WizardStepItem
                  key={step.id}
                  icon={STEP_ICONS[step.id] ?? <User className="w-5 h-5" />}
                  title={step.title}
                  description={step.description}
                  cta={step.cta}
                  href={step.href}
                  state={stepState}
                />
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground/40">
              {completedCount}/{totalCount} steps completed
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDismiss}
                className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                Skip for now
              </button>
              {currentStepIndex >= 0 && (
                <Link
                  href={steps[currentStepIndex].href}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-bh-red-500 text-white text-xs font-bold hover:bg-deep-red transition-all"
                >
                  <span>{steps[currentStepIndex].cta}</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
