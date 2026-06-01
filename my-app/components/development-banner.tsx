"use client"

import { useState } from "react"
import { X, AlertCircle } from "lucide-react"

export function DevelopmentBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return null
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-yellow-400/30 bg-linear-to-r from-yellow-50 to-amber-50 px-4 py-3 dark:from-yellow-950/40 dark:to-amber-950/40 dark:border-yellow-600/30 shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/60">
            <AlertCircle className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
              This site is in development
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200/80">
              All data shown here are placeholders and subject to change.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-yellow-700 transition-colors hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/60"
          aria-label="Dismiss development banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
