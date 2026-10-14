/**
 * The dashboard access model, in one place.
 *
 * Two roles are not a simple label on a profile:
 *
 *   maintainer  Staff only, and staff means an authenticated @butwalhacks.com
 *               address that Auth0 has verified. The role column alone is not
 *               authority -- a profile can carry role='maintainer' with any
 *               email, and nothing in the schema stops that. So the check needs
 *               the session, and it fails closed: an unverified address is
 *               treated exactly like a wrong one.
 *
 *   organizer   Time-boxed. Access covers an event's whole timeline -- from
 *               when it is created through 7 days after it ends -- so an
 *               organizer keeps their dashboard for planning and wrap-up and
 *               loses it once the dust settles.
 *
 *   Everything here is pure and synchronous. The queries that feed it live in
 * the layouts; keeping the decisions here means the middleware and the layouts
 * cannot disagree about who is who, which they already did once: middleware
 * let organizers into /portal while the layout bounced them, so nobody could
 * use it at all.
 */
import { roleRedirect } from "@/lib/role-gate";

/** Staff addresses. Auth0 must also report the address as verified. */
export const MAINTENANCE_EMAIL_DOMAIN = "butwalhacks.com";

/** Days after an event ends that organizer access survives. */
export const ORGANIZER_GRACE_DAYS = 7;

export interface AccessSubject {
  role: string | null | undefined;
  /** Absent for a session with no address, which is not staff. */
  email?: string | null;
  /** From the Auth0 session, not from our tables -- we do not store it. */
  emailVerified?: boolean | null | undefined;
}

/**
 * Maintainer = the role AND a verified address on the staff domain.
 *
 * Case-folded because an address is not case-sensitive in practice and
 * `User@ButwalHacks.com` must not slip past a `endsWith`.
 */
export function isMaintainer(subject: AccessSubject): boolean {
  if (subject.role !== "maintainer") return false;
  if (subject.emailVerified !== true) return false;
  const email = (subject.email ?? "").trim().toLowerCase();
  return email.endsWith(`@${MAINTENANCE_EMAIL_DOMAIN}`);
}

/**
 * Where to send someone who cannot use the maintainer dashboard.
 *
 * `roleRedirect` returns `/dashboard/<role>`, which for a profile carrying
 * role='maintainer' is the very page being denied -- so that would redirect to
 * itself and the user would sit on an infinite redirect. Anyone who reaches
 * this function with the maintainer role has failed the domain or verification
 * check, so they are sent to the hacker dashboard, which cannot fail closed
 * against itself because it is the page that performs profile bootstrap.
 */
export function maintainerRedirect(subject: AccessSubject): string | null {
  if (isMaintainer(subject)) return null;
  if (subject.role === "maintainer") return "/dashboard/hacker";
  return roleRedirect(subject.role, ["maintainer"]) ?? "/dashboard/hacker";
}

/** The fields organizer access is computed from. */
export interface TimelineEvent {
  created_at: string;
  end_date: string;
}

export interface OrganizerAccess {
  /** May the organizer dashboard render? */
  active: boolean;
  /** When the current window closes, if one is open. */
  until: string | null;
  /** Why -- shown to maintainers, and asserted in tests. */
  reason: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * An organizer may use their dashboard while any event they run is inside its
 * timeline: created through `end_date + ORGANIZER_GRACE_DAYS`.
 *
 * The window opens at `created_at`, not `start_date`. An event being planned
 * for next month is already theirs to work on, and gating on `start_date`
 * would lock organizers out of the very phase they need.
 *
 * An organizer with no events at all is allowed, with a distinct reason. The
 * alternative is a dead end: the window is defined by events, so refusing
 * organizers who have none means nobody can ever create the first one. This is
 * the one assumption in this file that the stated model does not settle, and it
 * is called out in `reason` so it stays visible.
 */
export function organizerAccess(
  events: readonly TimelineEvent[],
  now: Date = new Date(),
): OrganizerAccess {
  if (!events || events.length === 0) {
    return {
      active: true,
      until: null,
      reason: "No events yet — can plan the first one",
    };
  }

  const nowMs = now.getTime();
  const openWindows: number[] = [];

  for (const ev of events) {
    const opensAt = Date.parse(ev.created_at);
    const closesAt = Date.parse(ev.end_date) + ORGANIZER_GRACE_DAYS * DAY_MS;

    if (Number.isNaN(opensAt) || Number.isNaN(closesAt)) {
      // Unparseable dates must not open the door. Treat as closed.
      continue;
    }
    if (nowMs >= opensAt && nowMs <= closesAt) {
      openWindows.push(closesAt);
    }
  }

  if (openWindows.length === 0) {
    const latest = Math.max(
      ...events.map((e) => Date.parse(e.end_date) + ORGANIZER_GRACE_DAYS * DAY_MS),
    );
    return {
      active: false,
      until: null,
      reason: Number.isNaN(latest)
        ? "Event dates could not be read"
        : `All events concluded more than ${ORGANIZER_GRACE_DAYS} days ago`,
    };
  }

  // The window that lasts longest is the one that matters: with two events
  // running, access runs until the later of the two closes.
  const untilMs = Math.max(...openWindows);
  return {
    active: true,
    until: new Date(untilMs).toISOString(),
    reason: "Active event timeline",
  };
}

/**
 * `/portal/*` -- the sponsor view.
 *
 * Sponsors reach the portal to see the projects and people behind events they
 * sponsored. Organizers do not: they run events from /dashboard/organizer, and
 * listing them in the middleware only produced a dead end, because the portal
 * layout bounced them anyway and nobody could use the section.
 *
 * A maintainer gets in only on a verified staff address, same as the maintainer
 * dashboard -- otherwise a role='maintainer' profile on a personal address is
 * refused at /dashboard/maintainer and walks straight in here.
 */
export function portalRedirect(subject: AccessSubject): string | null {
  if (subject.role === "sponsor") return null;
  if (subject.role === "maintainer") return maintainerRedirect(subject);
  return roleRedirect(subject.role, ["sponsor"]);
}

/** The roles the middleware must list for /portal to match this predicate. */
export const PORTAL_ROLES = ["sponsor", "maintainer"] as const;

/**
 * `/dashboard/organizer/*` -- the event dashboard.
 *
 * Two rules in one predicate, because they interact: a profile claiming the
 * maintainer role must clear the staff-email check to use *any* privileged
 * section, and organizers are time-boxed to their event timelines.
 *
 * Staff are not time-boxed. A maintainer who also organizes keeps access
 * because they hold staff authority, not because they are an organizer.
 */
export function organizerRedirect(
  subject: AccessSubject,
  events: readonly TimelineEvent[],
  now?: Date,
): string | null {
  if (subject.role === "maintainer") {
    // Refused at /dashboard/maintainer, so it must be refused here too --
    // otherwise role='maintainer' on a personal address walks in through the
    // organizer door instead, which holds events and certificate templates.
    return maintainerRedirect(subject);
  }

  const blocked = roleRedirect(subject.role, ["organizer"]);
  if (blocked) return blocked;

  return organizerAccess(events, now).active ? null : "/dashboard/hacker";
}
