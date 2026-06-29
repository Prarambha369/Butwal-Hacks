"use client"

import { useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { createClient } from "@/utils/supabase/client"
import { useSyncExternalStore } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"

/**
 * Tracks online users via Supabase Realtime presence.
 *
 * Returns a Set of Auth0 user IDs (e.g. "auth0|abc123") that are currently online.
 * Calling components check if a given profile's auth0_user_id is in the set.
 *
 * Uses a module-level singleton channel so multiple components calling this
 * hook on the same page share one channel subscription (avoids the
 * "cannot add presence callbacks after subscribe" error).
 *
 * Features:
 * - Subscribes to the presence channel even for non-logged-in visitors,
 *   so everyone can see who's online.
 * - Only tracks (broadcasts) presence if the user IS signed in.
 * - ponytail: Heartbeat removed — was polling POST /api/heartbeat every 2 min,
 *   burning serverless quota for no MVP value. PostHog tracks sessions instead.
 */

// ── Module-level singleton ─────────────────────────────────────
let sharedChannel: RealtimeChannel | null = null
let sharedOnlineIds = new Set<string>()
const listeners = new Set<() => void>()

function emitChange() {
  for (const fn of listeners) fn()
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

function getSnapshot(): Set<string> {
  return sharedOnlineIds
}

function initChannel(userId?: string) {
  if (sharedChannel) return

  // Skip if WebSocket is not available (e.g., test environment, restricted browser)
  if (typeof WebSocket === 'undefined') return

  try {
    const supabase = createClient()
    const channel = supabase.channel("bh-online")

    channel
      .on("presence", { event: "sync" }, () => {
        sharedOnlineIds = new Set(Object.keys(channel.presenceState()))
        emitChange()
      })
      .on("presence", { event: "join" }, ({ key }) => {
        const next = new Set(sharedOnlineIds)
        next.add(key)
        sharedOnlineIds = next
        emitChange()
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        const next = new Set(sharedOnlineIds)
        next.delete(key)
        sharedOnlineIds = next
        emitChange()
      })

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return
      if (userId) {
        await channel.track({
          online_at: new Date().toISOString(),
          user_id: userId,
        })
      }
    })

    sharedChannel = channel
  } catch {
    // WebSocket or Realtime unavailable — silently degrade.
    // Presence simply won't work; the page still renders fine.
  }
}

export function usePresence(): Set<string> {
  const { user } = useUser()
  const userId = user?.sub
  const isSignedIn = !!user

  // Subscribe to the shared presence store
  const onlineIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  // Initialize the shared channel once with the current userId
  // Intentionally empty deps — initChannel guards against re-init
  useEffect(() => {
    initChannel(userId)
  }, [])

  // Track/untrack when user signs in or out
  useEffect(() => {
    if (!sharedChannel) return
    if (isSignedIn && userId) {
      sharedChannel
        .track({
          online_at: new Date().toISOString(),
          user_id: userId,
        })
        .catch(() => {})
    } else {
      sharedChannel.untrack().catch(() => {})
    }
  }, [isSignedIn, userId])

  // ── ponytail: Heartbeat removed ────────────────────────────────
  // Previously sent POST /api/heartbeat every 2 minutes to persist last_seen.
  // Cut to save serverless function quota on $0 budget.
  // PostHog Analytics handles session tracking without server polling.

  return onlineIds
}
