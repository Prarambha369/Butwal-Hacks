"use client";

import { usePresence } from "@/hooks/use-presence";

interface WidgetPresenceDotProps {
  /** The profile's auth0_user_id. If null, renders a dim offline dot. */
  auth0UserId: string | null;
  /** `sm` for badge variant (6px), `md` for compact (8px), `lg` for card (12px). */
  size?: "sm" | "md" | "lg";
}

const dotSizes: Record<string, number> = {
  sm: 6,
  md: 8,
  lg: 12,
};

/**
 * Live presence dot for the embeddable widget.
 *
 * Uses the shared `usePresence` hook from the main app, which tracks
 * all logged-in users via Supabase Realtime. When the profile owner is
 * signed in anywhere, this dot turns green with a pulsing glow.
 *
 * Falls back to a dim offline dot when:
 *   - auth0UserId is null (profile not claimed / ghost)
 *   - The profile owner is not currently online
 *   - WebSocket is unavailable (restricted browser)
 */

export function WidgetPresenceDot({ auth0UserId, size = "md" }: WidgetPresenceDotProps) {
  // usePresence must be called even when auth0UserId is null — hooks
  // cannot be called conditionally. The hook's singleton channel pattern
  // handles this correctly.
  const onlineIds = usePresence();
  const isOnline = !!auth0UserId && onlineIds.has(auth0UserId);

  const px = dotSizes[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: px,
        height: px,
      }}
      aria-label={isOnline ? "Online" : "Offline"}
    >
      <span
        style={{
          display: "block",
          width: px,
          height: px,
          borderRadius: "50%",
          background: isOnline ? "#4CAF50" : "#333",
          flexShrink: 0,
          boxShadow: isOnline ? `0 0 ${px * 0.75}px rgba(76,175,80,0.5)` : "none",
          transition: "background 0.3s, box-shadow 0.3s",
        }}
      />
    </span>
  );
}
