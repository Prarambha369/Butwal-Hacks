"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/components/auth-user-provider";
import RegistrationConsentModal, {
  type RegistrationConsent,
} from "@/components/events/registration-consent-modal";
import { CLOSING_SOON_MS, eventPhase, type EventPhase } from "@/lib/event-status";

/**
 * Registration state for one event page, shared by every CTA on it (the hero
 * button and the sticky mobile bar), with a single consent modal.
 *
 * The rules are the existing ones, not new ones:
 *  - registration goes through POST /api/events/register with the three
 *    required acceptances (RegistrationConsentModal);
 *  - the page offers it until the event starts;
 *  - a 409 from the route means "already registered".
 * Whether the signed-in member is already registered is read once from
 * GET /api/events/register (session-scoped). No polling, no retry loop.
 */

export type RegistrationStatus =
  | "checking"
  | "signed-out"
  | "available"
  | "registering"
  | "registered"
  | "error";

interface RegistrationContextValue {
  phase: EventPhase | null;
  status: RegistrationStatus;
  message: string;
  eventSlug: string;
  openConsent: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

export function useEventRegistration(): RegistrationContextValue {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useEventRegistration must be used inside EventRegistrationProvider");
  return ctx;
}

export function EventRegistrationProvider({
  eventId,
  eventSlug,
  startDate,
  endDate,
  children,
}: {
  eventId: string;
  eventSlug: string;
  startDate: string;
  endDate: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();
  const [phase, setPhase] = useState<EventPhase | null>(null);
  const [known, setKnown] = useState<"unknown" | "registered" | "not-registered">("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showConsent, setShowConsent] = useState(false);

  // "Now" is only known in the browser; the CTA reserves its space until the
  // first computation. The phase is recomputed at the next boundary (72h
  // before start, start, end) with one timer, not polling, and whenever the
  // tab becomes visible again (timers are throttled in background tabs).
  useEffect(() => {
    const event = { start_date: startDate, end_date: endDate };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const now = Date.now();
      setPhase(eventPhase(event, now));
      const start = Date.parse(startDate);
      const end = Date.parse(endDate);
      const next = [start - CLOSING_SOON_MS, start, end + 1]
        .filter((t) => Number.isFinite(t) && t > now)
        .sort((a, b) => a - b)[0];
      clearTimeout(timer);
      // setTimeout overflows past ~24.8 days; the visibility check covers that.
      if (next !== undefined && next - now < 2 ** 31 - 1) timer = setTimeout(update, next - now);
    };
    update();
    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [startDate, endDate]);

  const signedIn = Boolean(user);

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    fetch(`/api/events/register?event_id=${encodeURIComponent(eventId)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return setKnown("not-registered");
        const data = (await res.json()) as { registered?: boolean };
        setKnown(data.registered === true ? "registered" : "not-registered");
      })
      .catch(() => {
        // Aborted or offline: fall back to offering registration; the POST
        // answers 409 if they are in fact registered.
        if (!controller.signal.aborted) setKnown("not-registered");
      });
    return () => controller.abort();
  }, [signedIn, eventId]);

  const status: RegistrationStatus = useMemo(() => {
    if (isLoading) return "checking";
    if (!signedIn) return "signed-out";
    if (known === "registered") return "registered";
    if (busy) return "registering";
    if (error) return "error";
    if (known === "unknown") return "checking";
    return "available";
  }, [isLoading, signedIn, known, busy, error]);

  const register = useCallback(
    async (consent: RegistrationConsent) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/events/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: eventId,
            consent: {
              code_of_conduct: consent.code_of_conduct,
              rules: consent.rules,
              privacy: consent.privacy,
              marketing: consent.marketing,
            },
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        if (res.status === 409) {
          setShowConsent(false);
          setKnown("registered");
          setMessage("You're already registered for this event.");
          return;
        }
        if (!res.ok) {
          setError(data.error || "Registration failed. Try again.");
          return;
        }
        setShowConsent(false);
        setKnown("registered");
        setMessage("You're registered. See you there!");
        router.refresh();
      } catch {
        setError("Network error. Check your connection and try again.");
      } finally {
        setBusy(false);
      }
    },
    [eventId, router],
  );

  const openConsent = useCallback(() => {
    setError("");
    setMessage("");
    setShowConsent(true);
  }, []);

  const value = useMemo<RegistrationContextValue>(
    () => ({ phase, status, message: error || message, eventSlug, openConsent }),
    [phase, status, error, message, eventSlug, openConsent],
  );

  return (
    <RegistrationContext.Provider value={value}>
      {children}
      {showConsent && (
        <RegistrationConsentModal
          onClose={() => setShowConsent(false)}
          onConfirm={register}
          submitting={busy}
          error={error || null}
        />
      )}
    </RegistrationContext.Provider>
  );
}
