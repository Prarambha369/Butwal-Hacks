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
    "from", "select", "eq", "range", "single",
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

const EVENT_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("GET /api/events/[eventId]/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
  });

  it("returns 401 when unauthenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { GET } = await import("../route");
    const req = new Request(`http://localhost:3000/api/events/${EVENT_ID}/registrations`);
    const res = await GET(req, { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when caller profile is missing", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValueOnce({ data: null, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../route");
    const req = new Request(`http://localhost:3000/api/events/${EVENT_ID}/registrations`);
    const res = await GET(req, { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Profile not found");
  });

  it("returns 404 when event is not found", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "caller-1", role: "organizer" }, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("Not found") });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../route");
    const req = new Request(`http://localhost:3000/api/events/${EVENT_ID}/registrations`);
    const res = await GET(req, { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Event not found");
  });

  it("returns 403 when user is neither event organizer nor maintainer", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "caller-1", role: "hacker" }, error: null })
      .mockResolvedValueOnce({ data: { organizer_id: "other-organizer" }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../route");
    const req = new Request(`http://localhost:3000/api/events/${EVENT_ID}/registrations`);
    const res = await GET(req, { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns registrations and private cache header for event organizer", async () => {
    const db = buildMockDb();
    const mockRegistrations = [
      { id: "reg-1", attended: true, profiles: { id: "p-1", full_name: "John Doe", email: "john@example.com" } }
    ];
    db.single
      .mockResolvedValueOnce({ data: { id: "organizer-1", role: "organizer" }, error: null })
      .mockResolvedValueOnce({ data: { organizer_id: "organizer-1" }, error: null });
    db.range.mockResolvedValueOnce({ data: mockRegistrations, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../route");
    const req = new Request(`http://localhost:3000/api/events/${EVENT_ID}/registrations`);
    const res = await GET(req, { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registrations).toEqual(mockRegistrations);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=30");
  });

  it("returns registrations for maintainer even if not organizer", async () => {
    const db = buildMockDb();
    const mockRegistrations = [
      { id: "reg-1", attended: true, profiles: { id: "p-1", full_name: "Jane Doe", email: "jane@example.com" } }
    ];
    db.single
      .mockResolvedValueOnce({ data: { id: "maintainer-1", role: "maintainer" }, error: null })
      .mockResolvedValueOnce({ data: { organizer_id: "other-organizer" }, error: null });
    db.range.mockResolvedValueOnce({ data: mockRegistrations, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../route");
    const req = new Request(`http://localhost:3000/api/events/${EVENT_ID}/registrations`);
    const res = await GET(req, { params: Promise.resolve({ eventId: EVENT_ID }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registrations).toEqual(mockRegistrations);
  });
});
