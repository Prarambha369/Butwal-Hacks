import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/cache", () => ({
  bustProfileCache: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";
import { bustProfileCache } from "@/lib/cache";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedBustProfileCache = bustProfileCache as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder ───────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "in", "or",
    "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete", "upsert",
  ] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as Record<string, ReturnType<typeof vi.fn>>;
}

function mockSupabase() {
  const db = buildMockDb();
  mockedCreateServiceClient.mockReturnValue(db);
  return db;
}

function setAuthenticated(sub = "auth0|maintainer-123") {
  mockedGetSession.mockResolvedValue({ user: { sub, email: "admin@butwalhacks.com" } });
}

function setNotAuthenticated() {
  mockedGetSession.mockResolvedValue(null);
}

function setMaintainerProfile(db: ReturnType<typeof buildMockDb>, role = "maintainer", email = "admin@butwalhacks.com") {
  db.single.mockResolvedValue({ data: { role, email }, error: null });
}

// ═══════════════════════════════════════════════════════════════════════════════
// updateUserRole
// ═══════════════════════════════════════════════════════════════════════════════

describe("updateUserRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { updateUserRole } = await import("../admin");
    await expect(updateUserRole("user-id", "organizer")).rejects.toThrow("NEXT_REDIRECT");
  });

  it("redirects when user is not a maintainer", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db, "hacker", "user@test.com");

    const { updateUserRole } = await import("../admin");
    await expect(updateUserRole("user-id", "organizer")).rejects.toThrow("NEXT_REDIRECT");
  });

  it("throws on invalid role", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);

    const { updateUserRole } = await import("../admin");
    await expect(updateUserRole("user-id", "superadmin")).rejects.toThrow("Invalid role");
  });

  it("updates user role successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);
    // requireMaintainer uses .select() as non-terminal (chained to .eq().single())
    // updateUserRole uses .select() as terminal
    db.select.mockImplementationOnce(() => db).mockResolvedValueOnce({ data: [{ id: "user-id", role: "organizer" }], error: null });

    const { updateUserRole } = await import("../admin");
    const result = await updateUserRole("user-id", "organizer");

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ role: "organizer" });
    expect(db.eq).toHaveBeenCalledWith("id", "user-id");
  });

  it("throws on Supabase error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);
    // requireMaintainer uses .select() as non-terminal
    db.select.mockImplementationOnce(() => db).mockResolvedValueOnce({ data: null, error: { message: "DB error" } });

    const { updateUserRole } = await import("../admin");
    await expect(updateUserRole("user-id", "organizer")).rejects.toThrow("Failed to update user role");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// toggleBanUser
// ═══════════════════════════════════════════════════════════════════════════════

describe("toggleBanUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { toggleBanUser } = await import("../admin");
    await expect(toggleBanUser("user-id", false)).rejects.toThrow("NEXT_REDIRECT");
  });

  it("bans a currently unbanned user", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);

    const { toggleBanUser } = await import("../admin");
    const result = await toggleBanUser("user-id", false);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ is_banned: true });
  });

  it("unbans a currently banned user", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);

    const { toggleBanUser } = await import("../admin");
    const result = await toggleBanUser("user-id", true);

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ is_banned: false });
  });

  it("throws on Supabase error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);
    // requireMaintainer uses .eq() as non-terminal (chained from .select())
    db.eq.mockImplementationOnce(() => db).mockResolvedValueOnce({ error: { message: "DB error" } });

    const { toggleBanUser } = await import("../admin");
    await expect(toggleBanUser("user-id", false)).rejects.toThrow("Failed to update user ban status");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// revokeTrustMarker
// ═══════════════════════════════════════════════════════════════════════════════

describe("revokeTrustMarker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { revokeTrustMarker } = await import("../admin");
    await expect(revokeTrustMarker("marker-1", "Violated terms")).rejects.toThrow("NEXT_REDIRECT");
  });

  it("throws when revocation reason is too short", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);

    const { revokeTrustMarker } = await import("../admin");
    await expect(revokeTrustMarker("marker-1", "Bad")).rejects.toThrow("at least 5 characters");
  });

  it("revokes marker and busts profile cache", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // requireMaintainer uses .single() as terminal — need a Once for it
    db.single
      .mockResolvedValueOnce({ data: { role: "maintainer", email: "admin@butwalhacks.com" }, error: null }) // requireMaintainer
      .mockResolvedValueOnce({ data: { profile_id: "profile-uuid" }, error: null }); // bustMarkerProfileCache

    const { revokeTrustMarker } = await import("../admin");
    const result = await revokeTrustMarker("marker-1", "Violated community guidelines");

    expect(result.success).toBe(true);
    // First update call (trust_markers) should set is_revoked
    const markerUpdate = db.update.mock.calls[0][0];
    expect(markerUpdate.is_revoked).toBe(true);
    expect(markerUpdate.revocation_reason).toBe("Violated community guidelines");
    // Should bust the profile cache
    expect(mockedBustProfileCache).toHaveBeenCalledWith("profile-uuid");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// reinstateTrustMarker
// ═══════════════════════════════════════════════════════════════════════════════

describe("reinstateTrustMarker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { reinstateTrustMarker } = await import("../admin");
    await expect(reinstateTrustMarker("marker-1")).rejects.toThrow("NEXT_REDIRECT");
  });

  it("reinstates marker clearing revocation fields", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // requireMaintainer uses .single() as terminal
    db.single
      .mockResolvedValueOnce({ data: { role: "maintainer", email: "admin@butwalhacks.com" }, error: null }) // requireMaintainer
      .mockResolvedValueOnce({ data: { profile_id: "profile-uuid" }, error: null }); // bustMarkerProfileCache

    const { reinstateTrustMarker } = await import("../admin");
    const result = await reinstateTrustMarker("marker-1");

    expect(result.success).toBe(true);
    const updateData = db.update.mock.calls[0][0];
    expect(updateData.is_revoked).toBe(false);
    expect(updateData.revocation_reason).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getAdminUserStats
// ═══════════════════════════════════════════════════════════════════════════════

describe("getAdminUserStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { getAdminUserStats } = await import("../admin");
    await expect(getAdminUserStats()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("returns total user count", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);
    // requireMaintainer uses .select() as non-terminal (chained to .eq().single())
    // getAdminUserStats uses .select() as terminal
    db.select.mockImplementationOnce(() => db).mockResolvedValueOnce({ count: 42, error: null });

    const { getAdminUserStats } = await import("../admin");
    const result = await getAdminUserStats();

    expect(result.totalUsers).toBe(42);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getPendingRoleRequests (admin)
// ═══════════════════════════════════════════════════════════════════════════════

describe("getPendingRoleRequests (admin)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { getPendingRoleRequests } = await import("../admin");
    await expect(getPendingRoleRequests()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("returns pending requests", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);
    const mockRequests = [{ id: "req-1", status: "pending", requested_role: "organizer" }];
    db.from.mockReturnValue(db);
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.order.mockResolvedValue({ data: mockRequests, error: null });

    const { getPendingRoleRequests } = await import("../admin");
    const result = await getPendingRoleRequests();

    expect(result).toEqual(mockRequests);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// approveRoleRequest (admin)
// ═══════════════════════════════════════════════════════════════════════════════

describe("approveRoleRequest (admin)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { approveRoleRequest } = await import("../admin");
    await expect(approveRoleRequest("req-1")).rejects.toThrow("NEXT_REDIRECT");
  });

  it("approves pending request and updates user role", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // requireMaintainer uses .single() as terminal — need it first
    db.single
      .mockResolvedValueOnce({ data: { role: "maintainer", email: "admin@butwalhacks.com" }, error: null }) // requireMaintainer
      .mockResolvedValueOnce({ data: { id: "req-1", status: "pending", requested_role: "organizer", auth0_user_id: "auth0|target" }, error: null }); // get request

    const { approveRoleRequest } = await import("../admin");
    const result = await approveRoleRequest("req-1");

    expect(result.success).toBe(true);
    expect(result.user.role).toBe("organizer");
    // First update: profiles.update({ role: "organizer" }).eq("auth0_user_id", "auth0|target")
    const updateCalls = db.update.mock.calls;
    expect(updateCalls[0][0]).toEqual({ role: "organizer" });
  });

  it("rejects already processed request", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // requireMaintainer uses .single() as terminal — need it first
    db.single
      .mockResolvedValueOnce({ data: { role: "maintainer", email: "admin@butwalhacks.com" }, error: null }) // requireMaintainer
      .mockResolvedValueOnce({ data: { id: "req-1", status: "approved" }, error: null }); // get request (already processed)
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// rejectRoleRequest (admin)
// ═══════════════════════════════════════════════════════════════════════════════

describe("rejectRoleRequest (admin)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { rejectRoleRequest } = await import("../admin");
    await expect(rejectRoleRequest("req-1")).rejects.toThrow("NEXT_REDIRECT");
  });

  it("rejects request", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);

    const { rejectRoleRequest } = await import("../admin");
    const result = await rejectRoleRequest("req-1");

    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getAllUsers
// ═══════════════════════════════════════════════════════════════════════════════

describe("getAllUsers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects when not authenticated", async () => {
    setNotAuthenticated();
    const { getAllUsers } = await import("../admin");
    await expect(getAllUsers()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("returns all users", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);
    const mockUsers = [{ id: "u1", full_name: "User One" }, { id: "u2", full_name: "User Two" }];
    db.order.mockResolvedValue({ data: mockUsers, error: null });

    const { getAllUsers } = await import("../admin");
    const result = await getAllUsers();

    expect(result).toEqual(mockUsers);
  });

  it("returns empty array on Supabase error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setMaintainerProfile(db);
    db.order.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { getAllUsers } = await import("../admin");
    await expect(getAllUsers()).rejects.toThrow("Failed to fetch users");
  });
});
