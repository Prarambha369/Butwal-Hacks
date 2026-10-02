/**
 * The event-detail FAQ, as data.
 *
 * Lives here rather than in the client component that renders it, for the same
 * reason `home-faq.ts` does: `event-detail-content.tsx` is a Client Component,
 * and Next.js replaces every non-component export of a `"use client"` module
 * with a client-reference proxy when a Server Component imports it. So
 *
 *   import EventDetailContent, { faqs } from "@/components/events/event-detail-content"
 *   faqPageJsonLd(faqs, eventUrl)   // faqs.map is not a function
 *
 * did not produce the array. It produced a proxy, and `faqPageJsonLd` calls
 * `.map()` immediately, so every `/events/[slug]` request threw during server
 * render -- after deploy, not at build, because the route is dynamic and no
 * test renders it.
 *
 * A module with no `"use client"` directive can be imported from both graphs and
 * stays one value, so the visible FAQ and the structured data cannot disagree.
 * Google requires FAQ markup to match content actually on the page, which is
 * the same reason the homepage was moved out.
 */
export interface EventFaq {
  q: string;
  a: string;
}

export const EVENT_FAQS: EventFaq[] = [
  {
    q: "Who can join this event?",
    a: "Students and youth participants are welcome unless otherwise stated on registration notes.",
  },
  {
    q: "Is prior experience required?",
    a: "No. Events are designed for mixed skill levels with mentoring support.",
  },
  {
    q: "What should I bring?",
    a: "Bring your laptop, charger, and basic essentials for a full-day build session.",
  },
];
