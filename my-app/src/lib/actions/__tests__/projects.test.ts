import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Shared Mocks ───────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/analytics/server", () => ({
  captureServerEvent: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder ───────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "neq", "in", "or",
    "order", "limit", "range", "like", "ilike", "single", "maybeSingle",
    "insert", "update", "delete", "upsert",
  ] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as ReturnType<typeof createServiceClient> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    or: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
    ilike: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
}

function mockSupabase() {
  const db = buildMockDb();
  mockedCreateServiceClient.mockReturnValue(db);
  return db;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setAuthenticated(sub = "auth0|12345") {
  mockedGetSession.mockResolvedValue({ user: { sub } });
}

function setProfileFound(db: ReturnType<typeof buildMockDb>, id = "profile-uuid") {
  db.single.mockResolvedValue({ data: { id }, error: null });
}

// ═══════════════════════════════════════════════════════════════════════════════
// submitProject
// ═══════════════════════════════════════════════════════════════════════════════

describe("submitProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { submitProject } = await import("../projects");
    await expect(submitProject({
      title: "My Project",
      description: "A cool project",
      demoUrl: "",
      githubUrl: "",
      techStack: ["React"],
      eventId: null,
      teamId: null,
    })).rejects.toThrow("Unauthorized");
  });

  it("auto-creates profile when none exists and submits project", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: null, error: null });
    db.single.mockResolvedValueOnce({ data: { id: "project-1", title: "My Project" }, error: null });
    db.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { submitProject } = await import("../projects");
    const result = await submitProject({
      title: "My Project",
      description: "A cool project",
      demoUrl: "",
      githubUrl: "",
      techStack: ["React"],
      eventId: null,
      teamId: null,
    });

    expect(result.success).toBe(true);
    expect(result.project.id).toBe("project-1");
  });

  it("submits project successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "project-1", title: "My Project" }, error: null });

    const { submitProject } = await import("../projects");
    const result = await submitProject({
      title: "My Project",
      description: "A cool project description",
      demoUrl: "https://demo.example.com",
      githubUrl: "https://github.com/user/repo",
      techStack: ["React", "TypeScript"],
      eventId: null,
      teamId: null,
    });

    expect(result.success).toBe(true);
    expect(result.project.id).toBe("project-1");

    const insertData = db.insert.mock.calls[0][0];
    expect(insertData.title).toBe("My Project");
    expect(insertData.tech_stack).toEqual(["React", "TypeScript"]);
    expect(insertData.demo_url).toBe("https://demo.example.com");
    expect(insertData.github_verified).toBe(false);
  });

  it("submits project with event and team associations", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "project-1" }, error: null });

    const { submitProject } = await import("../projects");
    await submitProject({
      title: "Team Project",
      description: "Built by the team",
      demoUrl: "",
      githubUrl: "",
      techStack: ["Python"],
      eventId: "event-42",
      teamId: "team-7",
      category: "AI/ML" as any,
    });

    const insertData = db.insert.mock.calls[0][0];
    expect(insertData.event_id).toBe("event-42");
    expect(insertData.team_id).toBe("team-7");
    expect(insertData.category).toBe("AI/ML");
  });

  it("logs and throws on Supabase error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockReset();
    db.single.mockResolvedValue({ data: null, error: { message: "DB constraint violation" } });

    const { submitProject } = await import("../projects");
    await expect(submitProject({
      title: "Fail", description: "", demoUrl: "", githubUrl: "",
      techStack: [], eventId: null, teamId: null,
    })).rejects.toThrow("DB constraint violation");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getUserProjects
// ═══════════════════════════════════════════════════════════════════════════════

describe("getUserProjects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches projects for a user", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.order.mockResolvedValue({
      data: [
        { id: "p1", title: "Project 1", project_likes: [{ count: 5 }] },
        { id: "p2", title: "Project 2", project_likes: [{ count: 2 }] },
      ],
      error: null,
    });

    const { getUserProjects } = await import("../projects");
    const result = await getUserProjects("user-id");

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Project 1");
  });

  it("returns empty array on error", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.order.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { getUserProjects } = await import("../projects");
    const result = await getUserProjects("user-id");

    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// linkProjectToTeam
// ═══════════════════════════════════════════════════════════════════════════════

describe("linkProjectToTeam", () => {
  beforeEach(() => vi.clearAllMocks());

  it("links project to a team", async () => {
    const db = mockSupabase();
    db.update.mockReturnValue(db);
    db.eq.mockResolvedValue({ error: null });

    const { linkProjectToTeam } = await import("../projects");
    const result = await linkProjectToTeam("project-1", "team-1");

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ team_id: "team-1" });
  });

  it("throws on error", async () => {
    const db = mockSupabase();
    db.update.mockReturnValue(db);
    db.eq.mockResolvedValue({ error: { message: "Project not found" } });

    const { linkProjectToTeam } = await import("../projects");
    await expect(linkProjectToTeam("bad-id", "team-1")).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// generateImpactReport
// ═══════════════════════════════════════════════════════════════════════════════

describe("generateImpactReport", () => {
  beforeEach(() => vi.clearAllMocks());

  const mockProject = {
    id: "project-1",
    title: "My Project",
    tech_stack: ["React", "Node.js"],
    created_at: "2026-06-01T00:00:00Z",
    project_likes: [{ count: 10 }],
    project_views: [{ count: 150 }],
    comments: [{ count: 3 }],
    profile: { id: "profile-1", full_name: "Jane Doe", bh_id: "BH-26-001" },
  };

  it("generates report from project data", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.single.mockResolvedValue({ data: mockProject, error: null });

    const { generateImpactReport } = await import("../projects");
    const report = await generateImpactReport("project-1");

    expect(report.title).toBe("My Project");
    expect(report.likes).toBe(10);
    expect(report.views).toBe(150);
    expect(report.comments).toBe(3);
    expect(report.submittedBy.full_name).toBe("Jane Doe");
  });

  it("throws when project not found", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const { generateImpactReport } = await import("../projects");
    await expect(generateImpactReport("bad-id")).rejects.toThrow("Project not found");
  });

  it("handles null counts gracefully", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.single.mockResolvedValue({
      data: {
        ...mockProject,
        project_likes: null,
        project_views: null,
        comments: null,
      },
      error: null,
    });

    const { generateImpactReport } = await import("../projects");
    const report = await generateImpactReport("project-1");

    expect(report.likes).toBe(0);
    expect(report.views).toBe(0);
    expect(report.comments).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// toggleProjectLike
// ═══════════════════════════════════════════════════════════════════════════════

describe("toggleProjectLike", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { toggleProjectLike } = await import("../projects");
    await expect(toggleProjectLike("project-1")).rejects.toThrow("Unauthorized");
  });

  it("creates a like when none exists", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null });
    db.single.mockResolvedValueOnce({ data: null, error: null });

    const { toggleProjectLike } = await import("../projects");
    const result = await toggleProjectLike("project-1");

    expect(result.success).toBe(true);
  });

  it("removes a like when one already exists", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null });
    db.single.mockResolvedValueOnce({ data: { id: "like-1" }, error: null });
    db.delete.mockReturnValue(db);
    db.eq.mockReturnValue(db);

    const { toggleProjectLike } = await import("../projects");
    const result = await toggleProjectLike("project-1");

    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// updateProject
// ═══════════════════════════════════════════════════════════════════════════════

describe("updateProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { updateProject } = await import("../projects");
    await expect(updateProject("project-1", { title: "New" })).rejects.toThrow("Unauthorized");
  });

  it("throws error when project not found", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // single() calls: resolveProfileId (1st) → ownership check (2nd)
    db.single.mockResolvedValueOnce({ data: { id: "my-profile" }, error: null }); // resolveProfileId finds profile
    db.single.mockResolvedValueOnce({ data: null, error: null }); // ownership: project NOT found

    const { updateProject } = await import("../projects");
    await expect(updateProject("bad-id", { title: "New" })).rejects.toThrow("Project not found");
  });

  it("throws error when not the owner", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // single() calls: resolveProfileId (1st) → ownership check (2nd)
    db.single.mockResolvedValueOnce({ data: { id: "my-profile" }, error: null }); // resolveProfileId
    db.single.mockResolvedValueOnce({ data: { profile_id: "other-user" }, error: null }); // owned by someone else

    const { updateProject } = await import("../projects");
    await expect(updateProject("project-1", { title: "New" })).rejects.toThrow("You can only edit your own projects");
  });

  it("updates project when owner", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db, "my-profile");
    // single() calls: resolveProfileId → ownership check → update result
    db.single.mockResolvedValueOnce({ data: { id: "my-profile" }, error: null }); // resolveProfileId
    db.single.mockResolvedValueOnce({ data: { profile_id: "my-profile" }, error: null }); // ownership
    db.single.mockResolvedValueOnce({ data: { id: "project-1", title: "Updated Title" }, error: null }); // update result
    db.update.mockReturnValue(db);
    db.eq.mockReturnValue(db);

    const { updateProject } = await import("../projects");
    const result = await updateProject("project-1", { title: "Updated Title" });

    expect(result.success).toBe(true);
    expect(result.project.title).toBe("Updated Title");
  });

  it("only updates provided fields", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db, "my-profile");
    db.single.mockResolvedValueOnce({ data: { profile_id: "my-profile" }, error: null });
    db.single.mockResolvedValueOnce({ data: { id: "project-1" }, error: null });
    db.update.mockReturnValue(db);
    db.eq.mockReturnValue(db);

    const { updateProject } = await import("../projects");
    await updateProject("project-1", { description: "New desc only" });

    const updateArg = db.update.mock.calls[0][0];
    expect(updateArg.description).toBe("New desc only");
    expect(updateArg.title).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// deleteProject
// ═══════════════════════════════════════════════════════════════════════════════

describe("deleteProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { deleteProject } = await import("../projects");
    await expect(deleteProject("project-1")).rejects.toThrow("Unauthorized");
  });

  it("throws error when not the owner", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "my-uuid" }, error: null });
    db.single.mockResolvedValueOnce({ data: { profile_id: "other-uuid" }, error: null });

    const { deleteProject } = await import("../projects");
    await expect(deleteProject("project-1")).rejects.toThrow("You can only delete your own projects");
  });

  it("deletes likes then project when owner", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db, "my-uuid");
    db.single.mockResolvedValueOnce({ data: { profile_id: "my-uuid" }, error: null });
    db.delete.mockReturnValue(db);
    db.eq.mockReturnValue(db);

    const { deleteProject } = await import("../projects");
    const result = await deleteProject("project-1");

    expect(result.success).toBe(true);
    // Should delete likes first, then project
    expect(db.delete).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getFeaturedProjects
// ═══════════════════════════════════════════════════════════════════════════════

describe("getFeaturedProjects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns featured projects with default limit", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.limit.mockResolvedValue({
      data: [
        { id: "p1", title: "Featured 1", project_likes: [{ count: 10 }] },
        { id: "p2", title: "Featured 2", project_likes: [{ count: 5 }] },
        { id: "p3", title: "Featured 3", project_likes: [{ count: 3 }] },
      ],
      error: null,
    });

    const { getFeaturedProjects } = await import("../projects");
    const result = await getFeaturedProjects();

    expect(result).toHaveLength(3);
    expect(db.limit).toHaveBeenCalledWith(3);
  });

  it("respects custom limit", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.limit.mockResolvedValue({ data: [], error: null });

    const { getFeaturedProjects } = await import("../projects");
    await getFeaturedProjects(5);

    expect(db.limit).toHaveBeenCalledWith(5);
  });

  it("returns empty array on error", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.limit.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { getFeaturedProjects } = await import("../projects");
    const result = await getFeaturedProjects();

    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getPaginatedProjects
// ═══════════════════════════════════════════════════════════════════════════════

describe("getPaginatedProjects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated results with defaults", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.or.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.range.mockResolvedValue({
      data: [
        {
          id: "p1", title: "Project 1", description: "Desc",
          tech_stack: ["React"], category: "web", created_at: "2026-01-01",
          profile: { full_name: "Jane Doe" },
        },
      ],
      count: 1,
      error: null,
    });

    const { getPaginatedProjects } = await import("../projects");
    const result = await getPaginatedProjects({ profileId: "user-1", teamIds: [] });

    expect(result.data).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.page).toBe(0);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.data[0].profile_name).toBe("Jane Doe");
    expect(result.data[0].profile_initials).toBe("JD");
  });

  it("returns empty result on query error", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.or.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.range.mockResolvedValue({ data: null, count: null, error: { message: "DB error" } });

    const { getPaginatedProjects } = await import("../projects");
    const result = await getPaginatedProjects({ profileId: "user-1", teamIds: [] });

    expect(result.data).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("applies search and category filters", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.or.mockReturnValue(db);
    db.ilike.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.range.mockResolvedValue({ data: [], count: 0, error: null });

    const { getPaginatedProjects } = await import("../projects");
    await getPaginatedProjects({
      profileId: "user-1",
      teamIds: [],
      search: "hackathon",
      category: "AI",
    });

    expect(db.ilike).toHaveBeenCalledWith("title", "%hackathon%");
    expect(db.eq).toHaveBeenCalledWith("category", "AI");
  });

  it("handles empty teamIds by using profile_id filter", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.range.mockResolvedValue({ data: [], count: 0, error: null });

    const { getPaginatedProjects } = await import("../projects");
    await getPaginatedProjects({ profileId: "user-1", teamIds: [] });

    // Should use eq instead of or when teamIds is empty
    expect(db.or).not.toHaveBeenCalled();
    expect(db.eq).toHaveBeenCalledWith("profile_id", "user-1");
  });

  it("handles array profile data (normalizes to single)", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.or.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.range.mockResolvedValue({
      data: [{
        id: "p1", title: "Project", description: "Desc",
        tech_stack: [], category: null, created_at: "2026-01-01",
        profile: [{ full_name: "Array User" }],
      }],
      count: 1,
      error: null,
    });

    const { getPaginatedProjects } = await import("../projects");
    const result = await getPaginatedProjects({ profileId: "user-1", teamIds: ["team-1"] });

    expect(result.data[0].profile_name).toBe("Array User");
  });
});
