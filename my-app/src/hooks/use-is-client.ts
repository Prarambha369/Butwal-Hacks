"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns `true` once the component has hydrated on the client.
 * Uses `useSyncExternalStore` — no effects, no `setState` in effect warnings.
 *
 * SSR: returns `false`
 * Client (first render): returns `false` (hydration)
 * Client (post-hydration): returns `true` (re-render)
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => {
      // No external store to subscribe to — never re-render from outside
      return () => {};
    },
    () => true,  // client snapshot
    () => false, // server snapshot
  );
}
