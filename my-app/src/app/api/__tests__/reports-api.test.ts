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

vi.mock("@/lib/sentry-span", () => ({
  withSentrySpan: vi.fn((_name: string, handler: () => unknown) => handler),
}));

import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";
const REPORT_ID = "660e8400-e29b-41d4-a716-446655440000";

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "in", "or", "neq",
    "order", "limit", "range", "single", "maybeSingle",
    "insert", "update", "delete",
  ] as const;
  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }
  return db as unknown as Record<string, ReturnType<typeof vi.fn>>;
}

/**
 * The mock builder returns itself for every method, so the value a query
 * resolves to is whatever the last method in the chain resolves to. The
 * report routes end a chain on `single()` (profile lookup, report insert) or
 * on `limit()` (the list query), and the tests below mock those.
 */
function mockRequest(body: unknown, method: "POST" | "PATCH" = "POST"): Request {
  return new Request("http://localhost:3000", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockGet(): Request {
  return new Request("http://localhost:3000", { method: "GET" });
}

const VALID_DETAILS =
  "The repository has commits from six months before the event started, which does not match the timeline.";

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/reports
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSession.mockResolvedValue({
      user: {
        sub: "auth0|12345",
        email: "staff@butwalhacks.com",
        email_verified: true,
      },
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);

    const { POST } = await import("../reports/route");
    const res = await POST(
      mockRequest({ category: "cheating", details: VALID_DETAILS, project_id: PROJECT_ID }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 when the details are too short to act on", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    const { POST } = await import("../reports/route");
    const res = await POST(
      mockRequest({ category: "cheating", details: "bad", project_id: PROJECT_ID }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("more detail");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns 400 when the report is about neither a project nor an event", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    const { POST } = await import("../reports/route");
    const res = await POST(
      mockRequest({ category: "cheating", details: VALID_DETAILS }),
    );

    expect(res.status).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("files a report and returns a reference id", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "profile-uuid", role: "hacker" }, error: null })
      .mockResolvedValueOnce({ data: { id: REPORT_ID }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { POST } = await import("../reports/route");
    const res = await POST(
      mockRequest({
        category: "cheating",
        details: VALID_DETAILS,
        project_id: PROJECT_ID,
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.report_id).toBe(REPORT_ID);

    const insertCall = db.insert.mock.calls[0][0];
    expect(insertCall.category).toBe("cheating");
    expect(insertCall.status).toBe("open");
    expect(insertCall.reported_by).toBe("profile-uuid");
    expect(insertCall.reporter_anonymous).toBe(false);
  });

  it("stores no reference to the reporter when the report is anonymous", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "profile-uuid", role: "hacker" }, error: null })
      .mockResolvedValueOnce({ data: { id: REPORT_ID }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { POST } = await import("../reports/route");
    const res = await POST(
      mockRequest({
        category: "cheating",
        details: VALID_DETAILS,
        project_id: PROJECT_ID,
        anonymous: true,
      }),
    );

    expect(res.status).toBe(201);
    const insertCall = db.insert.mock.calls[0][0];
    expect(insertCall.reported_by).toBeNull();
    expect(insertCall.reporter_anonymous).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/reports
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSession.mockResolvedValue({
      user: {
        sub: "auth0|12345",
        email: "staff@butwalhacks.com",
        email_verified: true,
      },
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);

    const { GET } = await import("../reports/route");
    const res = await GET(mockGet());

    expect(res.status).toBe(401);
  });

  it("lets a maintainer read every report", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "maintainer" }, error: null });
    db.limit.mockResolvedValue({ data: [{ id: REPORT_ID }], error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../reports/route");
    const res = await GET(mockGet());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reports).toHaveLength(1);
    // A maintainer is not scoped to their own events.
    expect(db.in).not.toHaveBeenCalled();
  });

  it("scopes an organizer to the events they run", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "organizer" }, error: null });
    db.limit.mockResolvedValue({ data: [], error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../reports/route");
    const res = await GET(mockGet());

    expect(res.status).toBe(200);
    expect(db.eq).toHaveBeenCalledWith("organizer_id", "profile-uuid");
  });

  it("does not give an organizer the reporter, the accused party, or the report body", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "organizer" }, error: null });
    db.limit.mockResolvedValue({ data: [], error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../reports/route");
    await GET(mockGet());

    const selected = db.select.mock.calls[0][0] as string;
    expect(selected).not.toContain("reported_by");
    expect(selected).not.toContain("subject_profile_id");
    expect(selected).not.toContain("details");
    expect(selected).not.toContain("resolution");
  });

  it("treats a maintainer-role account without a verified staff address as an ordinary caller", async () => {
    mockedGetSession.mockResolvedValue({
      user: { sub: "auth0|12345", email: "someone@example.com", email_verified: true },
    });
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "maintainer" }, error: null });
    db.limit.mockResolvedValue({ data: [], error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../reports/route");
    await GET(mockGet());

    const selected = db.select.mock.calls[0][0] as string;
    expect(selected).not.toContain("reported_by");
    expect(selected).not.toContain("details");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/reports
// ═══════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSession.mockResolvedValue({
      user: {
        sub: "auth0|12345",
        email: "staff@butwalhacks.com",
        email_verified: true,
      },
    });
  });

  it("returns 403 when the caller is not a maintainer", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "organizer" }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { PATCH } = await import("../reports/route");
    const res = await PATCH(
      mockRequest({ id: REPORT_ID, status: "resolved", resolution: "Looked into it" }, "PATCH"),
    );

    expect(res.status).toBe(403);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("refuses to close a report without a written resolution", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "maintainer" }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { PATCH } = await import("../reports/route");
    const res = await PATCH(mockRequest({ id: REPORT_ID, status: "resolved" }, "PATCH"));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("written resolution");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("records the resolver when a maintainer closes a report", async () => {
    const db = buildMockDb();
    db.single
      .mockResolvedValueOnce({ data: { id: "profile-uuid", role: "maintainer" }, error: null })
      .mockResolvedValueOnce({ data: { id: REPORT_ID, status: "resolved" }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { PATCH } = await import("../reports/route");
    const res = await PATCH(
      mockRequest({ id: REPORT_ID, status: "resolved", resolution: "Looked into it" }, "PATCH"),
    );

    expect(res.status).toBe(200);
    const updateCall = db.update.mock.calls[0][0];
    expect(updateCall.status).toBe("resolved");
    expect(updateCall.resolved_by).toBe("profile-uuid");
    expect(updateCall.resolved_at).toBeTruthy();
  });
});
