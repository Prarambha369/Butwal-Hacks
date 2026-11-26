"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronDown,
  Link2,
  LogIn,
  Share2,
} from "lucide-react";
import { RoseSpinner } from "@/components/ui/rose-loader";
import { useEventRegistration } from "./event-registration";
import { cn } from "@/lib/utils";

interface CalendarTarget {
  slug: string;
  googleUrl: string;
}

/**
 * The page's single primary action, following the real registration state:
 *
 *   before start, signed out    → Sign in to register
 *   before start, signed in     → Register — it's free   (opens consent)
 *   already registered          → Registered ✓            (not a button)
 *   happening now               → Add to calendar         (registration closed)
 *   ended                       → See recap
 *
 * Until the browser knows the time and the session, a same-size placeholder
 * holds the space so nothing moves.
 */
export function PrimaryEventAction({
  calendar,
  variant = "hero",
  id,
}: {
  calendar: CalendarTarget;
  variant?: "hero" | "bar";
  id?: string;
}) {
  const { phase, status, eventSlug, openConsent } = useEventRegistration();
  const size = variant === "bar" ? "w-full" : "w-full sm:w-auto sm:min-w-[13rem]";

  if (phase === null || status === "checking") {
    return (
      <span
        id={id}
        aria-hidden="true"
        className={cn("inline-block h-11 rounded-full bg-muted motion-safe:animate-pulse", size, "sm:w-52")}
      />
    );
  }

  if (phase === "past") {
    return (
      <a id={id} href="#recap" className={cn("bh-btn-primary", size)}>
        See recap <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </a>
    );
  }

  if (status === "registered") {
    return (
      <span
        id={id}
        tabIndex={-1}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-status-green/40 bg-status-green/10 px-6 text-sm font-semibold text-status-green",
          size,
        )}
      >
        <Check aria-hidden="true" className="h-4 w-4" /> Registered
        <span className="sr-only"> for this event</span>
      </span>
    );
  }

  if (phase === "live") {
    return (
      <a id={id} href={`/api/events/ical?slug=${encodeURIComponent(calendar.slug)}`} className={cn("bh-btn-primary", size)}>
        <CalendarPlus aria-hidden="true" className="h-4 w-4" /> Add to calendar
      </a>
    );
  }

  if (status === "signed-out") {
    return (
      <Link
        id={id}
        href={`/sign-in?returnTo=${encodeURIComponent(`/events/${eventSlug}#register`)}`}
        prefetch={false}
        className={cn("bh-btn-primary", size)}
      >
        <LogIn aria-hidden="true" className="h-4 w-4" /> Sign in to register
      </Link>
    );
  }

  return (
    <button
      id={id}
      type="button"
      onClick={openConsent}
      disabled={status === "registering"}
      className={cn("bh-btn-primary", size)}
    >
      {status === "registering" ? (
        <>
          <RoseSpinner size="sm" /> Registering…
        </>
      ) : (
        <>
          {status === "error" ? "Try again" : "Register — it's free"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

/** Result line under the hero CTA, announced politely. */
export function RegistrationMessage() {
  const { message, status } = useEventRegistration();
  return (
    <p
      aria-live="polite"
      className={cn(
        "min-h-5 text-sm",
        status === "error" ? "text-status-red" : "text-status-green",
      )}
    >
      {message}
    </p>
  );
}

/**
 * "Add to calendar" with two targets: the .ics download (Apple Calendar,
 * Outlook, anything that opens text/calendar) from our own route, and a
 * Google Calendar template link. A disclosure, not a modal: Escape and an
 * outside click close it and focus returns to the trigger.
 */
export function AddToCalendarMenu({ calendar }: { calendar: CalendarTarget }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-text-primary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red";

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="bh-btn-secondary text-sm"
      >
        <CalendarPlus aria-hidden="true" className="h-4 w-4" />
        Add to calendar
        <ChevronDown
          aria-hidden="true"
          className={cn("h-4 w-4 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          id={menuId}
          className="absolute left-0 z-30 mt-2 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-[var(--bh-shadow-lg)]"
        >
          <a
            href={`/api/events/ical?slug=${encodeURIComponent(calendar.slug)}`}
            className={item}
            onClick={() => setOpen(false)}
          >
            Apple Calendar or Outlook (.ics)
          </a>
          <a
            href={calendar.googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={item}
            onClick={() => setOpen(false)}
          >
            Google Calendar
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Share via the system sheet where there is one (phones), otherwise copy the
 * link. The page URL is canonical (no tracking parameters added).
 */
export function ShareEventButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // The person closed the sheet: nothing to do.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <button type="button" onClick={share} className="bh-btn-ghost text-sm">
      {copied ? <Link2 aria-hidden="true" className="h-4 w-4" /> : <Share2 aria-hidden="true" className="h-4 w-4" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}

/**
 * Mobile-only bar that keeps the primary action in reach once the hero CTA
 * has scrolled away. Sits above the site's bottom tab bar. Driven by an
 * IntersectionObserver on the hero CTA, not by scroll polling.
 */
export function StickyEventBar({
  title,
  dateLabel,
  calendar,
  watchId,
}: {
  title: string;
  dateLabel: string;
  calendar: CalendarTarget;
  watchId: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 px-3 md:hidden",
        "bottom-[calc(3.75rem+env(safe-area-inset-bottom))]",
        "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
      aria-hidden={!visible}
      inert={!visible}
      data-testid="sticky-event-bar"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 pl-4 shadow-[var(--bh-shadow-lg)]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text-primary">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{dateLabel}</p>
        </div>
        <div className="w-44 shrink-0">
          <PrimaryEventAction calendar={calendar} variant="bar" />
        </div>
      </div>
    </div>
  );
}

/**
 * /events cards link to `#register`. Static pages cannot read the hash on the
 * server, so once the CTA has resolved, move focus to it (and scroll it into
 * view) for people who came to register.
 */
export function FocusRegisterOnHash({ targetId }: { targetId: string }) {
  const { phase, status } = useEventRegistration();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || phase === null || status === "checking") return;
    if (window.location.hash !== `#${targetId}`) return;
    done.current = true;
    const el = document.getElementById(`${targetId}-cta`);
    el?.scrollIntoView({ block: "center", behavior: "auto" });
    el?.focus({ preventScroll: true });
  }, [phase, status, targetId]);
  return null;
}
