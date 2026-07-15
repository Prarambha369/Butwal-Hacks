"use client"

import { useState } from "react"
import { Github, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useRouter } from "next/navigation"

// ponytail: single-file button. Posts to /api/github/sync, shows result inline.
// No toast library needed — inline status messages are more accessible.

export default function GitHubSyncButton() {
  const { user } = useUser()
  const isSignedIn = !!user
  const router = useRouter()
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const [synced, setSynced] = useState(0)

  if (!isSignedIn) return null

  const handleSync = async () => {
    setState("loading")
    setMessage("Fetching your GitHub repos...")

    try {
      const res = await fetch("/api/github/sync", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setState("error")
        setMessage(data.error || "Sync failed")
        return
      }

      setState("done")
      setSynced(data.synced || 0)
      setMessage(data.message || "Sync complete!")
      router.refresh()
    } catch {
      setState("error")
      setMessage("Network error. Check your connection and try again.")
    }
  }

  const reset = () => {
    setState("idle")
    setMessage("")
    setSynced(0)
  }

  const isDone = state === "done"
  const isError = state === "error"
  const isLoading = state === "loading"

  return (
    <div className="space-y-3">
      <button
        onClick={isDone || isError ? reset : handleSync}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all
          ${isDone
            ? "bg-status-green/20 text-status-green border border-status-green/30 hover:bg-status-green/30"
            : isError
              ? "bg-primary-red/10 text-primary-red border border-primary-red/30 hover:bg-primary-red/20"
              : "bg-surface-hover border border-border text-primary hover:bg-surface/20 hover:border-primary-red/30"
          }
          disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
        `}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Github className="h-4 w-4" />
        )}
        {isLoading
          ? "Syncing..."
          : isDone
            ? `Imported ${synced} — Done`
            : isError
              ? "Try Again"
              : "Sync GitHub Repos"}
      </button>

      {message && (
        <p
          className={`text-xs ${
            isError ? "text-primary-red/80" : isDone ? "text-status-green/80" : "text-muted-foreground/60"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
