import { describe, it, expect, vi, beforeEach } from "vitest";
import { sanitizeString } from "@/lib/validation";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: vi.fn(),
  },
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

import { createServiceClient } from "@/utils/supabase/service";
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder ───────────────────────────────────────────────────

type MockDb = ReturnType<typeof buildMockDb>;

function buildMockDb() {
  const db: { [key: string]: ReturnType<typeof vi.fn> } = {};
  const methods = ["from", "select", "eq", "neq", "order", "limit"] as const;
  const terminals = ["single", "maybeSingle", "insert"] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }
  for (const m of terminals) {
    db[m] = vi.fn();
  }

  return db as unknown as {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
  };
}

function mockSupabase() {
  const db = buildMockDb();
  mockedCreateServiceClient.mockReturnValue(db);
  return db;
}

// ─── Import helper ───────────────────────────────────────────────────────────

async function importActions() {
  return await import("../team-chat");
}

// ─── Tests: sendTeamMessage ─────────────────────────────────────────────────

describe("sendTeamMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { sendTeamMessage } = await importActions();
    const result = await sendTeamMessage({ teamId: "team-1", message: "Hello" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("returns error when profile not found", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const supabase = mockSupabase();
    supabase.single.mockResolvedValue({ data: null, error: null });

    const { sendTeamMessage } = await importActions();
    const result = await sendTeamMessage({ teamId: "team-1", message: "Hello" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Profile not found");
  });

  it("returns error when not a team member", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const supabase = mockSupabase();
    supabase.single.mockResolvedValue({ data: { id: "profile-uuid", full_name: "Test User" }, error: null });
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { sendTeamMessage } = await importActions();
    const result = await sendTeamMessage({ teamId: "team-1", message: "Hello" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not a member of this team");
  });

  it("sanitizes message before inserting", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const supabase = mockSupabase();
    supabase.single.mockResolvedValue({ data: { id: "profile-uuid", full_name: "Test User" }, error: null });
    supabase.maybeSingle.mockResolvedValue({ data: { id: "membership-uuid" }, error: null });
    supabase.insert.mockResolvedValue({ error: null });

    const { sendTeamMessage } = await importActions();
    const dirtyMessage = '<script>alert("xss")</script>Hello there!';
    const result = await sendTeamMessage({ teamId: "team-1", message: dirtyMessage });

    expect(result.success).toBe(true);
    const inserted = supabase.insert.mock.calls[0][0];
    expect(inserted.message).not.toContain("<script>");
    expect(inserted.message).toContain("Hello there!");
    expect(inserted.profile_id).toBe("profile-uuid");
    expect(inserted.team_id).toBe("team-1");
  });

  it("returns error for empty message after sanitization", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const supabase = mockSupabase();
    supabase.single.mockResolvedValue({ data: { id: "profile-uuid", full_name: "Test User" }, error: null });
    supabase.maybeSingle.mockResolvedValue({ data: { id: "membership-uuid" }, error: null });

    const { sendTeamMessage } = await importActions();
    const result = await sendTeamMessage({ teamId: "team-1", message: "<script></script>" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Message is required");
  });

  it("sends message successfully as a team member", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const supabase = mockSupabase();
    supabase.single.mockResolvedValue({ data: { id: "profile-uuid", full_name: "Test User" }, error: null });
    supabase.maybeSingle.mockResolvedValue({ data: { id: "membership-uuid" }, error: null });
    supabase.insert.mockResolvedValue({ error: null });

    const { sendTeamMessage } = await importActions();
    const result = await sendTeamMessage({ teamId: "team-1", message: "Hello team!" });

    expect(result.success).toBe(true);
    expect(supabase.insert).toHaveBeenCalledTimes(1);
  });
});

// ─── Tests: getTeamMessages ─────────────────────────────────────────────────

describe("getTeamMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when not authenticated", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { getTeamMessages } = await importActions();
    const result = await getTeamMessages("team-1");

    expect(result).toEqual([]);
  });

  it("returns empty array when profile not found", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const supabase = mockSupabase();
    supabase.single.mockResolvedValue({ data: null, error: null });

    const { getTeamMessages } = await importActions();
    const result = await getTeamMessages("team-1");

    expect(result).toEqual([]);
  });

  it("returns empty array when not a team member", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const supabase = mockSupabase();
    supabase.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null });
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { getTeamMessages } = await importActions();
    const result = await getTeamMessages("team-1");

    expect(result).toEqual([]);
  });

  it("returns messages in chronological order", async () => {
    const { auth0 } = await import("@/lib/auth0");
    (auth0.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const mockMessages = [
      { id: "2", message: "Second", created_at: "2026-01-02", profile: { id: "p1", full_name: "Alice", avatar_url: null } },
      { id: "1", message: "First", created_at: "2026-01-01", profile: { id: "p2", full_name: "Bob", avatar_url: null } },
    ];

    const supabase = mockSupabase();
    supabase.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null });
    supabase.maybeSingle.mockResolvedValue({ data: { id: "membership-uuid" }, error: null });
    supabase.limit.mockResolvedValue({ data: mockMessages, error: null });

    const { getTeamMessages } = await importActions();
    const result = await getTeamMessages("team-1");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
  });
});

// ─── Tests: sanitizeString ─────────────────────────────────────────────────

describe("sanitizeString (validation helper)", () => {
  it("strips HTML tags", () => {
    expect(sanitizeString("<b>bold</b>", 100)).toBe("bold");
  });

  it("strips control characters", () => {
    expect(sanitizeString("hello\x00world", 100)).toBe("helloworld");
  });

  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ", 100)).toBe("hello");
  });

  it("limits length", () => {
    const long = "a".repeat(100);
    expect(sanitizeString(long, 10)).toBe("a".repeat(10));
  });
});
