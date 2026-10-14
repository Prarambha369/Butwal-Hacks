// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";
import {
  isMaintainer,
  maintainerRedirect,
  organizerAccess,
  ORGANIZER_GRACE_DAYS,
  MAINTENANCE_EMAIL_DOMAIN,
} from "@/lib/dashboard-access";

/**
 * The dashboard access model.
 *
 * Two roles are not a label:
 *
 *   maintainer  requires a verified @butwalhacks.com address on top of the
 *               role, because nothing in the schema stops a profile from
 *               carrying role='maintainer' with any email.
 *
 *   organizer   is time-boxed to an event's timeline.
 *
 * Every case below is one that would otherwise be a hole: a maintainer role on
 * the wrong address, an unverified staff address, an organizer whose events
 * concluded last month, and unparseable dates.
 */

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-06-15T12:00:00Z");

const iso = (offsetDays: number) =>
  new Date(NOW.getTime() + offsetDays * DAY).toISOString();

const event = (createdOffset: number, endOffset: number) => ({
  created_at: iso(createdOffset),
  end_date: iso(endOffset),
});

describe("isMaintainer", () => {
  const staff = {
    role: "maintainer",
    email: `someone@${MAINTENANCE_EMAIL_DOMAIN}`,
    emailVerified: true,
  };

  it("admits a verified staff address", () => {
    expect(isMaintainer(staff)).toBe(true);
  });

  it("is case-insensitive about the domain", () => {
    // An address is not case-sensitive in practice, and a naive endsWith would
    // let `User@ButwalHacks.com` past a lowercase comparison.
    expect(
      isMaintainer({ ...staff, email: `Some.One@${MAINTENANCE_EMAIL_DOMAIN.toUpperCase()}` }),
    ).toBe(true);
    expect(isMaintainer({ ...staff, email: "  someone@butwalhacks.com  " })).toBe(true);
  });

  it("refuses the right role on a personal address", () => {
    expect(isMaintainer({ ...staff, email: "someone@gmail.com" })).toBe(false);
  });

  it("refuses a lookalike domain", () => {
    for (const email of [
      "someone@notbutwalhacks.com",
      "someone@butwalhacks.com.evil.io",
      "someone@butwalhacks.co",
    ]) {
      expect(isMaintainer({ ...staff, email })).toBe(false);
    }
  });

  it("refuses an unverified staff address", () => {
    // Fail closed: an unverified address is treated exactly like a wrong one.
    expect(isMaintainer({ ...staff, emailVerified: false })).toBe(false);
    expect(isMaintainer({ ...staff, emailVerified: null })).toBe(false);
    expect(isMaintainer({ ...staff, emailVerified: undefined })).toBe(false);
  });

  it("refuses a missing address", () => {
    expect(isMaintainer({ ...staff, email: null })).toBe(false);
    expect(isMaintainer({ ...staff, email: undefined })).toBe(false);
    expect(isMaintainer({ ...staff, email: "" })).toBe(false);
  });

  it("refuses the right address without the role", () => {
    for (const role of ["hacker", "organizer", "sponsor", "lead", null, undefined]) {
      expect(isMaintainer({ ...staff, role })).toBe(false);
    }
  });
});

describe("maintainerRedirect", () => {
  const staff = {
    role: "maintainer",
    email: `x@${MAINTENANCE_EMAIL_DOMAIN}`,
    emailVerified: true,
  };

  it("admits staff", () => {
    expect(maintainerRedirect(staff)).toBeNull();
  });

  it("never redirects a denied maintainer to the page it just refused", () => {
    // roleRedirect returns `/dashboard/${role}`, which for role='maintainer' is
    // the very page being denied. That is an infinite redirect.
    for (const email of ["x@gmail.com", null, ""]) {
      const out = maintainerRedirect({ ...staff, email, emailVerified: false });
      expect(out).not.toBe("/dashboard/maintainer");
      expect(out).toBe("/dashboard/hacker");
    }
  });

  it("sends a wrong role to its own dashboard", () => {
    expect(
      maintainerRedirect({ role: "organizer", email: "o@x.com", emailVerified: true }),
    ).toBe("/dashboard/organizer");
  });

  it("fails closed for an unknown role", () => {
    expect(maintainerRedirect({ role: undefined })).toBe("/dashboard/hacker");
    expect(maintainerRedirect({ role: null })).toBe("/dashboard/hacker");
  });
});

describe("organizerAccess", () => {
  it("allows an organizer with no events yet", () => {
    // Otherwise the first event could never be created: the window is defined
    // by events, so refusing organizers who have none is a dead end.
    const out = organizerAccess([], NOW);
    expect(out.active).toBe(true);
    expect(out.reason).toMatch(/no events/i);
  });

  it("allows an event still running", () => {
    const out = organizerAccess([event(-10, 2)], NOW);
    expect(out.active).toBe(true);
    expect(out.until).toBeTruthy();
  });

  it("allows an event being planned for next month", () => {
    // The window opens at created_at, not start_date. Gating on start_date
    // would lock organizers out of the planning phase they need.
    const out = organizerAccess([event(-1, 30)], NOW);
    expect(out.active).toBe(true);
  });

  it(`survives exactly ${ORGANIZER_GRACE_DAYS} days after the event ends`, () => {
    expect(organizerAccess([event(-10, ORGANIZER_GRACE_DAYS)], NOW).active).toBe(true);
  });

  it(`closes one day after the ${ORGANIZER_GRACE_DAYS}-day grace`, () => {
    // Window closes at end_date + grace, so an event that ended one day beyond
    // that has a close time already in the past.
    expect(organizerAccess([event(-20, -(ORGANIZER_GRACE_DAYS + 1))], NOW).active).toBe(
      false,
    );
  });

  it("closes long after the event ends", () => {
    const out = organizerAccess([event(-90, -30)], NOW);
    expect(out.active).toBe(false);
    expect(out.reason).toMatch(/concluded/i);
  });

  it("stays open while any one event is in window", () => {
    // Two events: one long concluded, one still running.
    const out = organizerAccess([event(-90, -30), event(-5, 3)], NOW);
    expect(out.active).toBe(true);
  });

  it("reports the window that lasts longest", () => {
    const out = organizerAccess([event(-5, 3), event(-5, 40)], NOW);
    expect(out.until).toBe(iso(40 + ORGANIZER_GRACE_DAYS));
  });

  it("fails closed on unparseable dates", () => {
    // A garbage date must not open the door.
    expect(organizerAccess([{ created_at: "nope", end_date: "nope" }], NOW).active).toBe(
      false,
    );
    expect(
      organizerAccess([{ created_at: iso(-5), end_date: "not-a-date" }], NOW).active,
    ).toBe(false);
  });

  it("fails closed before an event is created", () => {
    // Clock skew or a mis-set created_at should not grant access.
    expect(organizerAccess([event(5, 30)], NOW).active).toBe(false);
  });
});