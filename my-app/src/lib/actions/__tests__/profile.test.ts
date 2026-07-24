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

vi.mock("@/lib/validation", () => ({
  sanitizeString: vi.fn((v: string, max: number) => v.slice(0, max)),
  normalizeSocialUrl: vi.fn((v: string) => {
    // Return null for invalid URLs, trimmed URL for valid ones
    if (!v || v === "invalid") return null;
    if (v.startsWith("http://") || v.startsWith("https://")) return v;
    if (v.startsWith("//")) return `https:${v}`;
    return `https://${v}`;
  }),
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

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

function setAuthenticated(sub = "auth0|12345") {
  mockedGetSession.mockResolvedValue({ user: { sub } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// updateProfile
// ═══════════════════════════════════════════════════════════════════════════════

describe("updateProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { updateProfile } = await import("../profile");

    await expect(updateProfile("auth0|12345", { full_name: "Test" })).rejects.toThrow("Unauthorized");
  });

  it("updates profile successfully with basic fields", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    const result = await updateProfile("auth0|12345", {
      full_name: "Test User",
      bio: "A short bio",
    });

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledTimes(1);
    const updateData = db.update.mock.calls[0][0];
    expect(updateData.full_name).toBe("Test User");
    expect(updateData.bio).toBe("A short bio");
  });

  it("looks up profile by auth0_user_id", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|67890", { full_name: "Target User" });

    const eqCalls = db.eq.mock.calls;
    const auth0Query = eqCalls.find(c => c[0] === "auth0_user_id");
    expect(auth0Query).toBeDefined();
    expect(auth0Query![1]).toBe("auth0|67890");
  });

  it("sanitizes full_name to 100 chars", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { full_name: "A".repeat(200) });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.full_name.length).toBe(100);
  });

  it("sanitizes bio to 2000 chars", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { bio: "B".repeat(3000) });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.bio.length).toBeLessThanOrEqual(2000);
  });

  it("handles avatar_url null correctly (removes avatar)", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { avatar_url: null });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.avatar_url).toBeNull();
  });

  it("passes avatar_url through normalizeSocialUrl", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { avatar_url: "https://example.com/avatar.jpg" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.avatar_url).toBe("https://example.com/avatar.jpg");
  });

  it("passes cal_com_url through normalizeSocialUrl", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { cal_com_url: "https://cal.com/testuser" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.cal_com_url).toBe("https://cal.com/testuser");
  });

  it("sets cal_com_url to null when normalizeSocialUrl returns null", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { cal_com_url: "invalid" }); // normalizeSocialUrl returns null for "invalid"

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.cal_com_url).toBeNull();
  });

  it("updates socials with normalized URLs", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", {
      socials: {
        github: "https://github.com/testuser",
        linkedin: "https://linkedin.com/in/testuser",
        twitter: "https://twitter.com/testuser",
        website: "https://testuser.com",
      },
    });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.socials.github).toBe("https://github.com/testuser");
    expect(updateData.socials.linkedin).toBe("https://linkedin.com/in/testuser");
    expect(updateData.socials.website).toBe("https://testuser.com");
  });

  it("omits socials field when not provided", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { full_name: "No Socials" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.socials).toBeUndefined();
  });

  it("sets open_to_mentor flag", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { open_to_mentor: true });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.open_to_mentor).toBe(true);
  });

  it("does not set open_to_mentor when not provided", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { full_name: "Test" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.open_to_mentor).toBeUndefined();
  });

  it("revalidates profile paths on success", async () => {
    setAuthenticated();

    const { revalidatePath } = await import("next/cache");
    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { full_name: "Test User" });

    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/hacker/profile");
    expect(revalidatePath).toHaveBeenCalledWith("/profile/auth0|12345");
  });

  it("throws on Supabase error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.eq.mockResolvedValue({ error: { message: "DB error" } });

    const { updateProfile } = await import("../profile");
    await expect(updateProfile("auth0|12345", { full_name: "Test" })).rejects.toThrow("Failed to update profile");
  });

  it("does not modify full_name when undefined", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile("auth0|12345", { bio: "Only bio" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.full_name).toBeUndefined();
  });
})
