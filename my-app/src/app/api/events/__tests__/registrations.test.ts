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

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder ───────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "range", "single", "maybeSingle",
  ] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as ReturnType<typeof createServiceClient> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };
}

function mockRequest(url = "http://localhost:3000/api/events/event-123/registrations"): Request {
  return new Request(url, { method: "GET" });
}

describe("GET /api/events/[eventId]/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
  });

  it("returns 401 when unauthenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: "event-123" }) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when caller profile is not found", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValueOnce({ data: null, error: null }); // caller profile
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: "event-123" }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when event is not found", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "caller-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: null, error: new Error("Not found") }); // event query
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: "nonexistent-event" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Event not found");
  });

  it("returns 403 when caller is neither event organizer nor maintainer", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "caller-id", role: "hacker" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "other-organizer-id" }, error: null }); // event query
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: "event-123" }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 with registrations when caller is event organizer", async () => {
    const db = buildMockDb();
    const mockRegistrations = [
      { id: "reg-1", attended: false, profiles: { id: "p-1", full_name: "Alice", bh_id: "BH001", avatar_url: null, email: "alice@example.com" } },
    ];
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-id", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "organizer-id" }, error: null }); // event query
    db.range.mockResolvedValueOnce({ data: mockRegistrations, error: null });

    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: "event-123" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registrations).toEqual(mockRegistrations);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=30");
  });

  it("returns 200 with registrations when caller is maintainer", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "maintainer-id", role: "maintainer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "other-organizer-id" }, error: null }); // event query
    db.range.mockResolvedValueOnce({ data: [], error: null });

    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: "event-123" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registrations).toEqual([]);
  });
});
