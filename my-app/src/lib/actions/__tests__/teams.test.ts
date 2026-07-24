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
    "order", "limit", "like", "ilike", "single", "maybeSingle",
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

// ═══════════════════════════════════════════════════════════════════════════════
// sendTeamInvite
// ═══════════════════════════════════════════════════════════════════════════════

describe("sendTeamInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { sendTeamInvite } = await import("../teams");
    await expect(sendTeamInvite("team-1", "target-profile-id")).rejects.toThrow("Unauthorized");
  });

  it("throws error when sender is not a team member", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // single() calls: resolveProfileId (1st) → membership check (2nd)
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // resolveProfileId
    db.single.mockResolvedValueOnce({ data: null, error: null }); // membership: NOT found

    const { sendTeamInvite } = await import("../teams");
    await expect(sendTeamInvite("team-1", "target-id")).rejects.toThrow("must be a team member");
  });

  it("sends invite successfully when sender is a member", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    // Membership found
    db.single.mockResolvedValueOnce({ data: { id: "membership-uuid" }, error: null });

    const { sendTeamInvite } = await import("../teams");
    const result = await sendTeamInvite("team-1", "target-id");

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("throws on DB insert error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // Profile is found (single() returns data) → upsertProfile never called
    // This avoids mock interference when running alongside other test files
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // resolveProfileId
    db.single.mockResolvedValueOnce({ data: { id: "membership-uuid" }, error: null }); // membership check
    // Mock insert to always fail — safe because upsertProfile is never called
    db.insert.mockReturnValue({ error: { message: "DB error" } });

    const { sendTeamInvite } = await import("../teams");
    await expect(sendTeamInvite("team-1", "target-id")).rejects.toThrow("DB error");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// acceptTeamInvite
// ═══════════════════════════════════════════════════════════════════════════════

describe("acceptTeamInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { acceptTeamInvite } = await import("../teams");
    await expect(acceptTeamInvite("invite-1")).rejects.toThrow("Unauthorized");
  });

  it("throws error when invite not found", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockReset();
    // Profile lookup succeeds
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null });
    // Invite not found
    db.single.mockResolvedValueOnce({ data: null, error: null });

    const { acceptTeamInvite } = await import("../teams");
    await expect(acceptTeamInvite("nonexistent")).rejects.toThrow("Invite not found");
  });

  it("throws error when invite is for someone else", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // profile
    db.single.mockResolvedValueOnce({ data: { profile_id: "other-user", team_id: "team-1" }, error: null }); // invite

    const { acceptTeamInvite } = await import("../teams");
    await expect(acceptTeamInvite("invite-1")).rejects.toThrow("This invite is not for you");
  });

  it("accepts invite successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // profile found
    db.single.mockResolvedValueOnce({ data: { profile_id: "profile-uuid", team_id: "team-1" }, error: null }); // invite found
    // team_members insert succeeds (chain behavior returns db, error is undefined)
    // team_invites update succeeds

    const { acceptTeamInvite } = await import("../teams");
    const result = await acceptTeamInvite("invite-1");

    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// denyTeamInvite
// ═══════════════════════════════════════════════════════════════════════════════

describe("denyTeamInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { denyTeamInvite } = await import("../teams");
    await expect(denyTeamInvite("invite-1")).rejects.toThrow("Unauthorized");
  });

  it("throws error when invite not found", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null });
    db.single.mockResolvedValueOnce({ data: null, error: null });

    const { denyTeamInvite } = await import("../teams");
    await expect(denyTeamInvite("bad-invite")).rejects.toThrow("Invite not found");
  });

  it("denies invite successfully", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileFound(db);
    db.single.mockReset();
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null }); // profile
    db.single.mockResolvedValueOnce({ data: { profile_id: "profile-uuid" }, error: null }); // invite

    const { denyTeamInvite } = await import("../teams");
    const result = await denyTeamInvite("invite-1");

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ status: "denied" });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// requestToJoinTeam
// ═══════════════════════════════════════════════════════════════════════════════

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

    const { requestToJoinTeam } = await import("../teams");
    const result = await requestToJoinTeam("team-1");

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getUnassignedAttendees
// ═══════════════════════════════════════════════════════════════════════════════

describe("getUnassignedAttendees", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no registrations exist", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockResolvedValue({ data: [], error: null });

    const { getUnassignedAttendees } = await import("../teams");
    const result = await getUnassignedAttendees("event-1");

    expect(result).toEqual([]);
  });

  it("returns unassigned attendees", async () => {
    const db = mockSupabase();
    // Mock strategy for getUnassignedAttendees:
    // Execution order: registrations.eq → profiles.in → teams.eq (nested subquery) → team_members.in → team_members.in
    //
    // eq calls:
    //   1. registrations: .eq("event_id", eventId) — terminal
    //   2. teams subquery: .eq("event_id", eventId) — terminal (nested inside 3rd in()'s argument construction)
    // in calls:
    //   1. profiles: .in("id", ids) — terminal
    //   2. team_members: .in("profile_id", ids) — must return db for chaining
    //   3. team_members: .in("team_id", ["team-1"]) — terminal

    db.eq.mockResolvedValueOnce({ data: [{ profile_id: "p1" }, { profile_id: "p2" }, { profile_id: "p3" }], error: null });
    db.eq.mockResolvedValueOnce({ data: [{ id: "team-1" }], error: null }); // teams subquery returns a team

    db.in.mockResolvedValueOnce({
      data: [
        { id: "p1", full_name: "Alice", bh_id: "BH-26-001", avatar_url: null },
        { id: "p2", full_name: "Bob", bh_id: "BH-26-002", avatar_url: "https://example.com/ava.jpg" },
        { id: "p3", full_name: "Charlie", bh_id: "BH-26-003", avatar_url: null },
      ],
      error: null,
    });
    db.in.mockReturnValueOnce(db); // team_members: first in() must return db for chaining
    db.in.mockResolvedValueOnce({ data: [{ profile_id: "p2" }], error: null }); // team_members: second in() is terminal

    const { getUnassignedAttendees } = await import("../teams");
    const result = await getUnassignedAttendees("event-1");

    expect(result).toHaveLength(2);
    expect(result.find((a: any) => a.full_name === "Alice")).toBeDefined();
    expect(result.find((a: any) => a.full_name === "Charlie")).toBeDefined();
    expect(result.find((a: any) => a.full_name === "Bob")).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getEventTeams
// ═══════════════════════════════════════════════════════════════════════════════

describe("getEventTeams", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no teams exist", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.order.mockResolvedValue({ data: [], error: null });

    const { getEventTeams } = await import("../teams");
    const result = await getEventTeams("event-1");

    expect(result).toEqual([]);
  });

  it("returns teams with members", async () => {
    const db = mockSupabase();
    // First query: get teams
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.order.mockResolvedValueOnce({
      data: [{ id: "team-1", name: "Team Alpha" }],
      error: null,
    });
    // Second query: get team members
    db.select.mockReturnValue(db);
    db.in.mockResolvedValueOnce({
      data: [{ team_id: "team-1", profile_id: "p1" }, { team_id: "team-1", profile_id: "p2" }],
      error: null,
    });
    // Third query: get profiles
    db.in.mockResolvedValueOnce({
      data: [
        { id: "p1", full_name: "Alice", bh_id: "BH-26-001", avatar_url: null },
        { id: "p2", full_name: "Bob", bh_id: "BH-26-002", avatar_url: null },
      ],
      error: null,
    });

    const { getEventTeams } = await import("../teams");
    const result = await getEventTeams("event-1");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Team Alpha");
    expect(result[0].member_count).toBe(2);
    expect(result[0].members[0].full_name).toBe("Alice");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// forceCreateTeam
// ═══════════════════════════════════════════════════════════════════════════════

describe("forceCreateTeam", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error for empty team name", async () => {
    const { forceCreateTeam } = await import("../teams");
    const result = await forceCreateTeam("event-1", "  ", []);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Team name is required.");
  });

  it("creates team without members", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.single.mockResolvedValue({ data: { id: "new-team-id" }, error: null });

    const { forceCreateTeam } = await import("../teams");
    const result = await forceCreateTeam("event-1", "New Team", []);

    expect(result.success).toBe(true);
    expect(result.team_id).toBe("new-team-id");
  });

  it("creates team with members", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.single.mockResolvedValue({ data: { id: "team-id" }, error: null });

    const { forceCreateTeam } = await import("../teams");
    const result = await forceCreateTeam("event-1", "Full Team", ["p1", "p2"]);

    expect(result.success).toBe(true);
    expect(result.team_id).toBe("team-id");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// forceAddTeamMember
// ═══════════════════════════════════════════════════════════════════════════════

describe("forceAddTeamMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error if already a member", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.single.mockResolvedValue({ data: { id: "existing" }, error: null });

    const { forceAddTeamMember } = await import("../teams");
    const result = await forceAddTeamMember("team-1", "profile-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Already a member of this team.");
  });

  it("adds member successfully", async () => {
    const db = mockSupabase();
    db.select.mockReturnValue(db);
    db.eq.mockReturnValue(db);
    db.single.mockResolvedValueOnce({ data: null, error: null }); // not already a member
    // Insert succeeds via chain behavior

    const { forceAddTeamMember } = await import("../teams");
    const result = await forceAddTeamMember("team-1", "profile-1");

    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// removeTeamMember
// ═══════════════════════════════════════════════════════════════════════════════

describe("removeTeamMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("removes member successfully", async () => {
    const db = mockSupabase();
    db.delete.mockReturnValue(db);
    // removeTeamMember chains: .delete().eq("team_id", ...).eq("profile_id", ...)
    db.eq.mockReturnValueOnce(db);                                    // first eq() must return db for chaining
    db.eq.mockResolvedValueOnce({ error: null });                      // second eq() is terminal

    const { removeTeamMember } = await import("../teams");
    const result = await removeTeamMember("team-1", "profile-1");

    expect(result.success).toBe(true);
  });

  it("returns error on deletion failure", async () => {
    const db = mockSupabase();
    db.delete.mockReturnValue(db);
    db.eq.mockReturnValueOnce(db);                                    // first eq() must return db for chaining
    db.eq.mockResolvedValueOnce({ error: { message: "FK constraint" } }); // second eq() is terminal

    const { removeTeamMember } = await import("../teams");
    const result = await removeTeamMember("team-1", "profile-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to remove member.");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// deleteTeam
// ═══════════════════════════════════════════════════════════════════════════════

describe("deleteTeam", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes team and its members", async () => {
    const db = mockSupabase();
    // deleteTeam chains: members.delete().eq("team_id", teamId) then team.delete().eq("id", teamId)
    // Each chain has one .eq() call (terminal), run sequentially
    db.delete.mockReturnValue(db);
    // First chain: members — eq is terminal, returns success
    db.eq.mockResolvedValueOnce({ error: null });
    // Second chain: team — eq is terminal, returns success
    db.eq.mockResolvedValueOnce({ error: null });

    const { deleteTeam } = await import("../teams");
    const result = await deleteTeam("team-1");

    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalledTimes(2); // members then team
  });

  it("returns error on deletion failure", async () => {
    const db = mockSupabase();
    db.delete.mockReturnValue(db);
    // First chain: members — eq terminal, succeeds
    db.eq.mockResolvedValueOnce({ error: null });
    // Second chain: team — eq terminal, fails
    db.eq.mockResolvedValueOnce({ error: { message: "Not found" } });

    const { deleteTeam } = await import("../teams");
    const result = await deleteTeam("bad-id");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to delete team.");
  });
});
