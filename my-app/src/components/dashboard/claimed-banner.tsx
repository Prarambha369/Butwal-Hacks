"use client";

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState } from "react"
import { X, ShieldCheck } from "lucide-react"

function BannerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (searchParams.get("claimed") !== "true" || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    // Remove ?claimed from the URL without a full page reload
    const next = new URLSearchParams(searchParams.toString())
    next.delete("claimed")
    router.replace(`?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-status-green/30 bg-gradient-to-br from-status-green/[0.08] via-status-green/[0.04] to-transparent p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-green/20">
          <ShieldCheck className="h-5 w-5 text-status-green" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-status-green">Identity Claimed Successfully!</h3>
          <p className="mt-1 text-sm leading-relaxed text-primary/60">
            Your profile has been verified. Trust markers issued to you are now visible on your public
            profile. You can view them anytime at your profile page.
          </p>
          <a
            href={`/p/${searchParams.get("bh_id") || ""}`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-status-green transition-colors hover:text-status-green/70"
          >
            View my profile &rarr;
          </a>
        </div>

        <button
          onClick={dismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-hover text-primary/40 transition-colors hover:bg-surface-hover hover:text-primary/70"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Subtle accent bar at bottom */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-status-green/40 to-transparent" />
    </div>
  )
}

export default function ClaimedBanner() {
  return (
    <Suspense fallback={null}>
      <BannerContent />
    </Suspense>
  )
}
