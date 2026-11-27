import Link from "next/link";
import { ArrowRight, CalendarDays, Globe, MapPin } from "lucide-react";
import { EventBanner } from "./event-banner";
import { EventStatusBadge } from "./event-status-badge";
import type { PublicEvent } from "./event-types";
import {
  eventPhase,
  formatEventBsDate,
  formatEventDateRange,
  formatEventTimeRange,
  isOnlineLocation,
  registrationOpen,
  type EventPhase,
} from "@/lib/event-status";
import { cn } from "@/lib/utils";
import { externalRegistrationUrl } from "@/lib/external-registration";

/** Card CTA: an in-site Link, or a new-tab anchor for partner registration. */
function CardLink({
  action,
  className,
  ariaLabel,
  children,
}: {
  action: { href: string; external?: boolean };
  className: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" aria-label={`${ariaLabel} (opens in a new tab)`} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={action.href} prefetch={false} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}

/** The one action a card offers, by phase. */
export function cardAction(
  event: PublicEvent,
  phase: EventPhase,
): { label: string; href: string; external?: boolean } {
  if (registrationOpen(phase)) {
    // Partner-run registration (lib/external-registration.ts) links straight out.
    const external = externalRegistrationUrl(event.slug);
    if (external) return { label: "Register", href: external, external: true };
    return { label: "Register", href: `/events/${event.slug}#register` };
  }
  if (phase === "past") return { label: "See recap", href: `/events/${event.slug}#recap` };
  return { label: "View details", href: `/events/${event.slug}` };
}

function Facts({ event, size = "sm" }: { event: PublicEvent; size?: "sm" | "lg" }) {
  const online = isOnlineLocation(event.location);
  const Venue = online ? Globe : MapPin;
  return (
    <dl
      className={cn(
        "grid gap-1.5 text-muted-foreground",
        size === "lg" ? "text-sm sm:text-base" : "text-sm",
      )}
    >
      <div className="flex items-start gap-2">
        <dt className="sr-only">When</dt>
        <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary-red" />
        <dd>
          <time dateTime={event.start_date} className="font-medium text-text-body">
            {formatEventDateRange(event)}
          </time>
          <span className="block text-xs tabular-nums">
            {formatEventTimeRange(event)}
            {formatEventBsDate(event) && <> · {formatEventBsDate(event)}</>}
          </span>
        </dd>
      </div>
      {event.location && (
        <div className="flex items-start gap-2">
          <dt className="sr-only">{online ? "Online" : "Where"}</dt>
          <Venue aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary-red" />
          <dd className="line-clamp-2">{event.location}</dd>
        </div>
      )}
    </dl>
  );
}

/**
 * One event in the grid.
 *
 * The CTA is the card's only link (a stretched ::after covers the card), so a
 * keyboard user meets one tab stop per event and a screen reader hears one
 * named destination, not a title link and a button link to the same page.
 * Prefetch is off: a full /events grid must not fan out into page requests
 * (production WAF budget).
 */
export function EventCard({
  event,
  now,
  headingLevel = 3,
}: {
  event: PublicEvent;
  now: number;
  headingLevel?: 3 | 4;
}) {
  const phase = eventPhase(event, now);
  const action = cardAction(event, phase);
  const Heading = headingLevel === 4 ? "h4" : "h3";
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary-red/40 hover:shadow-[var(--bh-shadow-md)] focus-within:border-primary-red/40 motion-reduce:transition-none">
      <EventBanner
        url={event.banner_url}
        title={event.title}
        startDate={event.start_date}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
        zoomOnHover
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <EventStatusBadge phase={phase} className="self-start" />
        <Heading className="text-lg font-bold leading-snug tracking-[-0.01em] text-text-primary [text-wrap:balance]">
          {event.title}
        </Heading>
        <Facts event={event} />
        {/* Plain text on purpose: answer engines quote "Free" and the
            summary straight off the card. */}
        <p className="line-clamp-2 text-sm leading-relaxed text-text-body">
          <span className="font-semibold text-text-primary">Free, no registration fee.</span>
          {event.description && <> {event.description.split(/\n/)[0]}</>}
        </p>
        <div className="mt-auto pt-1">
          <CardLink
            action={action}
            ariaLabel={`${action.label}: ${event.title}`}
            className={cn(
              "after:absolute after:inset-0 after:content-['']",
              phase === "past" ? "bh-btn-secondary" : "bh-btn-primary",
              "w-full text-sm sm:w-auto",
            )}
          >
            {action.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </CardLink>
        </div>
      </div>
    </article>
  );
}

/** The next event, given the width it deserves: banner beside its details. */
export function FeaturedEventCard({ event, now }: { event: PublicEvent; now: number }) {
  const phase = eventPhase(event, now);
  const action = cardAction(event, phase);
  return (
    <article className="group relative grid overflow-hidden rounded-2xl border border-border bg-surface transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary-red/40 hover:shadow-[var(--bh-shadow-md)] focus-within:border-primary-red/40 motion-reduce:transition-none lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <EventBanner
        url={event.banner_url}
        title={event.title}
        startDate={event.start_date}
        sizes="(max-width: 1024px) 100vw, 640px"
        priority
        className="lg:h-full lg:aspect-auto lg:min-h-[20rem]"
        zoomOnHover
      />
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <EventStatusBadge phase={phase} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Next up · Free
          </span>
        </div>
        <h3 className="text-3xl font-extrabold leading-[1.1] tracking-[-0.025em] text-text-primary [text-wrap:balance] sm:text-4xl">
          {event.title}
        </h3>
        <Facts event={event} size="lg" />
        {event.description && (
          <p className="line-clamp-3 max-w-[60ch] text-sm leading-relaxed text-text-body">
            {event.description.split(/\n/)[0]}
          </p>
        )}
        <div className="mt-auto pt-1">
          <CardLink
            action={action}
            ariaLabel={`${action.label}: ${event.title}`}
            className="bh-btn-primary w-full after:absolute after:inset-0 after:content-[''] sm:w-auto"
          >
            {action.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </CardLink>
        </div>
      </div>
    </article>
  );
}
