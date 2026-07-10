"use client"

import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-bh-red-500/10">
        <WifiOff className="h-8 w-8 text-bh-red-500" aria-hidden="true" />
      </div>
      <h1 className="mt-8 text-3xl font-extrabold text-primary md:text-4xl">
        You&apos;re Offline
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-secondary">
        Butwal Hacks needs an internet connection to load the latest content.
        Please check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_var(--glow-bh-red)] transition-all hover:bg-bh-red-600"
      >
        Try Again
      </button>
    </main>
  )
}
