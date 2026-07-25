"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { createClient } from "@/utils/supabase";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import {
  User,
  Users,
  Code2,
  CalendarDays,
  MapPin,
  KanbanSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

// ponytail: CSS transitions replace framer-motion (removed dep). Simple opacity/transform animations.

const ONBOARDING_TOUR_KEY = "bh-onboarding-tour-done";
const supabase = createClient();

type Role = "hacker" | "organizer";

interface StepConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  cta: string;
}

const HACKER_STEPS: StepConfig[] = [
  {
    title: "Complete Your Profile",
    description:
      "Set up your profile with your full name, bio, and social links to claim your unique BH-ID. This is your portable identity across the platform.",
    icon: <User className="w-5 h-5" />,
    href: "/dashboard/hacker/profile",
    cta: "Go to Profile",
  },
  {
    title: "Join or Create a Team",
    description:
      "Hackathons are better together. Find teammates through AI Team Match or create your own team for the next event.",
    icon: <Users className="w-5 h-5" />,
    href: "/teams",
    cta: "View Teams",
  },
  {
    title: "Submit Your First Project",
    description:
      "Upload a demo, link your GitHub repository, and showcase your work. Projects with verified trust markers get more visibility from recruiters.",
    icon: <Code2 className="w-5 h-5" />,
    href: "/dashboard/hacker/projects",
    cta: "Start Project",
  },
];

const ORGANIZER_STEPS: StepConfig[] = [
  {
    title: "Explore Your Events",
    description:
      "View and manage all your hackathon events from one place. Track registrations, update details, and publish new events.",
    icon: <CalendarDays className="w-5 h-5" />,
    href: "/dashboard/organizer/events",
    cta: "View Events",
  },
  {
    title: "Issue Trust Markers",
    description:
      "Award cryptographically signed trust markers to hackers for their achievements. Markers are permanently linked to their identity.",
    icon: <MapPin className="w-5 h-5" />,
    href: "/dashboard/organizer/issue-marker",
    cta: "Issue Marker",
  },
  {
    title: "Manage Team Work",
    description:
      "Use the Kanban board to organize tasks across your organizing team. Track progress, assign work, and meet deadlines.",
    icon: <KanbanSquare className="w-5 h-5" />,
    href: "/dashboard/organizer/work",
    cta: "Go to Work",
  },
];

const STEP_SETS: Record<Role, StepConfig[]> = {
  hacker: HACKER_STEPS,
  organizer: ORGANIZER_STEPS,
};

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

interface OnboardingTourProps {
  role?: Role;
}

export default function OnboardingTour({ role = "hacker" }: OnboardingTourProps) {
  const STEPS = STEP_SETS[role];
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [useAnchored, setUseAnchored] = useState(false);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(true);
  const mountedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: isAuthLoading } = useUser();

  // Trap Tab cycling within the tour card when visible
  useFocusTrap(cardRef, isVisible);

  const analytics = useAnalytics();

  // Persist completion to Supabase (fire-and-forget)
  const saveToSupabase = useCallback(async () => {
    const sub = user?.sub;
    if (!sub) return;
    try {
      await supabase
        .from("profiles")
        .update({ has_completed_onboarding: true })
        .eq("auth0_user_id", sub);

      analytics.capture("profile_completed", {
        source: "onboarding_tour",
        has_completed_onboarding: true,
      });
    } catch {
      // Silent fail — localStorage fallback is sufficient
    }
  }, [user?.sub, analytics]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    mountedRef.current = false;
    localStorage.setItem(ONBOARDING_TOUR_KEY, "true");
    saveToSupabase();
  }, [saveToSupabase]);

  const findAndMeasureTarget = useCallback((href: string) => {
    const link = document.querySelector(`a[href="${href}"]`) as HTMLElement | null;
    if (link && link.offsetParent !== null) {
      const rect = link.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      }
    }
    return null;
  }, []);

  const updatePosition = useCallback(() => {
    const rect = findAndMeasureTarget(STEPS[step].href);
    setTargetRect(rect);
    setUseAnchored(!!(rect && rect.left >= 0 && window.innerWidth >= 768));
  }, [step, STEPS, findAndMeasureTarget]);

  useEffect(() => {
    if (isAuthLoading) return;

    setIsMounted(true);
    mountedRef.current = true;
    const sub = user?.sub;

    const checkOnboardingStatus = async () => {
      const localDone = localStorage.getItem(ONBOARDING_TOUR_KEY);
      if (localDone === "true") {
        setIsCheckingSupabase(false);
        return;
      }

      if (sub) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("has_completed_onboarding")
            .eq("auth0_user_id", sub)
            .single();

          if (data?.has_completed_onboarding) {
            localStorage.setItem(ONBOARDING_TOUR_KEY, "true");
            setIsCheckingSupabase(false);
            return;
          }
        } catch {
          // Silent fail
        }
      }

      setIsCheckingSupabase(false);
      timerRef.current = setTimeout(() => setIsVisible(true), 800);
    };

    checkOnboardingStatus();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

  }, [isAuthLoading]);

  // Re-measure on visibility, step change, and resize
  useEffect(() => {
    if (!isVisible) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(updatePosition);
    });
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
    };

  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);

  }, [step]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  }, [step, STEPS.length, handleDismiss]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (!isMounted || isCheckingSupabase || !isVisible) return null;

  const current = STEPS[step];

  const tooltipLeft =
    targetRect && useAnchored ? targetRect.left + targetRect.width + 20 : null;
  const tooltipTop =
    targetRect && useAnchored
      ? targetRect.top + targetRect.height / 2
      : null;

  const tooltipOverflows =
    tooltipLeft !== null && tooltipLeft + 360 > window.innerWidth;

  const isAnchored = useAnchored && tooltipLeft !== null && tooltipTop !== null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-300"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Spotlight glow ring */}
      {targetRect && useAnchored && (
        <div
          className="fixed z-[45] pointer-events-none animate-in fade-in zoom-in-95 duration-300"
          style={{
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
          }}
        >
          <div className="absolute inset-0 rounded-lg bg-white/[0.07]" />
          <div
            className="absolute inset-0 rounded-lg ring-2 ring-primary-red/80"
            style={{
              boxShadow: "0 0 24px rgba(254,0,0,0.55)",
              animation: "pulse-glow 2.5s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Tour Card */}
      <div
        className="fixed z-50 animate-in fade-in zoom-in-95 duration-300"
        style={
          isAnchored
            ? ({
                top: tooltipTop!,
                left: tooltipOverflows ? "auto" : tooltipLeft!,
                right: tooltipOverflows ? 16 : "auto",
              } as React.CSSProperties)
            : {
                top: "50%",
                left: "50%",
              }
        }
      >
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-label="Onboarding tour"
          className="relative bh-card overflow-hidden w-[90vw] max-w-sm"
          style={
            isAnchored
              ? { transform: "translateY(-50%)" }
              : { transform: "translate(-50%, -50%)" }
          }
        >
          {/* Arrow pointer */}
          {isAnchored && !tooltipOverflows && (
            <span className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-3 h-3 bg-surface border-l border-t border-border rotate-[-45deg] z-10" />
          )}

          {/* Step indicator dots */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "bg-primary-red w-3"
                    : i < step
                      ? "bg-primary-red/40"
                      : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div
            key={step}
            className="transition-all duration-300 ease-out"
            style={{
              animation: "step-fade-in 0.3s ease-out",
            }}
          >
            <div className="px-6 pt-8 pb-2">
              <div className="w-12 h-12 rounded-xl bg-primary-red/10 flex items-center justify-center text-primary-red">
                {current.icon}
              </div>
            </div>

            <div className="px-6 pb-6 space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-mono font-bold text-primary-red uppercase tracking-wider">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h3 className="text-lg font-bold text-primary leading-tight">
                  {current.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface-hover/30">
            <button
              onClick={handleDismiss}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-full hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all shadow-[var(--bh-glow-red-soft)] hover:shadow-[var(--bh-glow-red)]"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={current.href}
                    onClick={handleDismiss}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all shadow-[var(--bh-glow-red-soft)] hover:shadow-[var(--bh-glow-red)]"
                  >
                    {current.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
