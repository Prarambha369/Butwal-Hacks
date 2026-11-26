"use client";

import { EventStatusBadge } from "./event-status-badge";
import { useEventRegistration } from "./event-registration";

/**
 * The detail page's status badge. The page is statically cached, so the
 * phase is computed in the browser (by the registration provider); until
 * then a same-size placeholder holds the space.
 */
export function EventPhaseBadge() {
  const { phase } = useEventRegistration();
  return <EventStatusBadge phase={phase} />;
}
