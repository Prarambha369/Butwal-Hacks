import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = [
    "from", "select", "eq", "in", "or",
    "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete", "upsert",
  ];

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db;
}

function mockSupabase() {
  const db = buildMockDb();
  mockedCreateServiceClient.mockReturnValue(db);
  return db;
}

function setAuthenticated() {
  mockedGetSession.mockResolvedValue({
    user: { sub: "auth0|12345", email: "user@test.com" },
  });
}

function setNotAuthenticated() {
  mockedGetSession.mockResolvedValue(null);
}

// ═══════════════════════════════════════════════════════════════════════════════
// getTeamWorkspaces
// ═══════════════════════════════════════════════════════════════════════════════

describe("getTeamWorkspaces", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns workspaces for a team", async () => {
    setAuthenticated();
    const db = mockSupabase();
    const mockWorkspaces = [{ id: "ws-1", name: "Sprint 1", team_id: "team-1" }];
    db.order.mockResolvedValue({ data: mockWorkspaces, error: null });

    const { getTeamWorkspaces } = await import("../workspace-actions");
    const result = await getTeamWorkspaces("team-1");

    expect(result).toEqual(mockWorkspaces);
    expect(db.eq).toHaveBeenCalledWith("team_id", "team-1");
  });

  it("returns empty array when no workspaces", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.order.mockResolvedValue({ data: null, error: null });

    const { getTeamWorkspaces } = await import("../workspace-actions");
    const result = await getTeamWorkspaces("team-1");

    expect(result).toEqual([]);
  });

  it("throws when not authenticated", async () => {
    setNotAuthenticated();
    const { getTeamWorkspaces } = await import("../workspace-actions");
    await expect(getTeamWorkspaces("team-1")).rejects.toThrow("Unauthorized");
  });

  it("throws on Supabase error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.order.mockResolvedValue({ data: null, error: { message: "Query failed" } });

    const { getTeamWorkspaces } = await import("../workspace-actions");
    await expect(getTeamWorkspaces("team-1")).rejects.toThrow("Query failed");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// createWorkspace
// ═══════════════════════════════════════════════════════════════════════════════

describe("createWorkspace", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a workspace with name only", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: { id: "ws-new", name: "Sprint 2" }, error: null });

    const { createWorkspace } = await import("../workspace-actions");
    const result = await createWorkspace({ teamId: "team-1", name: "Sprint 2" });

    expect(result.id).toBe("ws-new");
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      team_id: "team-1",
      name: "Sprint 2",
      description: "",
    }));
  });

  it("creates a workspace with description", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: { id: "ws-new" }, error: null });

    const { createWorkspace } = await import("../workspace-actions");
    await createWorkspace({ teamId: "team-1", name: "Backend", description: "API tasks" });

    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      description: "API tasks",
    }));
  });

  it("throws when not authenticated", async () => {
    setNotAuthenticated();
    const { createWorkspace } = await import("../workspace-actions");
    await expect(createWorkspace({ teamId: "team-1", name: "Test" })).rejects.toThrow("Unauthorized");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// updateWorkspace
// ═══════════════════════════════════════════════════════════════════════════════

describe("updateWorkspace", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates workspace name", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: { id: "ws-1", name: "Updated" }, error: null });

    const { updateWorkspace } = await import("../workspace-actions");
    const result = await updateWorkspace("ws-1", { name: "Updated" });

    expect(result.name).toBe("Updated");
    expect(db.update).toHaveBeenCalledWith({ name: "Updated" });
    expect(db.eq).toHaveBeenCalledWith("id", "ws-1");
  });

  it("throws when not authenticated", async () => {
    setNotAuthenticated();
    const { updateWorkspace } = await import("../workspace-actions");
    await expect(updateWorkspace("ws-1", { name: "Test" })).rejects.toThrow("Unauthorized");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// deleteWorkspace
// ═══════════════════════════════════════════════════════════════════════════════

describe("deleteWorkspace", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a workspace by id", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.eq.mockResolvedValue({ error: null });

    const { deleteWorkspace } = await import("../workspace-actions");
    await deleteWorkspace("ws-1");

    expect(db.eq).toHaveBeenCalledWith("id", "ws-1");
  });

  it("throws when not authenticated", async () => {
    setNotAuthenticated();
    const { deleteWorkspace } = await import("../workspace-actions");
    await expect(deleteWorkspace("ws-1")).rejects.toThrow("Unauthorized");
  });

  it("throws on Supabase delete error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.eq.mockResolvedValue({ error: { message: "Delete failed" } });

    const { deleteWorkspace } = await import("../workspace-actions");
    await expect(deleteWorkspace("ws-1")).rejects.toThrow("Delete failed");
  });
});
