import { describe, it, expect } from "vitest";
import {
  buildSyncPlan,
  googleEventIdForSlug,
  managedHashFor,
  resolveEnd,
  buildEventPayload,
} from "@/lib/google-calendar/plan";
import type { BhEvent, GoogleEventRef } from "@/lib/google-calendar/types";

function ev(overrides: Partial<BhEvent> = {}): BhEvent {
  return {
    id: "uuid-1",
    slug: "hackday-2026",
    title: "HackDay Butwal 2026",
    description: "A day of building.",
    location: "Butwal",
    startDate: "2026-02-18T04:15:00.000Z", // 10:00 Nepal
    endDate: "2026-02-18T09:15:00.000Z", // 15:00 Nepal
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function ref(slug: string, managedHash: string | null): GoogleEventRef {
  return { id: googleEventIdForSlug(slug), managedHash };
}

// ─────────────────────────────────────────────────────────────────────────
// Deterministic ids
// ─────────────────────────────────────────────────────────────────────────

describe("googleEventIdForSlug", () => {
  it("is stable for the same slug", () => {
    expect(googleEventIdForSlug("hackday-2026")).toBe(googleEventIdForSlug("hackday-2026"));
  });

  it("differs for different slugs, even after sanitising", () => {
    // Both sanitise to "hackday-2026"; the hash suffix keeps them distinct so
    // one event can never overwrite another.
    expect(googleEventIdForSlug("hackday-2026")).not.toBe(
      googleEventIdForSlug("Hackday 2026!")
    );
  });

  it("produces a valid Google id", () => {
    const id = googleEventIdForSlug("HackDay Butwal 2026!! @#$");
    expect(id).toMatch(/^[a-v0-9]{5,1024}$/);
  });

  it("handles an empty or symbol-only slug", () => {
    expect(googleEventIdForSlug("")).toMatch(/^[a-v0-9]{5,1024}$/);
    expect(googleEventIdForSlug("!!!")).toMatch(/^[a-v0-9]{5,1024}$/);
  });

  it("stays under Google's 1024-char limit for a long slug", () => {
    expect(googleEventIdForSlug("a".repeat(5000)).length).toBeLessThanOrEqual(1024);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Timing
// ─────────────────────────────────────────────────────────────────────────

describe("resolveEnd", () => {
  it("uses the given end date", () => {
    expect(resolveEnd(ev()).toISOString()).toBe("2026-02-18T09:15:00.000Z");
  });

  it("falls back to 2 hours when there is no end date", () => {
    expect(resolveEnd(ev({ endDate: null })).toISOString()).toBe("2026-02-18T06:15:00.000Z");
  });

  it("falls back when the end date is unparseable", () => {
    expect(resolveEnd(ev({ endDate: "not-a-date" })).toISOString()).toBe(
      "2026-02-18T06:15:00.000Z"
    );
  });
});

describe("buildEventPayload", () => {
  it("normalises missing text to empty strings so the hash is stable", () => {
    const p = buildEventPayload(ev({ description: null, location: null }));
    expect(p.description).toBe("");
    expect(p.location).toBe("");
  });

  it("falls back to a title when the event has none", () => {
    expect(buildEventPayload(ev({ title: "" })).summary).toBe("Butwal Hacks event");
  });

  it("sends absolute instants with an explicit timezone", () => {
    const p = buildEventPayload(ev());
    expect(p.start.dateTime).toBe("2026-02-18T04:15:00.000Z");
    expect(p.start.timeZone).toBe("Asia/Kathmandu");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Managed hash
// ─────────────────────────────────────────────────────────────────────────

describe("managedHashFor", () => {
  it("is stable for identical events", () => {
    expect(managedHashFor(ev())).toBe(managedHashFor(ev()));
  });

  it("ignores id and updatedAt, which are not pushed to Google", () => {
    expect(managedHashFor(ev({ id: "a" }))).toBe(managedHashFor(ev({ id: "b" })));
    expect(managedHashFor(ev({ updatedAt: "2020-01-01" }))).toBe(
      managedHashFor(ev({ updatedAt: "2026-12-31" }))
    );
  });

  it("changes when any managed field changes", () => {
    const base = managedHashFor(ev());
    expect(managedHashFor(ev({ title: "Renamed" }))).not.toBe(base);
    expect(managedHashFor(ev({ description: "different" }))).not.toBe(base);
    expect(managedHashFor(ev({ location: "Pokhara" }))).not.toBe(base);
    expect(managedHashFor(ev({ startDate: "2026-03-01T04:15:00.000Z" }))).not.toBe(base);
    expect(managedHashFor(ev({ endDate: "2026-02-18T10:15:00.000Z" }))).not.toBe(base);
  });

  it("is order-independent because it is not derived from object key order", () => {
    expect(managedHashFor(ev({ title: "A", location: "B" }))).toBe(
      managedHashFor(ev({ location: "B", title: "A" }))
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The conflict policy
// ─────────────────────────────────────────────────────────────────────────

describe("buildSyncPlan", () => {
  it("creates when nothing exists yet", () => {
    const plan = buildSyncPlan([ev()], new Map());
    expect(plan.counts).toEqual({ create: 1, update: 0, skip: 0, orphan: 0 });
    expect(plan.items[0].googleEventId).toBe(googleEventIdForSlug("hackday-2026"));
  });

  it("skips when the managed payload already matches", () => {
    const plan = buildSyncPlan([ev()], new Map([["hackday-2026", ref("hackday-2026", managedHashFor(ev()))]]));
    expect(plan.counts.skip).toBe(1);
    expect(plan.counts.update).toBe(0);
  });

  it("updates when the BH event changed (BH wins)", () => {
    const before = ev({ title: "Old title" });
    const stored = new Map([["hackday-2026", ref("hackday-2026", managedHashFor(before))]]);

    const plan = buildSyncPlan([ev({ title: "New title" })], stored);
    expect(plan.counts.update).toBe(1);
    expect(plan.items[0].reason).toMatch(/changed/i);
  });

  it("updates when the event was moved in time", () => {
    const stored = new Map([
      ["hackday-2026", ref("hackday-2026", managedHashFor(ev({ startDate: "2026-01-01T04:15:00.000Z" })))],
    ]);
    const plan = buildSyncPlan([ev()], stored);
    expect(plan.counts.update).toBe(1);
  });

  it("updates when the previous hash is unknown, rather than assuming parity", () => {
    const plan = buildSyncPlan([ev()], new Map([["hackday-2026", ref("hackday-2026", null)]]));
    expect(plan.counts.update).toBe(1);
  });

  // ── the "never delete" guarantee ───────────────────────────────────

  it("orphans an unpublished event and never asks for a delete", () => {
    const plan = buildSyncPlan([], new Map([["hackday-2026", ref("hackday-2026", "abc")]]));
    expect(plan.counts.orphan).toBe(1);
    expect(plan.counts.create + plan.counts.update + plan.counts.skip).toBe(0);
    // The plan never expresses a delete at all.
    expect(plan.items.every((i) => i.action !== ("delete" as never))).toBe(true);
    expect(plan.items[0].reason).toMatch(/never deletes/);
  });

  it("does not orphan an event that is still published", () => {
    const plan = buildSyncPlan([ev()], new Map([["hackday-2026", ref("hackday-2026", "abc")]]));
    expect(plan.counts.orphan).toBe(0);
  });

  it("handles a mix of create, update, skip and orphan in one pass", () => {
    const published = [
      ev({ slug: "new-one" }),
      ev({ slug: "changed-one", title: "v2" }),
      ev({ slug: "same-one" }),
    ];
    const existing = new Map<string, GoogleEventRef>([
      ["changed-one", ref("changed-one", managedHashFor(ev({ slug: "changed-one", title: "v1" })))],
      ["same-one", ref("same-one", managedHashFor(ev({ slug: "same-one" })))],
      ["gone-one", ref("gone-one", "zzz")],
    ]);

    const plan = buildSyncPlan(published, existing);
    expect(plan.counts).toEqual({ create: 1, update: 1, skip: 1, orphan: 1 });
  });

  it("is a no-op on an empty calendar", () => {
    const plan = buildSyncPlan([], new Map());
    expect(plan.counts).toEqual({ create: 0, update: 0, skip: 0, orphan: 0 });
  });

  it("does not re-sync a re-published event as an update of a deleted id", () => {
    // After an orphan, the row stays in `existing`. When the event is published
    // again it must return to the normal create/update path, never a delete.
    const published = [ev()];
    const existing = new Map([["hackday-2026", ref("hackday-2026", managedHashFor(ev()))]]);
    const plan = buildSyncPlan(published, existing);
    expect(plan.counts.orphan).toBe(0);
    expect(plan.counts.skip).toBe(1);
  });
});
