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
  sanitizeUuid: vi.fn((v: string) => v),
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
    in: ReturnType<typeof vi.fn>;
    or: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

function mockRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/events/register
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/events/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../events/register/route");
    const res = await POST(mockRequest({ event_id: "some-uuid" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when profile not found", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: null, error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../events/register/route");
    const res = await POST(mockRequest({ event_id: "some-uuid" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Profile not found");
  });

  it("looks up profile by auth0_user_id", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null });
    db.insert.mockResolvedValue({ error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../events/register/route");
    await POST(mockRequest({ event_id: "some-uuid" }));

    const eqCalls = db.eq.mock.calls;
    const auth0Query = eqCalls.find(c => c[0] === "auth0_user_id");
    expect(auth0Query).toBeDefined();
    expect(auth0Query![1]).toBe("auth0|12345");
  });

  it("returns 201 on successful registration", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null });
    db.insert.mockResolvedValue({ error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../events/register/route");
    const res = await POST(mockRequest({ event_id: "valid-uuid" }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/teams
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../teams/route");
    const res = await POST(mockRequest({ name: "Test Team", event_id: "some-uuid" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when profile not found", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: null, error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../teams/route");
    const res = await POST(mockRequest({ name: "Test Team", event_id: "some-uuid" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Profile not found");
  });

  it("looks up profile by auth0_user_id", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // profile
    db.single.mockResolvedValueOnce({ data: { id: "team-uuid" }, error: null }); // team insert
    // NOTE: deliberately NOT setting db.insert.mockResolvedValue — the teams
    // route uses insert().select().single() chaining, and mockResolvedValue
    // would replace the mock with a Promise, breaking the chain. The default
    // vi.fn(() => db) return is what keeps the chain intact.
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../teams/route");
    await POST(mockRequest({ name: "Test Team" }));

    const eqCalls = db.eq.mock.calls;
    const auth0Query = eqCalls.find(c => c[0] === "auth0_user_id");
    expect(auth0Query).toBeDefined();
    expect(auth0Query![1]).toBe("auth0|12345");
  });

  it("creates team and adds creator as captain", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // profile
    db.single.mockResolvedValueOnce({ data: { id: "team-uuid", name: "Test Team" }, error: null }); // team inserted
    // Same reason as above — insert() must keep returning db for chaining
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../teams/route");
    const res = await POST(mockRequest({ name: "Test Team", event_id: "event-uuid" }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.team.name).toBe("Test Team");

    // Verify captain was added as team member (second insert call)
    expect(db.insert).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/projects
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../projects/route");
    const res = await POST(mockRequest({ title: "My Project", description: "A cool project" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when profile not found", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: null, error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../projects/route");
    const res = await POST(mockRequest({ title: "My Project", description: "A cool project" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Profile not found");
  });

  it("looks up profile by auth0_user_id", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null });
    db.insert.mockResolvedValue({ error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../projects/route");
    await POST(mockRequest({ title: "My Project", description: "A cool project" }));

    const eqCalls = db.eq.mock.calls;
    const auth0Query = eqCalls.find(c => c[0] === "auth0_user_id");
    expect(auth0Query).toBeDefined();
    expect(auth0Query![1]).toBe("auth0|12345");
  });

  it("returns 201 on successful project creation", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null });
    db.insert.mockResolvedValue({ error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../projects/route");
    const res = await POST(mockRequest({
      title: "My Project",
      description: "A cool project description",
      github_url: "https://github.com/user/repo",
      demo_url: "https://demo.example.com",
      tech_stack: ["React"],
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("rejects request with missing title", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    const { POST } = await import("../projects/route");
    const res = await POST(mockRequest({ description: "Missing title" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid project data");
  });
});
