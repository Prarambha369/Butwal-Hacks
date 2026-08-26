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
    range: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };
}

describe("GET /api/events/[eventId]/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(new Request("http://localhost:3000/api/events/evt-1/registrations"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when caller profile is not found", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValueOnce({ data: null, error: null }); // profile query returns null
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(new Request("http://localhost:3000/api/events/evt-1/registrations"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when event is not found", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "user-1", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: null, error: { message: "Not found" } }); // event query returns error/null
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(new Request("http://localhost:3000/api/events/evt-1/registrations"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Event not found");
  });

  it("returns 403 when user is neither the organizer of the event nor a maintainer", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "user-hacker", role: "hacker" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "user-organizer" }, error: null }); // event query
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(new Request("http://localhost:3000/api/events/evt-1/registrations"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 200 with registrations when caller is the event organizer", async () => {
    const db = buildMockDb();
    const mockRegistrations = [
      { id: "reg-1", attended: true, profiles: { id: "user-2", full_name: "John Doe", bh_id: "BH-001", avatar_url: null, email: "john@example.com" } },
    ];
    db.single
      .mockResolvedValueOnce({ data: { id: "user-organizer", role: "organizer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "user-organizer" }, error: null }); // event query
    db.range.mockResolvedValueOnce({ data: mockRegistrations, error: null });

    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(new Request("http://localhost:3000/api/events/evt-1/registrations"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registrations).toEqual(mockRegistrations);
  });

  it("returns 200 with registrations when caller is a maintainer", async () => {
    const db = buildMockDb();
    const mockRegistrations = [
      { id: "reg-1", attended: true, profiles: { id: "user-2", full_name: "Jane Doe", bh_id: "BH-002", avatar_url: null, email: "jane@example.com" } },
    ];
    db.single
      .mockResolvedValueOnce({ data: { id: "user-maintainer", role: "maintainer" }, error: null }) // caller profile
      .mockResolvedValueOnce({ data: { organizer_id: "user-organizer" }, error: null }); // event query
    db.range.mockResolvedValueOnce({ data: mockRegistrations, error: null });

    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../[eventId]/registrations/route");
    const res = await GET(new Request("http://localhost:3000/api/events/evt-1/registrations"), {
      params: Promise.resolve({ eventId: "evt-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registrations).toEqual(mockRegistrations);
  });
});
