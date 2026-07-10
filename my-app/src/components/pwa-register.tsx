"use client"

import { useEffect } from "react"

/**
 * PWARegister — registers the service worker for PWA installability.
 * ponytail: registers on mount, no extra state or event listeners needed.
 */
export default function PWARegister() {
  useEffect(() => {
    // Skip SW registration in dev mode — it causes HMR loops with skipWaiting + clients.claim
    if (process.env.NODE_ENV === "development") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // Service worker registration failed — app still works without it
      })
  }, [])

  return null
}
