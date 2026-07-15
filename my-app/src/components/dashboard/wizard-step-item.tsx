import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle2, ArrowRight } from "lucide-react";
import type { StepState } from "@/hooks/use-onboarding-progress";

interface WizardStepItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
  state: StepState;
}

/**
 * WizardStepItem — a single step row in the onboarding wizard checklist.
 * Renders differently depending on state (pending / current / completed).
 */
export function WizardStepItem({
  icon,
  title,
  description,
  cta,
  href,
  state,
}: WizardStepItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg transition-all duration-300",
        state === "completed" && "opacity-50",
        state === "current" && "bg-primary-red/5 border border-primary-red/15"
      )}
    >
      {/* Step icon circle */}
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
          state === "completed" && "bg-status-green/20 text-status-green",
          state === "current" && "bg-bh-red-500 text-white",
          state === "pending" && "bg-surface-hover text-muted-foreground border border-border"
        )}
      >
        {state === "completed" ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          icon
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              "text-sm font-bold",
              state === "completed" && "text-primary/60",
              state === "current" && "text-primary",
              state === "pending" && "text-primary/40"
            )}
          >
            {title}
          </span>
          {state === "completed" && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-status-green bg-status-green/10 px-1.5 py-0.5 rounded-full">
              Done
            </span>
          )}
          {state === "current" && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary-red bg-primary-red/10 px-1.5 py-0.5 rounded-full">
              Next
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-xs leading-relaxed",
            state === "completed" && "text-primary/30",
            state !== "completed" && "text-muted-foreground"
          )}
        >
          {description}
        </p>
      </div>

      {/* Action button */}
      <div className="shrink-0">
        {state === "completed" ? (
          <div className="w-8 h-8 rounded-lg bg-status-green/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-status-green" />
          </div>
        ) : (
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all duration-200",
              state === "current"
                ? "rounded-full bg-bh-red-500 text-white hover:bg-deep-red"
                : "rounded-lg bg-surface-hover text-muted-foreground hover:text-primary border border-border"
            )}
          >
            <span>{cta}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
