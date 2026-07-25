import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = [
    "from", "select", "eq", "in", "or",
    "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete", "upsert", "returns",
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
// getWorkspaceTasks
// ═══════════════════════════════════════════════════════════════════════════════

describe("getWorkspaceTasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns tasks for a workspace", async () => {
    setAuthenticated();
    const db = mockSupabase();
    const mockTasks = [{ id: "task-1", title: "Build UI", status: "todo", position: 0 }];
    db.returns.mockResolvedValue({ data: mockTasks, error: null });

    const { getWorkspaceTasks } = await import("../task-actions");
    const result = await getWorkspaceTasks("ws-1");

    expect(result).toEqual(mockTasks);
    expect(db.eq).toHaveBeenCalledWith("workspace_id", "ws-1");
    expect(db.order).toHaveBeenCalledWith("position", { ascending: true });
  });

  it("returns empty array when no tasks exist", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.returns.mockResolvedValue({ data: null, error: null });

    const { getWorkspaceTasks } = await import("../task-actions");
    const result = await getWorkspaceTasks("ws-1");

    expect(result).toEqual([]);
  });

  it("throws when not authenticated", async () => {
    setNotAuthenticated();
    const { getWorkspaceTasks } = await import("../task-actions");
    await expect(getWorkspaceTasks("ws-1")).rejects.toThrow("Unauthorized");
  });

  it("throws on Supabase error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.returns.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { getWorkspaceTasks } = await import("../task-actions");
    await expect(getWorkspaceTasks("ws-1")).rejects.toThrow("DB error");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// createTask
// ═══════════════════════════════════════════════════════════════════════════════

describe("createTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a task with default priority and status", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.maybeSingle.mockResolvedValue({ data: null, error: null }); // no last task
    db.single.mockResolvedValue({ data: { id: "task-new", title: "New Task", status: "todo", position: 0 }, error: null });

    const { createTask } = await import("../task-actions");
    const result = await createTask({ workspaceId: "ws-1", title: "New Task" });

    expect(result.id).toBe("task-new");
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: "ws-1",
      title: "New Task",
      status: "todo",
      priority: "medium",
      position: 0,
    }));
  });

  it("assigns next position after the last task", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.maybeSingle.mockResolvedValue({ data: { position: 5 }, error: null });
    db.single.mockResolvedValue({ data: { id: "task-new" }, error: null });

    const { createTask } = await import("../task-actions");
    await createTask({ workspaceId: "ws-1", title: "Another Task" });

    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ position: 6 }));
  });

  it("throws when not authenticated", async () => {
    setNotAuthenticated();
    const { createTask } = await import("../task-actions");
    await expect(createTask({ workspaceId: "ws-1", title: "Test" })).rejects.toThrow("Unauthorized");
  });

  it("throws on Supabase insert error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.maybeSingle.mockResolvedValue({ data: null, error: null });
    db.single.mockResolvedValue({ data: null, error: { message: "Insert failed" } });

    const { createTask } = await import("../task-actions");
    await expect(createTask({ workspaceId: "ws-1", title: "Test" })).rejects.toThrow("Insert failed");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// updateTask
// ═══════════════════════════════════════════════════════════════════════════════

describe("updateTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates task status", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: { id: "task-1", status: "in_progress" }, error: null });

    const { updateTask } = await import("../task-actions");
    const result = await updateTask("task-1", { status: "in_progress" });

    expect(result.status).toBe("in_progress");
    expect(db.update).toHaveBeenCalledWith({ status: "in_progress" });
    expect(db.eq).toHaveBeenCalledWith("id", "task-1");
  });

  it("throws when not authenticated", async () => {
    setNotAuthenticated();
    const { updateTask } = await import("../task-actions");
    await expect(updateTask("task-1", { title: "Updated" })).rejects.toThrow("Unauthorized");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// deleteTask
// ═══════════════════════════════════════════════════════════════════════════════

describe("deleteTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a task by id", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.eq.mockResolvedValue({ error: null });

    const { deleteTask } = await import("../task-actions");
    await deleteTask("task-1");

    expect(db.eq).toHaveBeenCalledWith("id", "task-1");
  });

  it("throws when not authenticated", async () => {
    setNotAuthenticated();
    const { deleteTask } = await import("../task-actions");
    await expect(deleteTask("task-1")).rejects.toThrow("Unauthorized");
  });

  it("throws on Supabase delete error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.eq.mockResolvedValue({ error: { message: "Delete failed" } });

    const { deleteTask } = await import("../task-actions");
    await expect(deleteTask("task-1")).rejects.toThrow("Delete failed");
  });
});
