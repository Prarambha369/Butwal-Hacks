import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Shared Mocks ───────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/analytics/server", () => ({
  captureServerEvent: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder ───────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "neq", "in",
    "order", "limit", "like", "ilike", "single", "maybeSingle",
    "insert", "update", "delete", "upsert",
  ] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as ReturnType<typeof createServiceClient> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
}

function mockSupabase() {
  const db = buildMockDb();
  mockedCreateServiceClient.mockReturnValue(db);
  return db;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setAuthenticated(sub = "auth0|12345") {
  mockedGetSession.mockResolvedValue({ user: { sub } });
}

function setProfileFound(db: ReturnType<typeof buildMockDb>, id = "profile-uuid") {
  db.single.mockResolvedValue({ data: { id }, error: null });
}

// ═══════════════════════════════════════════════════════════════════════════════
// createEvent
// ═══════════════════════════════════════════════════════════════════════════════

describe("createEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { createEvent } = await import("../events");

    const result = await createEvent({
      title: "Test Hackathon",
      description: "A test event",
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("creates event successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "new-event-id" }, error: null });

    const { createEvent } = await import("../events");
    const result = await createEvent({
      title: "Test Hackathon",
      description: "A test event",
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("new-event-id");
  });

  it("sanitizes title and description", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "new-id" }, error: null });

    const { createEvent } = await import("../events");
    await createEvent({
      title: '<script>alert("xss")</script>Hackathon',
      description: '<b>Bold</b> description with <script>evil</script>',
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });

    const insertCall = db.insert.mock.calls[0];
    expect(insertCall[0].title).not.toContain("<script>");
    expect(insertCall[0].title).toContain("Hackathon");
    expect(insertCall[0].description).not.toContain("<script>");
    expect(insertCall[0].description).toContain("Bold");
  });

  it("returns error on Supabase failure", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    // Supabase SDK errors are plain objects, not Error instances
    db.single.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { createEvent } = await import("../events");
    const result = await createEvent({
      title: "Fail", description: "", start_date: "", end_date: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to create event");
  });

  it("sets is_published to false by default", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "event-1" }, error: null });

    const { createEvent } = await import("../events");
    await createEvent({
      title: "Draft", description: "Draft event",
      start_date: "2026-06-01", end_date: "2026-06-02",
    });

    const insertData = db.insert.mock.calls[0][0];
    expect(insertData.is_published).toBe(false);
  });

  it("passes optional fields when provided", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "event-1" }, error: null });

    const { createEvent } = await import("../events");
    await createEvent({
      title: "Location Event", description: "With location",
      start_date: "2026-06-01", end_date: "2026-06-02",
      location: "Kathmandu",
      banner_url: "https://example.com/banner.jpg",
      is_published: true,
    });

    const insertData = db.insert.mock.calls[0][0];
    expect(insertData.location).toBe("Kathmandu");
    expect(insertData.banner_url).toBe("https://example.com/banner.jpg");
    expect(insertData.is_published).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// createChapterEvent
// ═══════════════════════════════════════════════════════════════════════════════

describe("createChapterEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { createChapterEvent } = await import("../events");

    const result = await createChapterEvent({
      chapterId: "chapter-1",
      title: "Chapter Hackathon",
      description: "A chapter event",
      start_date: "2026-07-01",
      end_date: "2026-07-02",
    }, "chapter-slug");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("creates chapter event with chapter_id", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "chapter-event-id" }, error: null });

    const { createChapterEvent } = await import("../events");
    const result = await createChapterEvent({
      chapterId: "chapter-1",
      title: "Chapter Event",
      description: "A chapter-specific event",
      start_date: "2026-07-01",
      end_date: "2026-07-02",
    }, "my-chapter");

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("chapter-event-id");

    const insertData = db.insert.mock.calls[0][0];
    expect(insertData.chapter_id).toBe("chapter-1");
    expect(insertData.title).toContain("Chapter Event");
  });

  it("returns error on DB failure", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    // Supabase SDK errors are plain objects, not Error instances
    db.single.mockResolvedValue({ data: null, error: { message: "Insert failed" } });

    const { createChapterEvent } = await import("../events");
    const result = await createChapterEvent({
      chapterId: "chapter-1", title: "Fail", description: "",
      start_date: "", end_date: "",
    }, "slug");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to create event");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// closeEvent
// ═══════════════════════════════════════════════════════════════════════════════

describe("closeEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { closeEvent } = await import("../events");

    const result = await closeEvent("event-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("returns error when event not found", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // single() calls: resolveProfileId (1st) → event lookup (2nd)
    db.single.mockResolvedValueOnce({ data: { id: "organizer-uuid" }, error: null }); // resolveProfileId
    db.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } }); // event NOT found

    const { closeEvent } = await import("../events");
    const result = await closeEvent("bad-id");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Event not found");
  });

  it("returns error when user is not the organizer", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // single() calls: resolveProfileId (1st) → event lookup (2nd)
    db.single.mockResolvedValueOnce({ data: { id: "my-uuid" }, error: null }); // resolveProfileId → profileId = "my-uuid"
    db.single.mockResolvedValueOnce({ data: { organizer_id: "other-organizer" }, error: null }); // event owned by other

    const { closeEvent } = await import("../events");
    const result = await closeEvent("event-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Only the organizer can close this event");
  });

  it("issues certificates to attended participants and closes event", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // closeEvent calls:
    //   0. resolveProfileId: from().select().eq().single() — 1 eq call (#0)
    //   1. event lookup: from().select().eq().single() — 1 eq call (#1)
    //   2. attendees: from().select().eq().eq() — 2 eq calls (#2, #3)
    //   3. cert insert: from().insert()
    //   4. event update: from().update().eq() — 1 eq call (#4)
    // eq mock order: #0,#1,#2 return db for chaining, #3 is terminal
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "organizer-uuid" }, error: null }); // #0: resolveProfileId
    db.single.mockResolvedValueOnce({ data: { organizer_id: "organizer-uuid" }, error: null }); // #1: event found
    db.eq.mockReturnValueOnce(db);                                    // #0: resolveProfileId eq — returns db for single() chain
    db.eq.mockReturnValueOnce(db);                                    // #1: event lookup eq — returns db for single() chain
    db.eq.mockReturnValueOnce(db);                                    // #2: attendees first eq — returns db for second eq
    db.eq.mockResolvedValueOnce({                                      // #3: attendees second eq — terminal
      data: [{ profile_id: "attendee-1" }, { profile_id: "attendee-2" }],
      error: null,
    });

    const { closeEvent } = await import("../events");
    const result = await closeEvent("event-1");

    expect(result.success).toBe(true);
    expect(result.issuedCount).toBe(2);
  });

  it("closes event with zero attendees", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "organizer-uuid" }, error: null }); // #0: resolveProfileId
    db.single.mockResolvedValueOnce({ data: { organizer_id: "organizer-uuid" }, error: null }); // #1: event found
    // eq order: #0 resolveProfileId → db, #1 event lookup → db, #2 attendees first → db, #3 attendees second → terminal
    db.eq.mockReturnValueOnce(db);                                    // #0: resolveProfileId
    db.eq.mockReturnValueOnce(db);                                    // #1: event lookup
    db.eq.mockReturnValueOnce(db);                                    // #2: attendees first eq → db for chaining
    db.eq.mockResolvedValueOnce({ data: [], error: null });            // #3: attendees second eq → terminal

    const { closeEvent } = await import("../events");
    const result = await closeEvent("event-1");

    expect(result.success).toBe(true);
    expect(result.issuedCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// submitEventFeedback
// ═══════════════════════════════════════════════════════════════════════════════

describe("submitEventFeedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { submitEventFeedback } = await import("../events");

    const result = await submitEventFeedback("event-1", 5, "Great event!");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("submits feedback successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.upsert.mockResolvedValue({ error: null });

    const { submitEventFeedback } = await import("../events");
    const result = await submitEventFeedback("event-1", 5, "Amazing hackathon!");

    expect(result.success).toBe(true);
    expect(db.upsert).toHaveBeenCalledTimes(1);
    const upsertData = db.upsert.mock.calls[0][0];
    expect(upsertData.event_id).toBe("event-1");
    expect(upsertData.rating).toBe(5);
  });

  it("sanitizes feedback comment", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.upsert.mockResolvedValue({ error: null });

    const { submitEventFeedback } = await import("../events");
    await submitEventFeedback("event-1", 3, '<script>alert("bad")</script>Nice event');

    const upsertData = db.upsert.mock.calls[0][0];
    expect(upsertData.comment).not.toContain("<script>");
    expect(upsertData.comment).toContain("Nice event");
  });

  it("handles Supabase error gracefully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    // Plain object error from Supabase SDK is not an Error instance,
    // so the catch returns the generic fallback message
    db.upsert.mockResolvedValue({ error: { message: "Upsert conflict" } });

    const { submitEventFeedback } = await import("../events");
    const result = await submitEventFeedback("event-1", 4, "Good");

    expect(result.success).toBe(false);
    expect(result.error).toBe("An unexpected error occurred");
  });

  it("sanitizes long comment to max length", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.upsert.mockResolvedValue({ error: null });

    const { submitEventFeedback } = await import("../events");
    const longComment = "A".repeat(3000);
    await submitEventFeedback("event-1", 5, longComment);

    const upsertData = db.upsert.mock.calls[0][0];
    expect(upsertData.comment.length).toBeLessThanOrEqual(2000);
  });
});
