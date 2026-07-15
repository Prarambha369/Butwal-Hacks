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

vi.mock("@/lib/posthog-logger", () => ({
  posthogLog: { info: vi.fn(), error: vi.fn() },
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
    "order", "limit", "like", "single", "maybeSingle",
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

function setProfileNotFound(db: ReturnType<typeof buildMockDb>) {
  db.single.mockResolvedValue({ data: null, error: null });
  // Profile auto-creation (upsert) chain:
  db.maybeSingle.mockResolvedValue({ data: null, error: null });
  // NOTE: db.insert is intentionally NOT mocked with mockResolvedValue here —
  // the default chain behavior (vi.fn(() => db)) works for upsertProfile's
  // await supabase.from(...).insert({...}) because await db returns db
  // and { error } from db is undefined (falsy), so the upsert succeeds.
  // Using mockResolvedValue would break chained calls like .insert().select().single().
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("createEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { createEvent } = await import("../events");

    const result = await createEvent({
      title: "Test Hackathon",
      description: "A test event",
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("auto-creates profile when none exists and creates event", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: null, error: null }); // profile not found → triggers auto-creation
    db.single.mockResolvedValueOnce({ data: { id: "auto-event-id" }, error: null }); // event insert succeeds
    // Upsert chain for profile auto-creation — insert uses default chain behavior
    db.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { createEvent } = await import("../events");
    const result = await createEvent({
      title: "Test Hackathon",
      description: "A test event",
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("auto-event-id");
  });

  it("creates event successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "new-event-id" }, error: null });

    const { createEvent } = await import("../events");
    const result = await createEvent({
      title: "Test Hackathon",
      description: "A test event",
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBe("new-event-id");
    // Verify the profile lookup used auth0_user_id
    const profileQuery = db.eq.mock.calls.find(c => c[0] === "auth0_user_id");
    expect(profileQuery).toBeDefined();
    expect(profileQuery![1]).toBe("auth0|12345");
  });

  it("sanitizes title and description", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValue({ data: { id: "new-id" }, error: null });

    const { createEvent } = await import("../events");
    await createEvent({
      title: '<script>alert("xss")</script>Hackathon',
      description: '<b>Bold</b> description with <script>evil</script>',
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });

    const insertCall = db.insert.mock.calls[0];
    expect(insertCall[0].title).not.toContain("<script>");
    expect(insertCall[0].title).toContain("Hackathon");
    expect(insertCall[0].description).not.toContain("<script>");
    expect(insertCall[0].description).toContain("Bold");
  });
});

describe("submitEventFeedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { submitEventFeedback } = await import("../events");

    const result = await submitEventFeedback("event-1", 5, "Great event!");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("auto-creates profile when none exists and submits feedback", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileNotFound(db);
    // Profile auto-creates, then feedback upsert succeeds
    db.upsert.mockResolvedValue({ error: null });

    const { submitEventFeedback } = await import("../events");
    const result = await submitEventFeedback("event-1", 5, "Great!");
    expect(result.success).toBe(true);
  });

  it("submits feedback successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.upsert.mockResolvedValue({ error: null });

    const { submitEventFeedback } = await import("../events");
    const result = await submitEventFeedback("event-1", 5, "Amazing hackathon!");

    expect(result.success).toBe(true);
    expect(db.upsert).toHaveBeenCalledTimes(1);
    const upsertData = db.upsert.mock.calls[0][0];
    expect(upsertData.event_id).toBe("event-1");
    expect(upsertData.rating).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEAMS
// ═══════════════════════════════════════════════════════════════════════════════

describe("sendTeamInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { sendTeamInvite } = await import("../teams");

    await expect(sendTeamInvite("team-1", "target-profile-id")).rejects.toThrow("Unauthorized");
  });

  it("auto-creates profile when none exists then fails membership check", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileNotFound(db);

    const { sendTeamInvite } = await import("../teams");
    await expect(sendTeamInvite("team-1", "target-id")).rejects.toThrow("must be a team member");
  });

  it("throws error when sender is not a team member", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // Profile found
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null });
    // But not a member (membership check via maybeSingle or single)
    db.single.mockResolvedValueOnce({ data: null, error: null });

    const { sendTeamInvite } = await import("../teams");
    await expect(sendTeamInvite("team-1", "target-id")).rejects.toThrow("must be a team member");
  });

  it("sends invite successfully when sender is a member", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // Profile found
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null });
    // Membership found
    db.single.mockResolvedValueOnce({ data: { id: "membership-uuid" }, error: null });
    // Insert succeeds (chain behavior handles the terminal insert correctly)

    const { sendTeamInvite } = await import("../teams");
    const result = await sendTeamInvite("team-1", "target-id");

    expect(result.success).toBe(true);
    // Verify profile lookup used auth0_user_id
    const profileQuery = db.eq.mock.calls.find(c => c[0] === "auth0_user_id");
    expect(profileQuery).toBeDefined();
  });
});

describe("acceptTeamInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { acceptTeamInvite } = await import("../teams");
    await expect(acceptTeamInvite("invite-1")).rejects.toThrow("Unauthorized");
  });

  it("auto-creates profile when none exists then checks invite", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: null, error: null }); // profile not found → triggers auto-creation
    db.single.mockResolvedValueOnce({ data: null, error: null }); // invite not found (test auto-creation up to this point)
    // Upsert profile chain — insert uses default chain behavior
    db.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { acceptTeamInvite } = await import("../teams");
    await expect(acceptTeamInvite("nonexistent")).rejects.toThrow("Invite not found");
  });

  it("throws error when invite not found", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockResolvedValueOnce({ data: null, error: null }); // invite not found

    // Clear default single mock to simulate invite not found
    db.single.mockReset();
    // Profile lookup succeeds
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null });
    // Invite lookup fails
    db.single.mockResolvedValueOnce({ data: null, error: null });

    const { acceptTeamInvite } = await import("../teams");
    await expect(acceptTeamInvite("nonexistent")).rejects.toThrow("Invite not found");
  });

  it("throws error when invite is for someone else", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // Reset and set specific mock chain
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // profile found
    db.single.mockResolvedValueOnce({ data: { profile_id: "other-user-uuid", team_id: "team-1" }, error: null }); // invite for someone else

    const { acceptTeamInvite } = await import("../teams");
    await expect(acceptTeamInvite("invite-1")).rejects.toThrow("This invite is not for you");
  });

  it("accepts invite successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db); // current user profile UUID = "profile-uuid"
    // Invite found, targeted at this user
    db.single.mockResolvedValueOnce({ data: { profile_id: "profile-uuid", team_id: "team-1" }, error: null });
    // Insert team member succeeds (chain behavior)
    // Update invite status succeeds
    db.update.mockReturnValue(db);
    db.eq.mockReturnValue(db);

    const { acceptTeamInvite } = await import("../teams");
    const result = await acceptTeamInvite("invite-1");

    expect(result.success).toBe(true);
  });
});

describe("denyTeamInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { denyTeamInvite } = await import("../teams");
    await expect(denyTeamInvite("invite-1")).rejects.toThrow("Unauthorized");
  });

  it("denies invite successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    // Invite found for this user
    db.single.mockResolvedValueOnce({ data: { profile_id: "profile-uuid" }, error: null });
    // Update succeeds
    db.update.mockReturnValue(db);
    db.eq.mockReturnValue(db);

    const { denyTeamInvite } = await import("../teams");
    const result = await denyTeamInvite("invite-1");

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ status: "denied" });
  });
});

describe("requestToJoinTeam", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { requestToJoinTeam } = await import("../teams");
    await expect(requestToJoinTeam("team-1")).rejects.toThrow("Unauthorized");
  });

  it("sends join request successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    // Terminal insert handled by chain behavior

    const { requestToJoinTeam } = await import("../teams");
    const result = await requestToJoinTeam("team-1");

    expect(result.success).toBe(true);
    const profileQuery = db.eq.mock.calls.find(c => c[0] === "auth0_user_id");
    expect(profileQuery).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS
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
    db.single.mockResolvedValueOnce({ data: null, error: null }); // profile not found → triggers auto-creation
    db.single.mockResolvedValueOnce({ data: { id: "project-1", title: "My Project" }, error: null }); // project insert succeeds
    // Upsert chain for profile auto-creation — insert uses default chain behavior
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

    // Verify profile lookup used auth0_user_id
    const profileQuery = db.eq.mock.calls.find(c => c[0] === "auth0_user_id");
    expect(profileQuery).toBeDefined();

    // Verify insert data
    const insertData = db.insert.mock.calls[0][0];
    expect(insertData.title).toBe("My Project");
    expect(insertData.tech_stack).toEqual(["React", "TypeScript"]);
    expect(insertData.demo_url).toBe("https://demo.example.com");
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
});

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
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // profile found
    db.single.mockResolvedValueOnce({ data: null, error: null }); // no existing like

    const { toggleProjectLike } = await import("../projects");
    const result = await toggleProjectLike("project-1");

    expect(result.success).toBe(true);
    const profileQuery = db.eq.mock.calls.find(c => c[0] === "auth0_user_id");
    expect(profileQuery).toBeDefined();
  });

  it("removes a like when one already exists", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // profile found
    db.single.mockResolvedValueOnce({ data: { id: "like-1" }, error: null }); // existing like found
    db.delete.mockReturnValue(db);
    db.eq.mockReturnValue(db);

    const { toggleProjectLike } = await import("../projects");
    const result = await toggleProjectLike("project-1");

    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
    // The eq chain for delete: .eq('id', 'like-1') should be called
    const deleteEqCalls = db.eq.mock.calls.filter(c => c[0] === "id" && c[1] === "like-1");
    expect(deleteEqCalls.length).toBeGreaterThanOrEqual(1);
  });
});

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
    db.single.mockResolvedValueOnce({ data: { id: "my-profile-uuid" }, error: null }); // profile found
    db.single.mockResolvedValueOnce({ data: { profile_id: "other-profile-uuid" }, error: null }); // project owned by someone else

    const { deleteProject } = await import("../projects");
    await expect(deleteProject("project-1")).rejects.toThrow("You can only delete your own projects");
  });

  it("deletes project successfully when owner", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db, "my-profile-uuid");
    // Project found, owned by this user
    db.single.mockResolvedValueOnce({ data: { profile_id: "my-profile-uuid" }, error: null });
    // Delete likes succeeds
    db.delete.mockReturnValue(db);
    db.eq.mockReturnValue(db);

    const { deleteProject } = await import("../projects");
    const result = await deleteProject("project-1");

    expect(result.success).toBe(true);
  });
});
