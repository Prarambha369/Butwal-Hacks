"use client"

import { useEffect, useRef, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * NetworkStatus — shows a top banner when the user goes offline and
 * a brief "Back Online" toast-style notification when connectivity returns.
 *
 * ponytail: one state, one effect. No interval polling — uses native events.
 */
export default function NetworkStatus() {
  const [online, setOnline] = useState(true)
  const [showBackOnline, setShowBackOnline] = useState(false)
  const backOnlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Initialize with current state
    setOnline(navigator.onLine)

    const handleOnline = () => {
      setOnline(true)
      setShowBackOnline(true)
      backOnlineTimer.current = setTimeout(() => setShowBackOnline(false), 3000)
    }

    const handleOffline = () => {
      setOnline(false)
      setShowBackOnline(false)
      if (backOnlineTimer.current) {
        clearTimeout(backOnlineTimer.current)
        backOnlineTimer.current = null
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (backOnlineTimer.current) {
        clearTimeout(backOnlineTimer.current)
      }
    }
  }, [])

  // Don't render anything if online (the "Back Online" message is shown briefly)
  if (online && !showBackOnline) return null

  return (
    <>
      {/* Offline Banner */}
      {!online && (
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2",
            "bg-status-yellow/90 text-bg-base text-xs font-bold",
            "px-4 py-2 shadow-lg animate-in slide-in-from-top duration-300",
          )}
          role="alert"
        >
          <WifiOff className="w-3.5 h-3.5" />
          You are offline — some features may be unavailable
        </div>
      )}

      {/* Back Online Toast */}
      {showBackOnline && (
        <div
          className={cn(
            "fixed top-4 right-4 z-[60] flex items-center gap-2",
            "bg-status-green/90 text-white text-xs font-bold",
            "px-4 py-2.5 rounded-lg shadow-lg animate-in slide-in-from-top duration-300",
          )}
          role="status"
        >
          <Wifi className="w-3.5 h-3.5" />
          Back Online
        </div>
      )}
    </>
  )
}
