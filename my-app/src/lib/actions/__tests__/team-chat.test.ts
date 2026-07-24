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

vi.mock("@/lib/profile-resolver", () => ({
  resolveProfileId: vi.fn(),
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";
import { resolveProfileId } from "@/lib/profile-resolver";

const VALID_TEAM_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_PROFILE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedResolveProfileId = resolveProfileId as ReturnType<typeof vi.fn>;

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

// ═══════════════════════════════════════════════════════════════════════════════
// sendMessage
// ═══════════════════════════════════════════════════════════════════════════════

describe("sendMessage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws for empty message", async () => {
    const { sendMessage } = await import("../team-chat");
    await expect(sendMessage(VALID_TEAM_ID, "")).rejects.toThrow("Message cannot be empty");
  });

  it("throws for oversized message", async () => {
    const { sendMessage } = await import("../team-chat");
    await expect(sendMessage(VALID_TEAM_ID, "x".repeat(2001))).rejects.toThrow("too long");
  });

  it("sends a message successfully", async () => {
    setAuthenticated();
    mockedResolveProfileId.mockResolvedValue(VALID_PROFILE_ID);
    const db = mockSupabase();

    // Membership check passes
    db.single.mockResolvedValueOnce({ data: { id: "membership-1" }, error: null });
    // Insert succeeds with embedded profile data (N+1 fix: join eliminates separate profile fetch)
    db.single.mockResolvedValueOnce({
      data: {
        id: "msg-1",
        team_id: VALID_TEAM_ID,
        profile_id: VALID_PROFILE_ID,
        message: "Hello!",
        created_at: new Date().toISOString(),
        profile: {
          full_name: "Test User",
          avatar_url: null,
          slug_id: "test-user",
          auth0_user_id: "auth0|12345",
        },
      },
      error: null,
    });

    const { sendMessage } = await import("../team-chat");
    const result = await sendMessage(VALID_TEAM_ID, "Hello!");

    expect(result.message).toBe("Hello!");
    expect(result.profile?.full_name).toBe("Test User");
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      team_id: VALID_TEAM_ID,
      profile_id: VALID_PROFILE_ID,
      message: "Hello!",
    }));
  });

  it("throws when sender is not a team member", async () => {
    setAuthenticated();
    mockedResolveProfileId.mockResolvedValue(VALID_PROFILE_ID);
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: null, error: null });

    const { sendMessage } = await import("../team-chat");
    await expect(sendMessage(VALID_TEAM_ID, "Hello!")).rejects.toThrow("not a member");
  });

  it("throws on insert error", async () => {
    setAuthenticated();
    mockedResolveProfileId.mockResolvedValue(VALID_PROFILE_ID);
    const db = mockSupabase();
    db.single.mockResolvedValueOnce({ data: { id: "membership-1" }, error: null });
    db.single.mockResolvedValueOnce({ data: null, error: { message: "Insert failed" } });

    const { sendMessage } = await import("../team-chat");
    await expect(sendMessage(VALID_TEAM_ID, "Hello!")).rejects.toThrow("Failed to send message");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getMessages
// ═══════════════════════════════════════════════════════════════════════════════

describe("getMessages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns messages for a team (reversed to chronological)", async () => {
    mockedResolveProfileId.mockResolvedValue(VALID_PROFILE_ID);
    const db = mockSupabase();

    db.single.mockResolvedValue({ data: { id: "membership-1" }, error: null });
    const mockMessages = [
      { id: "msg-2", message: "Second", created_at: "2026-01-02" },
      { id: "msg-1", message: "First", created_at: "2026-01-01" },
    ];
    db.limit.mockResolvedValue({ data: mockMessages, error: null });

    const { getMessages } = await import("../team-chat");
    const result = await getMessages(VALID_TEAM_ID);

    // Should be reversed to chronological order
    expect(result[0].id).toBe("msg-1");
    expect(result[1].id).toBe("msg-2");
  });

  it("throws when not a member", async () => {
    mockedResolveProfileId.mockResolvedValue(VALID_PROFILE_ID);
    const db = mockSupabase();
    db.single.mockResolvedValue({ data: null, error: null });

    const { getMessages } = await import("../team-chat");
    await expect(getMessages(VALID_TEAM_ID)).rejects.toThrow("not a member");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getUserTeams
// ═══════════════════════════════════════════════════════════════════════════════

describe("getUserTeams", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns teams the user is a member of", async () => {
    mockedResolveProfileId.mockResolvedValue(VALID_PROFILE_ID);
    const db = mockSupabase();

    // Memberships — chain: from().select().eq(), terminal is .eq()
    db.eq.mockResolvedValueOnce({
      data: [
        { team_id: VALID_TEAM_ID, team: { name: "Team Alpha" } },
        { team_id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8", team: { name: "Team Beta" } },
      ],
      error: null,
    });

    // Member counts — chain: from().select().in(), terminal is .in()
    db.in.mockResolvedValue({
      data: [
        { team_id: VALID_TEAM_ID },
        { team_id: VALID_TEAM_ID },
        { team_id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8" },
      ],
      error: null,
    });

    const { getUserTeams } = await import("../team-chat");
    const result = await getUserTeams();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Team Alpha");
    expect(result[1].name).toBe("Team Beta");
    expect(result[0].memberCount).toBe(2);
    expect(result[1].memberCount).toBe(1);
  });

  it("returns empty array when user has no teams", async () => {
    mockedResolveProfileId.mockResolvedValue(VALID_PROFILE_ID);
    const db = mockSupabase();

    // Memberships query returns empty
    db.eq.mockResolvedValueOnce({ data: [], error: null });

    const { getUserTeams } = await import("../team-chat");
    const result = await getUserTeams();

    expect(result).toEqual([]);
  });
});
