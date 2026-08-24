import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn((handler) => handler),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/validation", () => ({
  sanitizeUuid: vi.fn((v: string) => {
    // Simple UUID validator: return the input if it looks like a UUID, else empty
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(v) ? v : "";
  }),
  sanitizeUrl: vi.fn((v: string) => v),
  sanitizeString: vi.fn((v: string, max: number) => v?.slice(0, max)),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/analytics/server", () => ({
  captureServerEvent: vi.fn(),
}));

import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder ───────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "in", "or",
    "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete",
  ] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as ReturnType<typeof createServiceClient> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
}

function mockRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/events/checkin
// ═══════════════════════════════════════════════════════════════════════════════
describe("POST /api/events/checkin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
  });

  // ── Auth ──────────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../checkin/route");
    const res = await POST(mockRequest({ registration_id: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  // ── Schema Validation ─────────────────────────────────────────────

  it("returns 400 for invalid registration_id (non-UUID string)", async () => {
    const { POST } = await import("../checkin/route");
    const res = await POST(mockRequest({ registration_id: "not-a-uuid" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 for missing registration_id", async () => {
    const { POST } = await import("../checkin/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 for empty registration_id", async () => {
    const { POST } = await import("../checkin/route");
    const res = await POST(mockRequest({ registration_id: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request");
  });

  // ── Authorization ──────────────────────────────────────────────────

  it("returns 403 when caller profile is not found", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValueOnce({ data: null, error: null }); // profile query returns null
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 403 when caller is neither event organizer nor maintainer", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "caller-id", role: "hacker" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { attended: false, events: { organizer_id: "other-organizer-id" } }, error: null }); // reg query
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("allows maintainer to check in regardless of event organizer_id", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "caller-id", role: "maintainer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { attended: false, events: { organizer_id: "other-organizer-id" } }, error: null }) // reg query
      .mockResolvedValueOnce({ data: null, error: null }); // update result
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.attended).toBe(true);
  });

  // ── Toggle (attended not provided) ────────────────────────────────

  it("toggles attended when caller is event organizer (currently false → true)", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { attended: false, events: { organizer_id: "organizer-id" } }, error: null }) // reg query
      .mockResolvedValueOnce({ data: null, error: null }); // update result
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.attended).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ attended: true });
  });

  it("toggles attended when caller is event organizer (currently true → false)", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { attended: true, events: { organizer_id: "organizer-id" } }, error: null }) // reg query
      .mockResolvedValueOnce({ data: null, error: null }); // update result
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.attended).toBe(false);
    expect(db.update).toHaveBeenCalledWith({ attended: false });
  });

  it("returns 404 when registration not found for checkin", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: null, error: null }); // reg query returns null
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Registration not found");
  });

  // ── Explicit attended value ───────────────────────────────────────

  it("accepts attended: true to force check-in for event organizer", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { attended: false, events: { organizer_id: "organizer-id" } }, error: null }); // reg query
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID, attended: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.attended).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ attended: true });
  });

  it("accepts attended: false to force undo check-in for event organizer", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { attended: true, events: { organizer_id: "organizer-id" } }, error: null }); // reg query
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID, attended: false }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.attended).toBe(false);
    expect(db.update).toHaveBeenCalledWith({ attended: false });
  });

  // ── Error handling ────────────────────────────────────────────────

  it("returns 500 when Supabase update fails", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { attended: false, events: { organizer_id: "organizer-id" } }, error: null }); // reg query
    db.update.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValueOnce({ error: new Error("DB failure") }),
    });
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID, attended: true }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
  });

  it("returns 404 when registration query returns null data", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: null, error: new Error("Query failed") }); // reg query
    mockedCreateServiceClient.mockReturnValue(db);
    const { POST } = await import("../checkin/route");

    const res = await POST(mockRequest({ registration_id: VALID_UUID }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Registration not found");
  });
});
