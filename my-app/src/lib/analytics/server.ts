import { PostHog } from "posthog-node"

/**
 * Server-side PostHog client singleton.
 * Used in API routes and server actions to capture backend events.
 *
 * ponytail: lazily initialized singleton — no module-level side effects.
 * Returns null if the API key is not configured (local dev without PostHog).
 */
let _client: PostHog | null = null

function getServerClient(): PostHog | null {
  if (_client) return _client

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[analytics/server] Skipping init — no token configured")
    }
    return null
  }

  _client = new PostHog(apiKey, {
    host,
    // ponytail: disable in dev to avoid polluting PostHog dashboards
    disableGeoip: process.env.NODE_ENV === "development",
  })

  return _client
}

/**
 * Capture a server-side event.
 * Safe to call without checking for null — silently no-ops if unconfigured.
 */
export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const client = getServerClient()
  if (!client) return

  try {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        // ponytail: include environment context for dashboard filtering
        $environment: process.env.NODE_ENV || "production",
      },
    })
    // Flush immediately to ensure delivery in serverless context
    await client.flush()
  } catch (error) {
    // ponytail: silently fail in production — analytics shouldn't break the app
    if (process.env.NODE_ENV === "development") {
      console.error("[analytics/server] Failed to capture event:", error)
    }
  }
}

/**
 * Identify a user on the server side.
 */
export async function identifyServerUser(
  distinctId: string,
  traits?: Record<string, unknown>,
): Promise<void> {
  const client = getServerClient()
  if (!client) return

  try {
    client.identify({
      distinctId,
      properties: {
        ...traits,
        $environment: process.env.NODE_ENV || "production",
      },
    })
    await client.flush()
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[analytics/server] Failed to identify user:", error)
    }
  }
}

/**
 * Gracefully shut down the PostHog client.
 * 
 * ponytail: In serverless (Vercel), there's no app shutdown event,
 * so this function is a no-op in practice. It exists for standalone
 * Node.js deployments or worker shutdown hooks.
 */
export async function shutdownAnalytics(): Promise<void> {
  if (_client) {
    await _client.shutdown()
    _client = null
  }
}
