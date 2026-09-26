import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression coverage for the 409 recovery paths.
 *
 * Google reserves a client-supplied event id even after the event is deleted,
 * so `createEvent` can 409 in several ordinary flows: a disconnect drops
 * `google_event_ids` while leaving the events in the user's calendar, a
 * `recordSyncResult` write can fail after a successful create, and the 404
 * self-heal recreates the same id. Without a fallback each of those failed on
 * every run and the mapping was never stored, so it never recovered.
 */

const rows: Array<Record<string, unknown>> = [];
const dbQuery = {
  select: vi.fn(() => dbQuery),
  eq: vi.fn(() => dbQuery),
  then: (resolve: (v: unknown) => void) => resolve({ data: rows, error: null }),
};

vi.mock("@/utils/supabase", () => ({
  createServiceClient: () => ({ from: () => dbQuery }),
}));
vi.mock("@/lib/supabase-error", () => ({
  describeSupabaseError: () => ({ diagnostic: "mock" }),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Defined inside the hoisted factory: a top-level class would not be
// initialised when vi.mock runs.
vi.mock("@/lib/google-calendar/client", () => {
  class GoogleApiError extends Error {
    constructor(message: string, readonly status: number, readonly body = "") {
      super(message);
      this.name = "GoogleApiError";
    }
    get isNotFound() {
      return this.status === 404;
    }
    get isUnauthorized() {
      return this.status === 401 || this.status === 403;
    }
    get isConflict() {
      return this.status === 409;
    }
  }
  return {
    createEvent: vi.fn(),
    patchEvent: vi.fn(),
    refreshAccessToken: vi.fn(),
    GoogleApiError,
  };
});

vi.mock("@/lib/google-calendar/tokens", () => ({
  getConnection: vi.fn(),
  updateAccessToken: vi.fn(),
  recordSyncResult: vi.fn(),
  appendSyncLog: vi.fn(),
}));

import { createEvent, patchEvent, GoogleApiError } from "@/lib/google-calendar/client";
import { getConnection, recordSyncResult } from "@/lib/google-calendar/tokens";
import { googleEventIdForSlug } from "@/lib/google-calendar/plan";
import { syncUserCalendar } from "@/lib/google-calendar/sync";

const apiError = (status: number) => new GoogleApiError("mock", status, "");

const mockedCreate = createEvent as ReturnType<typeof vi.fn>;
const mockedPatch = patchEvent as ReturnType<typeof vi.fn>;
const mockedGetConnection = getConnection as ReturnType<typeof vi.fn>;
const mockedRecord = recordSyncResult as ReturnType<typeof vi.fn>;

/** Connection whose access token is still fresh, so no refresh call happens. */
function connected(googleEventIds: Record<string, { id: string; managedHash: string }>) {
  mockedGetConnection.mockResolvedValue({
    auth0UserId: "auth0|primary",
    calendarId: "primary",
    googleEventIds,
    syncEnabled: true,
    tokens: { refreshToken: "rt", accessToken: "at", expiresAt: Date.now() + 3_600_000 },
  });
}

function eventRow(slug: string, title = "Event") {
  return {
    id: `id-${slug}`,
    slug,
    title,
    description: "desc",
    location: "Butwal",
    start_date: "2026-03-01T10:00:00Z",
    end_date: "2026-03-01T12:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  rows.length = 0;
  mockedRecord.mockResolvedValue(undefined);
});

describe("syncUserCalendar — 409 recovery", () => {
  it("updates in place when the deterministic id already exists on Google", async () => {
    // Disconnect/reconnect: googleEventIds was dropped, so the plan is
    // `create`, but the events are still in the calendar.
    rows.push(eventRow("hackday-2026"));
    connected({});
    mockedCreate.mockRejectedValue(apiError(409));
    mockedPatch.mockResolvedValue({ id: googleEventIdForSlug("hackday-2026") });

    const outcome = await syncUserCalendar("auth0|primary");

    expect(mockedPatch).toHaveBeenCalledTimes(1);
    const [, calendarId, eventId, body] = mockedPatch.mock.calls[0];
    expect(calendarId).toBe("primary");
    expect(eventId).toBe(googleEventIdForSlug("hackday-2026"));
    // status:confirmed is required or a cancelled/deleted event stays deleted.
    expect(body).toMatchObject({ status: "confirmed" });
    expect(outcome.failures).toEqual([]);
    expect(outcome.counts.create).toBe(1);

    // The mapping is finally stored, so the next run plans `update`.
    const stored = mockedRecord.mock.calls.at(-1)?.[0];
    expect(stored?.googleEventIds?.["hackday-2026"]).toBeDefined();
  });

  it("restores an event the user deleted when the id is still reserved", async () => {
    // Stored mapping exists, so the plan is `update`; the user deleted the
    // event, so patch 404s and we recreate with the same id -- which 409s
    // because Google keeps the id reserved after a delete.
    const id = googleEventIdForSlug("meetup");
    const staleHash = "0".repeat(64);
    rows.push(eventRow("meetup", "Changed title"));
    connected({ meetup: { id, managedHash: staleHash } });
    mockedPatch.mockRejectedValueOnce(apiError(404));
    mockedCreate.mockRejectedValueOnce(apiError(409));
    mockedPatch.mockResolvedValueOnce({ id });

    const outcome = await syncUserCalendar("auth0|primary");

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(mockedPatch).toHaveBeenCalledTimes(2);
    expect(outcome.failures).toEqual([]);
    expect(mockedRecord.mock.calls.at(-1)?.[0]?.googleEventIds?.meetup).toBeDefined();
  });

  it("records a failure and keeps going when the conflict fallback also fails", async () => {
    rows.push(eventRow("a"), eventRow("b"));
    connected({});
    mockedCreate.mockRejectedValue(apiError(409));
    // First event's fallback fails too; the second event then succeeds.
    mockedPatch
      .mockRejectedValueOnce(apiError(500))
      .mockResolvedValue({ id: "bh-other" });

    const outcome = await syncUserCalendar("auth0|primary");

    // One bad event must not abort the rest of the calendar.
    expect(outcome.failures).toHaveLength(1);
    expect(outcome.failures[0].slug).toBe("a");
    expect(mockedRecord.mock.calls.at(-1)?.[0]?.googleEventIds?.b).toBeDefined();
  });

  it("does not swallow non-conflict create errors", async () => {
    rows.push(eventRow("only"));
    connected({});
    mockedCreate.mockRejectedValue(apiError(429));

    const outcome = await syncUserCalendar("auth0|primary");

    expect(mockedPatch).not.toHaveBeenCalled();
    expect(outcome.failures).toHaveLength(1);
  });
});
