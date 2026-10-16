import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn((handler) => handler),
  checkRateLimit: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";

const mockedCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;
const mockedGetSession = auth0.getSession as unknown as ReturnType<typeof vi.fn>;

// ─── Canonical schema keys ───────────────────────────────────────────────────
// profile_badges  : (profile_id, badge_id)          -- migration 008
// resource_completions: (profile_id, resource_id)   -- migration 035
// Neither table has an auth0_user_id column. The suite below asserts on the
// filter that is actually used, because the previous versions referenced a
// column that does not exist, so PostgREST answered 42703 and both routes
// returned 500 for every caller.

/** Records `.eq()` filters per table so a column can be asserted on the table
 *  that actually owns it. `profiles` legitimately holds auth0_user_id; the
 *  point is that `profile_badges` and `resource_completions` are filtered by
 *  profile_id instead. */
function buildMockDb() {
  const db: Record<string, unknown> = {};
  const filters: Record<string, Array<[string, unknown]>> = {};
  let current = "";
  const methods = ["select", "upsert", "range", "single"] as const;
  for (const m of methods) db[m] = vi.fn(() => db);
  db.from = vi.fn((table: string) => {
    current = table;
    return db;
  });
  db.eq = vi.fn((column: string, value: unknown) => {
    (filters[current] ??= []).push([column, value]);
    return db;
  });
  (db as { filters: unknown }).filters = filters;
  return db as unknown as Record<string, ReturnType<typeof vi.fn>> & {
    filters: Record<string, Array<[string, unknown]>>;
  };
}

function eqColumns(db: ReturnType<typeof buildMockDb>, table: string): string[] {
  return (db.filters[table] ?? []).map(([col]) => col);
}

function mockSupabase(profileId = "profile-uuid-1") {
  const db = buildMockDb();
  db.single.mockResolvedValue({ data: { id: profileId }, error: null });
  mockedCreateServiceClient.mockReturnValue(db);
  return { db, profileId };
}

function setAuthenticated(sub = "auth0|abc123") {
  mockedGetSession.mockResolvedValue({ user: { sub, email: "member@test.com" } });
}

beforeEach(() => vi.clearAllMocks());

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/badges/check
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/badges/check", () => {
  async function get() {
    const { GET } = await import("../badges/check/route");
    return (GET as unknown as (r: Request) => Promise<Response>)(
      new Request("http://localhost:3000/api/badges/check"),
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const res = await get();
    expect(res.status).toBe(401);
  });

  it("filters badges by profile_id, the key the table actually has", async () => {
    setAuthenticated();
    const { db } = mockSupabase();

    const res = await get();

    expect(res.status).toBe(200);
    expect(eqColumns(db, "profile_badges")).toContain("profile_id");
    // The Auth0 subject must never be used as a column on this table.
    expect(eqColumns(db, "profile_badges")).not.toContain("auth0_user_id");
  });

  it("returns 404 when the session has no profile row", async () => {
    setAuthenticated();
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: null, error: { message: "no rows", code: "PGRST116" } });
    mockedCreateServiceClient.mockReturnValue(db);

    const res = await get();

    expect(res.status).toBe(404);
    // Must not fall through to an unfiltered badge query.
    expect(db.range).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/resources/complete
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/resources/complete", () => {
  const RESOURCE_ID = "3f7c1e2a-9b4d-4c8e-8f21-5a6b7c8d9e0f";

  async function post(body: unknown) {
    const { POST } = await import("../resources/complete/route");
    return (POST as unknown as (r: Request) => Promise<Response>)(
      new Request("http://localhost:3000/api/resources/complete", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      }),
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const res = await post({ resource_id: RESOURCE_ID });
    expect(res.status).toBe(401);
  });

  it("returns 400 for a malformed resource id", async () => {
    setAuthenticated();
    mockSupabase();
    const res = await post({ resource_id: "not-a-uuid" });
    expect(res.status).toBe(400);
  });

  it("records the completion against profile_id", async () => {
    setAuthenticated();
    const { db, profileId } = mockSupabase();

    const res = await post({ resource_id: RESOURCE_ID });

    expect(res.status).toBe(200);
    const payload = db.upsert.mock.calls[0][0];
    expect(payload.profile_id).toBe(profileId);
    // Writing auth0_user_id here is the 42703 this replaces.
    expect(payload).not.toHaveProperty("auth0_user_id");
    expect(eqColumns(db, "resource_completions")).toHaveLength(0);
  });

  it("upserts on the primary key so a repeat submission does not collide", async () => {
    setAuthenticated();
    const { db } = mockSupabase();

    await post({ resource_id: RESOURCE_ID });

    expect(db.upsert.mock.calls[0][1]).toMatchObject({ onConflict: "profile_id,resource_id" });
  });

  it("returns 404 and writes nothing when the session has no profile row", async () => {
    setAuthenticated();
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: null, error: { message: "no rows", code: "PGRST116" } });
    mockedCreateServiceClient.mockReturnValue(db);

    const res = await post({ resource_id: RESOURCE_ID });

    expect(res.status).toBe(404);
    expect(db.upsert).not.toHaveBeenCalled();
  });
});