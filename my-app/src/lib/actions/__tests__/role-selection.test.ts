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

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function setAuthenticated(overrides?: { email?: string; email_verified?: boolean }) {
  mockedGetSession.mockResolvedValue({
    user: {
      sub: "auth0|12345",
      email: overrides?.email ?? "user@test.com",
      email_verified: overrides?.email_verified ?? true,
    },
  });
}

function setNotAuthenticated() {
  mockedGetSession.mockResolvedValue(null);
}

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

// ═══════════════════════════════════════════════════════════════════════════════
// selectRole
// ═══════════════════════════════════════════════════════════════════════════════

describe("selectRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error for invalid role", async () => {
    const { selectRole } = await import("../role-selection");
    const result = await selectRole(makeFormData({ role: "superadmin" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid role selected.");
  });

  it("returns error when not authenticated", async () => {
    setNotAuthenticated();
    const { selectRole } = await import("../role-selection");
    const result = await selectRole(makeFormData({ role: "hacker" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated.");
  });

  it("selects hacker role successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { selectRole } = await import("../role-selection");
    // selectRole redirects on success (redirect throws)
    await expect(selectRole(makeFormData({ role: "hacker" }))).rejects.toThrow("NEXT_REDIRECT:/dashboard/hacker");

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.role).toBe("hacker");
    expect(db.eq).toHaveBeenCalledWith("auth0_user_id", "auth0|12345");
  });

  it("blocks maintainer role for non-butwalhacks.com email", async () => {
    setAuthenticated({ email: "user@gmail.com", email_verified: true });
    const { selectRole } = await import("../role-selection");
    const result = await selectRole(makeFormData({ role: "maintainer" }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("@butwalhacks.com");
  });

  it("blocks maintainer role when email not verified", async () => {
    setAuthenticated({ email: "admin@butwalhacks.com", email_verified: false });
    const { selectRole } = await import("../role-selection");
    const result = await selectRole(makeFormData({ role: "maintainer" }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("verify your email");
  });

  it("allows maintainer role with @butwalhacks.com and verified email", async () => {
    setAuthenticated({ email: "admin@butwalhacks.com", email_verified: true });

    const { selectRole } = await import("../role-selection");
    await expect(selectRole(makeFormData({ role: "maintainer" }))).rejects.toThrow("NEXT_REDIRECT:/dashboard/maintainer");
  });

  it("blocks organizer self-selection with suggestion to request access", async () => {
    setAuthenticated();
    const { selectRole } = await import("../role-selection");
    const result = await selectRole(makeFormData({ role: "organizer" }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("Request Access");
  });

  it("blocks sponsor self-selection with suggestion to request access", async () => {
    setAuthenticated();
    const { selectRole } = await import("../role-selection");
    const result = await selectRole(makeFormData({ role: "sponsor" }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("Request Access");
  });

  it("returns error on Supabase update failure", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.eq.mockResolvedValue({ error: { message: "DB error" } });

    const { selectRole } = await import("../role-selection");
    const result = await selectRole(makeFormData({ role: "hacker" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to update role. Please try again.");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// requestRoleUpgrade
// ═══════════════════════════════════════════════════════════════════════════════

describe("requestRoleUpgrade", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error for invalid requested role", async () => {
    const { requestRoleUpgrade } = await import("../role-selection");
    const result = await requestRoleUpgrade(makeFormData({ requestedRole: "hacker", message: "I want to help organize" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid role requested.");
  });

  it("returns error when message is too short", async () => {
    const { requestRoleUpgrade } = await import("../role-selection");
    const result = await requestRoleUpgrade(makeFormData({ requestedRole: "organizer", message: "Hi" }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("at least 10 characters");
  });

  it("returns error when not authenticated", async () => {
    setNotAuthenticated();
    const { requestRoleUpgrade } = await import("../role-selection");
    const result = await requestRoleUpgrade(makeFormData({ requestedRole: "organizer", message: "I want to organize events" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated.");
  });

  it("submits organizer upgrade request", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.maybeSingle.mockResolvedValue({ data: null, error: null }); // no pending request
    db.insert.mockResolvedValue({ error: null });

    const { requestRoleUpgrade } = await import("../role-selection");
    const result = await requestRoleUpgrade(makeFormData({
      requestedRole: "organizer",
      message: "I have experience running local hackathons",
    }));

    expect(result.success).toBe(true);
    expect(result.message).toContain("organizer");
    // Verify insert was called with correct fields
    const insertData = db.insert.mock.calls[0][0];
    expect(insertData.requested_role).toBe("organizer");
    expect(insertData.status).toBe("pending");
    expect(insertData.auth0_user_id).toBe("auth0|12345");
    expect(insertData.message).toBe("I have experience running local hackathons");
  });

  it("prevents duplicate pending organizer request", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.maybeSingle.mockResolvedValue({ data: { id: "existing-req", status: "pending" }, error: null });

    const { requestRoleUpgrade } = await import("../role-selection");
    const result = await requestRoleUpgrade(makeFormData({
      requestedRole: "organizer",
      message: "I want to be an organizer",
    }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("pending");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("trims and slices message to 1000 chars", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.maybeSingle.mockResolvedValue({ data: null, error: null });
    db.insert.mockResolvedValue({ error: null });

    const { requestRoleUpgrade } = await import("../role-selection");
    await requestRoleUpgrade(makeFormData({
      requestedRole: "sponsor",
      message: "  " + "M".repeat(2000) + "  ",
    }));

    const insertData = db.insert.mock.calls[0][0];
    expect(insertData.message.length).toBe(1000);
    expect(insertData.message).not.toContain("  "); // trimmed
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getPendingRoleRequests
// ═══════════════════════════════════════════════════════════════════════════════

describe("getPendingRoleRequests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when not authenticated", async () => {
    setNotAuthenticated();
    const { getPendingRoleRequests } = await import("../role-selection");
    const result = await getPendingRoleRequests();
    expect(result).toEqual([]);
  });

  it("returns empty array when user is not a maintainer", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: { role: "hacker", email: "user@test.com" }, error: null });

    const { getPendingRoleRequests } = await import("../role-selection");
    const result = await getPendingRoleRequests();
    expect(result).toEqual([]);
  });

  it("returns pending requests for maintainers", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: { role: "maintainer", email: "admin@butwalhacks.com" }, error: null });
    const mockRequests = [{ id: "req-1", status: "pending" }];
    db.order.mockResolvedValue({ data: mockRequests, error: null });

    const { getPendingRoleRequests } = await import("../role-selection");
    const result = await getPendingRoleRequests();

    expect(result).toEqual(mockRequests);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// approveRoleRequest
// ═══════════════════════════════════════════════════════════════════════════════

describe("approveRoleRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error for missing request ID", async () => {
    const { approveRoleRequest } = await import("../role-selection");
    const result = await approveRoleRequest(makeFormData({ action: "approve" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid request.");
  });

  it("returns error for invalid action", async () => {
    const { approveRoleRequest } = await import("../role-selection");
    const result = await approveRoleRequest(makeFormData({ requestId: "req-1", action: "delete" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid request.");
  });

  it("returns error when not authenticated", async () => {
    setNotAuthenticated();
    const { approveRoleRequest } = await import("../role-selection");
    const result = await approveRoleRequest(makeFormData({ requestId: "req-1", action: "approve" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated.");
  });

  it("returns error when caller is not a maintainer", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: { role: "hacker", email: "user@test.com" }, error: null });

    const { approveRoleRequest } = await import("../role-selection");
    const result = await approveRoleRequest(makeFormData({ requestId: "req-1", action: "approve" }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("Only maintainers");
  });

  it("approves request and updates user role", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // First single(): check maintainer role
    db.single.mockResolvedValueOnce({ data: { role: "maintainer", email: "admin@butwalhacks.com" }, error: null });
    // Second single(): fetch the request
    db.single.mockResolvedValueOnce({
      data: { id: "req-1", requested_role: "organizer", auth0_user_id: "auth0|target" },
      error: null,
    });

    const { approveRoleRequest } = await import("../role-selection");
    const result = await approveRoleRequest(makeFormData({ requestId: "req-1", action: "approve" }));

    expect(result.success).toBe(true);
    // Should update the user's profile role
    expect(db.update).toHaveBeenCalledWith({ role: "organizer" });
    const eqCalls = db.eq.mock.calls;
    const profileUpdate = eqCalls.find(c => c[0] === "auth0_user_id" && c[1] === "auth0|target");
    expect(profileUpdate).toBeDefined();
  });

  it("rejects request without updating role", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValueOnce({ data: { role: "maintainer", email: "admin@butwalhacks.com" }, error: null });
    db.single.mockResolvedValueOnce({
      data: { id: "req-1", requested_role: "organizer", auth0_user_id: "auth0|target" },
      error: null,
    });

    const { approveRoleRequest } = await import("../role-selection");
    const result = await approveRoleRequest(makeFormData({ requestId: "req-1", action: "reject" }));

    expect(result.success).toBe(true);
    expect(result.message).toContain("rejected");
  });

  it("returns error when request not found", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValueOnce({ data: { role: "maintainer", email: "admin@butwalhacks.com" }, error: null });
    db.single.mockResolvedValueOnce({ data: null, error: null });

    const { approveRoleRequest } = await import("../role-selection");
    const result = await approveRoleRequest(makeFormData({ requestId: "req-99", action: "approve" }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Request not found.");
  });
});
