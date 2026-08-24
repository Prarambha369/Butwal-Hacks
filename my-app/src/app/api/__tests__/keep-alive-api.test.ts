import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

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

describe("GET /api/keep-alive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
  });

  it("returns 401 when unauthenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { GET } = await import("../keep-alive/route");
    const res = await GET();
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
