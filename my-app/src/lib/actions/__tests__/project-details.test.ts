import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createClient } from "@/utils/supabase/server";

const mockedCreateClient = createClient as any;

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "single", "order", "limit"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

describe("getProjectDetails", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns project with related data", async () => {
    const db = buildMockDb();
    mockedCreateClient.mockResolvedValue(db);

    const mockProject = {
      id: "proj-1",
      title: "My Project",
      profiles: { id: "prof-1", full_name: "Alice", avatar_url: null, bh_id: "BH-24-001" },
      teams: null,
      project_likes: [{ count: 5 }],
    };
    db.single.mockResolvedValue({ data: mockProject, error: null });

    const { getProjectDetails } = await import("../project-details");
    const result = await getProjectDetails("proj-1");

    expect(result).toEqual(mockProject);
    expect(db.eq).toHaveBeenCalledWith("id", "proj-1");
  });

  it("returns null when project not found", async () => {
    const db = buildMockDb();
    mockedCreateClient.mockResolvedValue(db);
    db.single.mockResolvedValue({ data: null, error: null });

    const { getProjectDetails } = await import("../project-details");
    const result = await getProjectDetails("proj-1");

    expect(result).toBeNull();
  });

  it("returns null on Supabase error", async () => {
    const db = buildMockDb();
    mockedCreateClient.mockResolvedValue(db);
    db.single.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { getProjectDetails } = await import("../project-details");
    const result = await getProjectDetails("proj-1");

    expect(result).toBeNull();
  });
});
