"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, AlertCircle, LogIn } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { cn } from "@/lib/utils"
import { RoseSpinner } from "@/components/ui/rose-loader";

interface Props {
  eventId: string
  eventSlug: string
}

export default function EventRegisterButton({ eventId, eventSlug }: Props) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useUser()
  const [state, setState] = useState<"idle" | "loading" | "registered" | "error">("idle")
  const [message, setMessage] = useState("")

  const isSignedIn = !!user

  const handleRegister = async () => {
    if (!isSignedIn) {
      router.push("/sign-in?returnTo=/events/" + eventSlug)
      return
    }

    setState("loading")
    setMessage("Registering...")

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setState("error")
        setMessage(data.error || "Registration failed")
        return
      }

      setState("registered")
      setMessage(data.message || "You're registered!")
      router.refresh()
    } catch {
      setState("error")
      setMessage("Network error. Please try again.")
    }
  }

  if (authLoading) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-surface/20 text-muted-foreground font-bold text-sm transition-all cursor-not-allowed"
      >
        <RoseSpinner size="sm" />
        Checking...
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleRegister}
        disabled={state === "loading" || state === "registered"}
        className={cn(
          "inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-sm transition-all active:scale-95",
          state === "registered"
            ? "bg-status-green/20 text-status-green border border-status-green/30 cursor-default"
            : state === "error"
              ? "bg-primary-red/10 text-primary-red border border-primary-red/30 hover:bg-primary-red/20"
              : "bg-deep-red hover:bg-primary-red text-white ",
        )}
      >
        {state === "loading" ? (
          <RoseSpinner size="sm" />
        ) : state === "registered" ? (
          <CheckCircle className="w-5 h-5" />
        ) : state === "error" ? (
          <AlertCircle className="w-5 h-5" />
        ) : !isSignedIn ? (
          <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
        ) : null}
        {state === "loading"
          ? "Registering..."
          : state === "registered"
            ? "Registered!"
            : state === "error"
              ? "Try Again"
              : !isSignedIn
                ? "Sign in to Register"
                : "Register Now"}
      </button>
      {message && (
        <p
          className={cn(
            "text-xs text-center",
            state === "error" ? "text-primary-red/80" : "text-status-green/80",
          )}
        >
          {message}
        </p>
      )}
    </div>
  )
}
