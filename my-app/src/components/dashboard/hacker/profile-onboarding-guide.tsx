"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Sparkles, Upload, User, AlignLeft, Link2, ChevronRight, X, ArrowRight } from "lucide-react"
import Link from "next/link"

const PROFILE_GUIDE_DISMISSED_KEY = "bh:profile-guide-dismissed"

interface ProfileOnboardingGuideProps {
  fullName: string | null | undefined
  bio: string | null | undefined
  avatarUrl: string | null | undefined
  socials: Record<string, string> | null | undefined
  bhId: string | null | undefined
}

interface Substeps {
  avatar: boolean
  name: boolean
  bio: boolean
  socials: boolean
}

const subStepConfig = [
  {
    id: "avatar" as const,
    label: "Upload avatar",
    icon: <Upload className="w-4 h-4" />,
    description: "Add a profile picture so people can recognize you.",
  },
  {
    id: "name" as const,
    label: "Set your name",
    icon: <User className="w-4 h-4" />,
    description: "Use your real name or a consistent handle.",
  },
  {
    id: "bio" as const,
    label: "Write a bio",
    icon: <AlignLeft className="w-4 h-4" />,
    description: "Tell the community what you build and what you're passionate about.",
  },
  {
    id: "socials" as const,
    label: "Link accounts",
    icon: <Link2 className="w-4 h-4" />,
    description: "Connect GitHub, LinkedIn, or your portfolio.",
  },
]

export default function ProfileOnboardingGuide({
  fullName,
  bio,
  avatarUrl,
  socials,
  bhId,
}: ProfileOnboardingGuideProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [completed, setCompleted] = useState<Substeps>(() => ({
    avatar: !!avatarUrl,
    name: !!fullName && fullName !== "New Hacker",
    bio: !!bio,
    socials: !!socials && Object.values(socials).some(Boolean),
  }))

  // Hydration-safe mount + check dismissal
  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem(PROFILE_GUIDE_DISMISSED_KEY)
    if (stored === "true") setIsDismissed(true)
  }, [])

  // Live-track substep completion
  useEffect(() => {
    setCompleted({
      avatar: !!avatarUrl,
      name: !!fullName && fullName !== "New Hacker",
      bio: !!bio,
      socials: !!socials && Object.values(socials).some(Boolean),
    })
  }, [avatarUrl, fullName, bio, socials])

  const completedCount = useMemo(
    () => Object.values(completed).filter(Boolean).length,
    [completed]
  )
  const totalCount = subStepConfig.length
  const allComplete = completedCount === totalCount
  const progress = Math.round((completedCount / totalCount) * 100)

  const handleDismiss = useCallback(() => {
    localStorage.setItem(PROFILE_GUIDE_DISMISSED_KEY, "true")
    setIsDismissed(true)
  }, [])

  // Don't render until hydrated
  if (!isMounted) return null
  if (isDismissed) return null

  // If all complete, show celebration card (auto-dismissable)
  if (allComplete) {
    return (
      <div className="bh-card border border-status-green/20 overflow-hidden relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-status-green/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-status-green" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary">Profile complete!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your profile is ready. Head back to the dashboard to continue onboarding.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Link
                href="/dashboard/hacker"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all"
              >
                Back to Dashboard <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        <div className="h-1 w-full bg-surface-hover">
          <div className="h-full bg-status-green rounded-full" style={{ width: "100%" }} />
        </div>
      </div>
    )
  }

  return (
    <div className="bh-card border border-primary-red/15 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-red/10">
              <Sparkles className="w-4 h-4 text-primary-red" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Set up your profile</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {completedCount} of {totalCount} done — fill in the fields below
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors"
            aria-label="Dismiss profile guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-bh-red-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Substep checklist */}
      <div className="divide-y divide-border">
        {subStepConfig.map((step) => {
          const isComplete = completed[step.id]

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 px-4 md:px-5 py-3 transition-all",
                isComplete && "opacity-50"
              )}
            >
              {/* Status icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isComplete
                    ? "bg-status-green/20 text-status-green"
                    : "bg-surface-hover text-muted-foreground border border-border"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      isComplete ? "text-primary/60" : "text-primary"
                    )}
                  >
                    {step.label}
                  </span>
                  {isComplete && (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-status-green bg-status-green/10 px-1.5 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-[10px] leading-relaxed mt-0.5",
                    isComplete ? "text-primary/30" : "text-muted-foreground"
                  )}
                >
                  {step.description}
                </p>
              </div>

              {!isComplete && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {!allComplete && (
        <div className="px-4 md:px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/40">
            BH-ID: {bhId || "—"}
          </p>
          <button
            onClick={handleDismiss}
            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Skip guide
          </button>
        </div>
      )}
    </div>
  )
}
