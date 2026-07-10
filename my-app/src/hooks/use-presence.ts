"use client"

import { useEffect, useState, useRef } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { createClient } from "@/utils/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

/**
 * Tracks online users via Supabase Realtime presence.
 *
 * Returns a Set of profile IDs (UUIDs) that are currently online.
 * The calling component checks if a given profile ID is in the set.
 *
 * Uses `useRef` to avoid re-subscribing on re-renders.
 * Cleans up the channel subscription on unmount.
 */
export function usePresence(): Set<string> {
  const { user } = useUser()
  const userId = user?.sub
  const isSignedIn = !!user
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!isSignedIn || !userId) return

    const supabase = createClient()
    const channel = supabase.channel("bh-online", {
      config: { presence: { key: userId } },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const ids = new Set(Object.keys(state))
        setOnlineIds(ids)
      })
      .on("presence", { event: "join" }, ({ key }) => {
        setOnlineIds((prev) => {
          const next = new Set(prev)
          next.add(key)
          return next
        })
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineIds((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      })

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return
      // Track this user's presence
      await channel.track({
        online_at: new Date().toISOString(),
        user_id: userId,
      })
    })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [isSignedIn, userId])

  return onlineIds
}
