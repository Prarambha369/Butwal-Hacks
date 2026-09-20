import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

import { NextRequest } from "next/server";
import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["from", "select"] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as ReturnType<typeof createServiceClient> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  };
}

function mockRequestWithBearer(token: string): NextRequest {
  return new Request("http://localhost:3000/api/keep-alive", {
    headers: { Authorization: `Bearer ${token}` },
  }) as unknown as NextRequest;
}

describe("GET /api/keep-alive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    const db = buildMockDb();
    db.select.mockResolvedValue({ count: 0, error: null });
    mockedCreateServiceClient.mockReturnValue(db);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when unauthenticated and a cron secret is configured", async () => {
    vi.stubEnv("KEEP_ALIVE_SECRET", "test-cron-secret");
    mockedGetSession.mockResolvedValue(null);
    const { GET } = await import("../keep-alive/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("allows anonymous ping when no cron secret is configured (scheduled workflow)", async () => {
    vi.stubEnv("KEEP_ALIVE_SECRET", "");
    vi.stubEnv("CRON_SECRET", "");
    mockedGetSession.mockResolvedValue(null);
    const db = buildMockDb();
    db.select.mockResolvedValue({ count: 7, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../keep-alive/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.db_online).toBe(true);
    expect(body.profile_count).toBe(7);
  });

  it("accepts a valid cron bearer secret without a session", async () => {
    vi.stubEnv("KEEP_ALIVE_SECRET", "test-cron-secret");
    mockedGetSession.mockResolvedValue(null);
    const db = buildMockDb();
    db.select.mockResolvedValue({ count: 3, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../keep-alive/route");
    const res = await GET(mockRequestWithBearer("test-cron-secret"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.db_online).toBe(true);
  });

  it("rejects a wrong cron bearer secret", async () => {
    vi.stubEnv("KEEP_ALIVE_SECRET", "test-cron-secret");
    mockedGetSession.mockResolvedValue(null);

    const { GET } = await import("../keep-alive/route");
    const res = await GET(mockRequestWithBearer("wrong-secret"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 and db online status when authenticated", async () => {
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|123" } });
    const db = buildMockDb();
    db.select.mockResolvedValue({ count: 42, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../keep-alive/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.db_online).toBe(true);
    expect(body.profile_count).toBe(42);
  });

  it("returns 500 when Supabase query fails", async () => {
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|123" } });
    const db = buildMockDb();
    db.select.mockResolvedValue({ count: null, error: new Error("DB Connection Error") });
    mockedCreateServiceClient.mockReturnValue(db);

    const { GET } = await import("../keep-alive/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.status).toBe("error");
    expect(body.db_online).toBe(false);
  });
});
