"use client"

import { useCallback } from "react"
import posthog from "posthog-js"

/**
 * useAnalytics — lightweight PostHog wrapper for client-side event tracking.
 *
 * Usage:
 *   const { capture, identify, reset, getFeatureFlag } = useAnalytics()
 *   capture("project_created", { projectId: "abc" })
 *   identify("auth0|123", { email: "a@b.com" })
 *
 * ponytail: wraps posthog-js directly, no extra abstractions.
 * posthog.capture() / .identify() / .reset() are idempotent no-ops
 * before init() completes, so no guard needed.
 */
export function useAnalytics() {
  const capture = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      posthog.capture(event, properties)
    },
    [],
  )

  const identify = useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      posthog.identify(userId, traits)
    },
    [],
  )

  const reset = useCallback(() => {
    posthog.reset()
  }, [])

  const getFeatureFlag = useCallback(
    (key: string, defaultValue?: string | boolean): string | boolean => {
      return posthog.getFeatureFlag(key) ?? defaultValue ?? false
    },
    [],
  )

  const getFeatureFlagPayload = useCallback(
    (key: string): unknown => {
      return posthog.getFeatureFlagPayload(key)
    },
    [],
  )

  return { capture, identify, reset, getFeatureFlag, getFeatureFlagPayload }
}
