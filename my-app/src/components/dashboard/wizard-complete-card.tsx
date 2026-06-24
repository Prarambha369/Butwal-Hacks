"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Sparkles,
  Trophy,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react";

interface WizardCompleteCardProps {
  completedCount: number;
  totalCount: number;
  projectCount: number;
  trustMarkerCount: number;
  onDismiss: () => void;
}

/**
 * WizardCompleteCard — a celebratory summary shown when all onboarding steps
 * are marked complete. Briefly celebrates the user's progress before they
 * dismiss it and dive into the dashboard.
 */
export function WizardCompleteCard({
  completedCount,
  totalCount,
  projectCount,
  trustMarkerCount,
  onDismiss,
}: WizardCompleteCardProps) {
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check reduced motion preference once, synchronously, before any effects
  const motionRef = useRef(false);

  useEffect(() => {
    motionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(motionRef.current);
    document.body.style.overflow = "hidden";

    timerRef.current = setTimeout(
      () => setPhase("idle"),
      motionRef.current ? 100 : 600
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.body.style.overflow = "";
    };
  }, []);  

  // Escape key dismisses — use ref to avoid stale closures
  const dismissRef = useRef<(() => void) | null>(null);
  const handleDismiss = useCallback(() => {
    setPhase("exit");
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  // Sync ref with handler — must be in effect to avoid ref access during render
  useEffect(() => {
    dismissRef.current = handleDismiss;
  }, [handleDismiss]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50",
          phase === "exit" && "opacity-0 transition-opacity duration-200"
        )}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Onboarding complete"
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm",
          reducedMotion
            ? ""
            : phase === "enter"
            ? "animate-in fade-in zoom-in-95 duration-500 ease-out"
            : phase === "exit"
            ? "animate-out fade-out zoom-out-95 duration-200"
            : ""
        )}
      >
        <div className="bh-card border border-primary-red/20 overflow-hidden">
          {/* Hero section */}
          <div className="relative px-6 pt-10 pb-8 text-center">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary-red/10 rounded-full blur-3xl" />

            {/* Checkmark with glow */}
            <div
              className={cn(
                "mx-auto w-16 h-16 rounded-full bg-status-green flex items-center justify-center relative",
                reducedMotion
                  ? ""
                  : phase === "enter"
                  ? "animate-in zoom-in-100 duration-300 delay-150 fill-mode-backwards"
                  : ""
              )}
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
              <div className="absolute inset-0 rounded-full bg-status-green/30 blur-md -z-10" />
            </div>

            <h2
              className={cn(
                "mt-6 text-2xl font-bold tracking-tight",
                reducedMotion
                  ? ""
                  : phase === "enter"
                  ? "animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-backwards"
                  : ""
              )}
            >
              You&apos;re all set!
            </h2>
            <p
              className={cn(
                "mt-2 text-sm text-muted-foreground max-w-xs mx-auto",
                reducedMotion
                  ? ""
                  : phase === "enter"
                  ? "animate-in fade-in slide-in-from-bottom-2 duration-300 delay-250 fill-mode-backwards"
                  : ""
              )}
            >
              You&apos;ve completed all {totalCount} onboarding steps. Your
              hacker profile is ready to go.
            </p>

            {/* Stats row */}
            <div
              className={cn(
                "mt-8 grid grid-cols-3 gap-3",
                reducedMotion
                  ? ""
                  : phase === "enter"
                  ? "animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300 fill-mode-backwards"
                  : ""
              )}
            >
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-surface-hover">
                <Zap className="w-4 h-4 text-status-yellow" />
                <span className="text-lg font-bold font-mono text-primary">
                  {completedCount}
                </span>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                  Steps
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-surface-hover">
                <Trophy className="w-4 h-4 text-primary-red" />
                <span className="text-lg font-bold font-mono text-primary">
                  {projectCount}
                </span>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                  Projects
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-surface-hover">
                <Target className="w-4 h-4 text-status-blue" />
                <span className="text-lg font-bold font-mono text-primary">
                  {trustMarkerCount}
                </span>
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                  Markers
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-center">
            <button
              onClick={handleDismiss}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-bh-red-500 text-white text-sm font-bold hover:bg-deep-red transition-all active:scale-[0.97]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ready, go!</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
