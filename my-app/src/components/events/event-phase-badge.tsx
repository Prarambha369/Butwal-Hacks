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
  // The phase arrives after mount; a persistent polite status region
  // announces it once without moving focus.
  return (
    <span role="status" className="inline-flex">
      <EventStatusBadge phase={phase} />
    </span>
  );
}
