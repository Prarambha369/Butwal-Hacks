"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { EventCard } from "./event-card";
import type { PublicEvent } from "./event-types";

const PAGE = 6;

/**
 * Past events, newest first, six at a time. "Show more" reveals the next
 * page in place (no request: the list is already on the page) and moves
 * focus to the first newly shown card so keyboard users land on new content.
 */
export function PastEvents({ events, now }: { events: PublicEvent[]; now: number }) {
  const [shown, setShown] = useState(PAGE);
  const listRef = useRef<HTMLUListElement>(null);
  const remaining = events.length - shown;

  const showMore = () => {
    const firstNew = shown;
    setShown((n) => n + PAGE);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelectorAll<HTMLAnchorElement>("li a")
        [firstNew]?.focus();
    });
  };

  return (
    <>
      <ul ref={listRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.slice(0, shown).map((event) => (
          <li key={event.id} className="flex">
            <EventCard event={event} now={now} />
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={showMore} className="bh-btn-secondary text-sm">
            Show {Math.min(PAGE, remaining)} more past {remaining === 1 ? "event" : "events"}
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
