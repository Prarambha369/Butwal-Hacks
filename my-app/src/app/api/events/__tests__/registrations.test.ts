import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "in", "or",
    "order", "limit", "range", "single", "maybeSingle",
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
    range: ReturnType<typeof vi.fn>;
  };
}

function mockRequest(url = "http://localhost:3000/api/events/evt-123/registrations"): Request {
  return new Request(url, { method: "GET" });
}

const EVENT_ID = "evt-123";

describe("GET /api/events/[eventId]/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|user1" } });
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when caller profile is missing", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValueOnce({ data: null, error: null }); // profile query returns null
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 404 when event is not found", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "caller-1", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: null, error: null }); // event query returns null
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Event not found");
  });

  it("returns 403 when caller is not event organizer or maintainer", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "caller-1", role: "hacker" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "other-organizer" }, error: null }); // event query
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns registrations and private cache header when caller is event organizer", async () => {
    const mockRegistrations = [
      { id: "reg-1", attended: true, profiles: { id: "p1", full_name: "Alice", bh_id: "bh1", avatar_url: null, email: "alice@example.com" } },
    ];
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "org-1", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "org-1" }, error: null }); // event query
    db.range.mockResolvedValueOnce({ data: mockRegistrations, error: null }); // registrations query
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registrations).toEqual(mockRegistrations);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=30");
  });

  it("returns registrations when caller is maintainer", async () => {
    const mockRegistrations = [
      { id: "reg-1", attended: false, profiles: { id: "p1", full_name: "Bob", bh_id: "bh2", avatar_url: null, email: "bob@example.com" } },
    ];
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "maint-1", role: "maintainer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "other-org" }, error: null }); // event query
    db.range.mockResolvedValueOnce({ data: mockRegistrations, error: null }); // registrations query
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registrations).toEqual(mockRegistrations);
  });

  it("returns 500 when database operation throws", async () => {
    const db = buildMockDb();
    db.single.mockImplementationOnce(() => {
      throw new Error("DB Connection Error");
    });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(mockRequest(), { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
  });
});
