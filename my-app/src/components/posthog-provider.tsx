"use client"

import posthog from "posthog-js"
import { useEffect, Suspense, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { usePathname, useSearchParams } from "next/navigation"
import { hasCookieConsent } from "@/components/cookie-consent-banner"

/**
 * PostHogProvider — enhanced client-side PostHog integration.
 *
 * Features:
 * - Waits for cookie consent before initializing PostHog
 * - Identifies users when Auth0 session changes
 * - Captures page views on route changes
 * - Supports feature flags
 *
 * ponytail: single useEffect with cleanup, no complex state.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PostHogInner>{children}</PostHogInner>
    </Suspense>
  )
}

function PostHogInner({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Track consent state — re-check when consent-granted event fires
  const [consentGranted, setConsentGranted] = useState(false)

  // Listen for cookie consent and check initial state
  useEffect(() => {
    // Check initial consent state (may already be stored)
    if (hasCookieConsent()) {
      setConsentGranted(true)
      return
    }

    // Listen for consent from the banner
    const handler = () => setConsentGranted(true)
    window.addEventListener("bh:consent-granted", handler)
    return () => window.removeEventListener("bh:consent-granted", handler)
  }, [])

  // Initialize PostHog once consent is granted
  useEffect(() => {
    if (!consentGranted) return

    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
    if (!token) {
      if (process.env.NODE_ENV === "development") {
        console.info("[PostHog] Skipping init — no token configured")
      }
      return
    }

    if (!posthog.__loaded) {
      posthog.init(token, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: false, // we handle page views manually with pathname changes
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") ph.opt_out_capturing()
        },
      })
    }
  }, [consentGranted])

  // Identify user when Auth0 session changes
  useEffect(() => {
    if (isLoading || !posthog.__loaded) return

    if (user?.sub) {
      posthog.identify(user.sub, {
        email: user.email,
        name: user.name,
      })
    } else {
      posthog.reset()
    }
  // ponytail: user.email and user.name are stable alongside user.sub — omitting from deps avoids redundant re-identify
  }, [user?.sub, isLoading])

  // Capture page views on route changes
  useEffect(() => {
    if (!posthog.__loaded) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
    posthog.capture("$pageview", {
      $current_url: url,
      pathname,
      search: searchParams?.toString() || null,
    })
  }, [pathname, searchParams])

  return <>{children}</>
}
