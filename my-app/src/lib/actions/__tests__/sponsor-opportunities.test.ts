import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
vi.mock("@/utils/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/validation", () => ({
  sanitizeString: vi.fn((s: string, max: number) => s.slice(0, max)),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

const mockedGetSession = auth0.getSession as any;
const mockedCreateServiceClient = createServiceClient as any;

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "in", "order", "limit", "single", "maybeSingle", "insert", "update", "delete", "range"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

function setAuthenticated() {
  mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345", email: "sponsor@test.com" } });
}

function setupSponsorProfile(db: any) {
  // getSponsorProfileId does two queries:
  // Chain 1: from("profiles").select("id").eq("auth0_user_id", ...).single()
  db.single.mockResolvedValueOnce({ data: { id: "prof-1" }, error: null });
  // Chain 2: from("sponsor_profiles").select("profile_id").eq("profile_id", profile.id).maybeSingle()
  db.maybeSingle.mockResolvedValueOnce({ data: { profile_id: "prof-1" }, error: null });
}

// ═══════════════════════════════════════════════════════════════════════════════
// createOpportunity
// ═══════════════════════════════════════════════════════════════════════════════

describe("createOpportunity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an opportunity successfully", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    setupSponsorProfile(db);
    db.insert.mockResolvedValue({ error: null });

    const { createOpportunity } = await import("../sponsor-opportunities");
    const result = await createOpportunity({
      title: "Build a Website",
      description: "Create a landing page",
      type: "bounty",
      is_bounty: true,
      bounty_amount: 500,
    });

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      type: "bounty",
      is_bounty: true,
      bounty_amount: 500,
    }));
  });

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);

    const { createOpportunity } = await import("../sponsor-opportunities");
    const result = await createOpportunity({ title: "Test", description: "Desc", type: "job" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("returns error on insert failure", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    setupSponsorProfile(db);
    db.insert.mockResolvedValue({ error: { message: "Insert failed" } });

    const { createOpportunity } = await import("../sponsor-opportunities");
    const result = await createOpportunity({ title: "Test", description: "Desc", type: "job" });

    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// applyForOpportunity
// ═══════════════════════════════════════════════════════════════════════════════

describe("applyForOpportunity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits an application", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.single.mockResolvedValue({ data: { id: "prof-1" }, error: null });
    db.insert.mockResolvedValue({ error: null });

    const { applyForOpportunity } = await import("../sponsor-opportunities");
    const result = await applyForOpportunity(VALID_UUID, "I'm interested!");

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      opportunity_id: VALID_UUID,
      profile_id: "prof-1",
    }));
  });

  it("returns error for duplicate application", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.single.mockResolvedValue({ data: { id: "prof-1" }, error: null });
    db.insert.mockResolvedValue({ error: { code: "23505", message: "Duplicate" } });

    const { applyForOpportunity } = await import("../sponsor-opportunities");
    const result = await applyForOpportunity(VALID_UUID);

    expect(result.success).toBe(false);
    expect(result.error).toContain("already applied");
  });

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);

    const { applyForOpportunity } = await import("../sponsor-opportunities");
    const result = await applyForOpportunity(VALID_UUID);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getPublicOpportunities
// ═══════════════════════════════════════════════════════════════════════════════

describe("getPublicOpportunities", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated results", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Count query: from().select("*", { count: 'exact', head: true }).eq("is_active", true)
    // Terminal is .eq() — returns count
    db.eq.mockResolvedValueOnce({ count: 5, error: null });
    // Data query: from().select("...").eq("is_active", true).order().range()
    // Terminal is .range() — returns data rows
    db.range.mockResolvedValue({
      data: [{ id: "opp-1", title: "Test", sponsor_profiles: { company_name: "Co" } }],
      error: null,
    });

    const { getPublicOpportunities } = await import("../sponsor-opportunities");
    const result = await getPublicOpportunities({ page: 1, per_page: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(5);
  });

  it("handles empty results gracefully", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.eq.mockResolvedValueOnce({ count: 0, error: null });
    db.range.mockResolvedValue({ data: null, error: null });

    const { getPublicOpportunities } = await import("../sponsor-opportunities");
    const result = await getPublicOpportunities();

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});
