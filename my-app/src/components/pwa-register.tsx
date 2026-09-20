"use client"

import { useEffect } from "react"

/**
 * PWARegister — registers the service worker for PWA installability.
 * ponytail: registers on mount, no extra state or event listeners needed.
 */
export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    // Dev cleanup: drop any stale worker left over from before sw.js
    // became a kill-switch — unregister without registering a new one,
    // so it can't cause HMR loops with skipWaiting + clients.claim.
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch(() => {
          // No stale worker — nothing to clean up
        })
      return
    }

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // Service worker registration failed — app still works without it
      })
  }, [])

  return null
}
