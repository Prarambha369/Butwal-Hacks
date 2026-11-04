import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/lib/auth0-management", () => ({
  getLinkedIdentities: vi.fn(),
}));

vi.mock("@/utils/supabase", () => ({
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
import { getLinkedIdentities } from "@/lib/auth0-management";
import { createServiceClient } from "@/utils/supabase";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedGetLinkedIdentities = getLinkedIdentities as ReturnType<typeof vi.fn>;
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

// Helpers for the fetchProviderSocials mock database: the chained builder
// returns the same db object per call, and each awaited `.single()` resolves
// the next sequenced result (last-fetch -> linked_accounts -> socials -> update).
function mockSingleSequence(
  db: Record<string, ReturnType<typeof vi.fn>>,
  singleResults: unknown[]
) {
  let i = 0;
  db.single.mockImplementation(() =>
    Promise.resolve(singleResults[i++] ?? { data: null, error: null })
  );
  db.select.mockReturnValue(db);
}

function setupFetchMocks(opts: {
  linkedAccounts: unknown;
  identities: unknown[];
  socials: Record<string, string>;
  dbError?: { message: string };
}) {
  setAuthenticated();
  const db = mockSupabase();

  mockSingleSequence(db, [
    { data: { last_social_fetch_at: null }, error: null },
    { data: { linked_accounts: opts.linkedAccounts }, error: opts.dbError ?? null },
    { data: { socials: opts.socials }, error: null },
    { error: null }, // socials update
    { error: null }, // recordSocialFetch update
  ]);

  mockedGetLinkedIdentities.mockResolvedValue(opts.identities);

  return db;
}

// ═══════════════════════════════════════════════════════════════════════════════
// updateProfile
// ═══════════════════════════════════════════════════════════════════════════════

describe("updateProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { updateProfile } = await import("../profile");

    await expect(updateProfile({ full_name: "Test" })).rejects.toThrow("Unauthorized");
  });

  it("updates profile successfully with basic fields", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    const result = await updateProfile({
      full_name: "Test User",
      bio: "A short bio",
    });

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledTimes(1);
    const updateData = db.update.mock.calls[0][0];
    expect(updateData.full_name).toBe("Test User");
    expect(updateData.bio).toBe("A short bio");
  });

  it("targets the session's own profile, never a caller-supplied identity", async () => {
    // Regression: the action used to take a `userId` argument and write to
    // whatever it was handed, so any signed-in member could rewrite any other
    // member's name, bio, avatar and socials. The target is now derived from
    // the session, so there is no argument to forge.
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ full_name: "My Own Name" });

    const eqCalls = db.eq.mock.calls;
    const auth0Query = eqCalls.find(c => c[0] === "auth0_user_id");
    expect(auth0Query).toBeDefined();
    expect(auth0Query?.[1]).toBe("auth0|12345");
  });

  it("has no userId parameter that could redirect the write", async () => {
    // Structural guard: if someone re-adds a target identity parameter, this
    // fails. Arity is checked without asserting on source text.
    const { updateProfile } = await import("../profile");
    expect(updateProfile.length).toBe(1);
  });

  it("sanitizes full_name to 100 chars", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ full_name: "A".repeat(200) });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.full_name.length).toBe(100);
  });

  it("sanitizes bio to 2000 chars", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ bio: "B".repeat(3000) });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.bio.length).toBeLessThanOrEqual(2000);
  });

  it("handles avatar_url null correctly (removes avatar)", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ avatar_url: null });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.avatar_url).toBeNull();
  });

  it("passes avatar_url through normalizeSocialUrl", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ avatar_url: "https://example.com/avatar.jpg" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.avatar_url).toBe("https://example.com/avatar.jpg");
  });

  it("passes cal_com_url through normalizeSocialUrl", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ cal_com_url: "https://cal.com/testuser" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.cal_com_url).toBe("https://cal.com/testuser");
  });

  it("sets cal_com_url to null when normalizeSocialUrl returns null", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ cal_com_url: "invalid" }); // normalizeSocialUrl returns null for "invalid"

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.cal_com_url).toBeNull();
  });

  it("updates socials with normalized URLs", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({
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
    await updateProfile({ full_name: "No Socials" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.socials).toBeUndefined();
  });

  it("sets open_to_mentor flag", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ open_to_mentor: true });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.open_to_mentor).toBe(true);
  });

  it("does not set open_to_mentor when not provided", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ full_name: "Test" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.open_to_mentor).toBeUndefined();
  });

  it("revalidates profile paths on success", async () => {
    setAuthenticated();

    const { revalidatePath } = await import("next/cache");
    const { updateProfile } = await import("../profile");
    await updateProfile({ full_name: "Test User" });

    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/profile");
  });

  it("does not revalidate a /profile/<auth0-sub> path", async () => {
    // There is no /profile/[id] route in this app, and the Auth0 subject
    // contains a "|", so interpolating it produced a path that could never
    // match. Assert it stays gone so it does not creep back in.
    setAuthenticated();

    const { revalidatePath } = await import("next/cache");
    const { updateProfile } = await import("../profile");
    await updateProfile({ full_name: "Test User" });

    const calledWith = (revalidatePath as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0]
    );
    expect(calledWith.some((p) => String(p).startsWith("/profile/"))).toBe(false);
  });

  it("throws on Supabase error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.eq.mockResolvedValue({ error: { message: "DB error" } });

    const { updateProfile } = await import("../profile");
    await expect(updateProfile({ full_name: "Test" })).rejects.toThrow("Failed to update profile");
  });

  it("does not modify full_name when undefined", async () => {
    setAuthenticated();
    const db = mockSupabase();

    const { updateProfile } = await import("../profile");
    await updateProfile({ bio: "Only bio" });

    const updateData = db.update.mock.calls[0][0];
    expect(updateData.full_name).toBeUndefined();
  });
})

// ═══════════════════════════════════════════════════════════════════════════════
// fetchProviderSocials
// ═══════════════════════════════════════════════════════════════════════════════

describe("fetchProviderSocials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when unauthenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow("Unauthorized");
  });

  it("reads linked_accounts from profiles JSONB column, not a linked_accounts table", async () => {
    const db = await setupFetchMocks({
      linkedAccounts: [{ provider: "github", user_id: "42" }],
      identities: [{
        provider: "github",
        connection: "github",
        user_id: "42",
        isSocial: true,
        profileData: { nickname: "octocat" },
      }],
      socials: {},
    });

    const { fetchProviderSocials } = await import("../profile");
    const result = await fetchProviderSocials("github");

    expect(result).toMatchObject({ success: true, filled: true });
    expect(result.socials).toMatchObject({ github: "https://github.com/octocat" });

    const fromCalls = db.from.mock.calls.map((c) => c[0]);
    expect(fromCalls).not.toContain("linked_accounts");
    const selectCalls = db.select.mock.calls.map((c) => c[0]);
    expect(selectCalls).toContain("linked_accounts");
  });

  it("targets only the session's own profile when checking linked accounts", async () => {
    const db = await setupFetchMocks({
      linkedAccounts: [],
      identities: [],
      socials: {},
    });

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow(
      "Connect your GitHub account first"
    );

    const eqCalls = db.eq.mock.calls;
    const auth0Query = eqCalls.find((c) => c[0] === "auth0_user_id");
    expect(auth0Query?.[1]).toBe("auth0|12345");
  });

  it("requires a matching provider entry in linked_accounts JSONB", async () => {
    await setupFetchMocks({
      linkedAccounts: [{ provider: "google-oauth2", user_id: "9" }],
      identities: [],
      socials: {},
    });

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow(
      "Connect your GitHub account first"
    );
  });

  it("handles missing linked_accounts (null) as not linked", async () => {
    await setupFetchMocks({
      linkedAccounts: null,
      identities: [],
      socials: {},
    });

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow(
      "Connect your GitHub account first"
    );
  });

  it("does not silently discard a linked_accounts read error", async () => {
    await setupFetchMocks({
      linkedAccounts: [],
      identities: [],
      socials: {},
      dbError: { message: "db exploded" },
    });

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow(
      "Failed to verify linked accounts"
    );
  });

  it("does not overwrite an existing GitHub URL", async () => {
    await setupFetchMocks({
      linkedAccounts: [{ provider: "github", user_id: "42" }],
      identities: [{
        provider: "github",
        connection: "github",
        user_id: "42",
        isSocial: true,
        profileData: { nickname: "octocat" },
      }],
      socials: { github: "https://github.com/already-set" },
    });

    const { fetchProviderSocials } = await import("../profile");
    const result = await fetchProviderSocials("github");

    expect(result.filled).toBe(false);
    expect(result.socials?.github).toBe("https://github.com/already-set");
  });

  it("enforces the social fetch cooldown", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockResolvedValue({
      data: { last_social_fetch_at: new Date().toISOString() },
      error: null,
    });

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow("cooldown");
  });

  it("resolves LinkedIn URL via vanity nickname", async () => {
    await setupFetchMocks({
      linkedAccounts: [{ provider: "linkedin", user_id: "7" }],
      identities: [{
        provider: "linkedin",
        connection: "linkedin",
        user_id: "7",
        isSocial: true,
        profileData: { nickname: "jane-doe" },
      }],
      socials: {},
    });

    const { fetchProviderSocials } = await import("../profile");
    const result = await fetchProviderSocials("linkedin");

    expect(result.socials).toMatchObject({ linkedin: "https://linkedin.com/in/jane-doe" });
    expect(mockedGetLinkedIdentities).toHaveBeenCalledWith("auth0|12345");
  });

  it("resolves LinkedIn URL to null when nickname is purely numeric", async () => {
    await setupFetchMocks({
      linkedAccounts: [{ provider: "linkedin", user_id: "7" }],
      identities: [{
        provider: "linkedin",
        connection: "linkedin",
        user_id: "7",
        isSocial: true,
        profileData: { nickname: "123456789" },
      }],
      socials: {},
    });

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("linkedin")).rejects.toThrow(
      "Could not read a LinkedIn profile URL"
    );
  });

  it("returns null when the provider profile has no nickname", async () => {
    await setupFetchMocks({
      linkedAccounts: [{ provider: "github", user_id: "42" }],
      identities: [{
        provider: "github",
        connection: "github",
        user_id: "42",
        isSocial: true,
        profileData: {},
      }],
      socials: {},
    });

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow(
      "Could not read a GitHub profile URL"
    );
  });

  it("returns null on Auth0 Management API error", async () => {
    setAuthenticated();
    const db = mockSupabase();
    const singleResults = [
      { data: { last_social_fetch_at: null }, error: null },
      { data: { linked_accounts: [{ provider: "github", user_id: "42" }] }, error: null },
    ];
    let i = 0;
    db.single.mockImplementation(() =>
      Promise.resolve(singleResults[i++] ?? { data: null, error: null })
    );
    mockedGetLinkedIdentities.mockRejectedValue(new Error("Auth0 down"));

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow(
      "Could not read a GitHub profile URL"
    );
  });

  it("returns null when no linked identity matches the provider", async () => {
    await setupFetchMocks({
      linkedAccounts: [{ provider: "github", user_id: "42" }],
      identities: [],
      socials: {},
    });

    const { fetchProviderSocials } = await import("../profile");
    await expect(fetchProviderSocials("github")).rejects.toThrow(
      "Could not read a GitHub profile URL"
    );
  });
})

describe("resolveProviderProfileUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("builds a GitHub URL from the linked identity nickname", async () => {
    mockedGetLinkedIdentities.mockResolvedValue([{
      provider: "github",
      connection: "github",
      user_id: "42",
      isSocial: true,
      profileData: { nickname: "octocat" },
    }]);

    const { resolveProviderProfileUrl } = await import("../profile");
    await expect(resolveProviderProfileUrl("github", "auth0|12345")).resolves.toBe(
      "https://github.com/octocat"
    );
  });

  it("builds a LinkedIn URL from a non-numeric nickname", async () => {
    mockedGetLinkedIdentities.mockResolvedValue([{
      provider: "linkedin",
      connection: "linkedin",
      user_id: "7",
      isSocial: true,
      profileData: { nickname: "jane-doe" },
    }]);

    const { resolveProviderProfileUrl } = await import("../profile");
    await expect(resolveProviderProfileUrl("linkedin", "auth0|12345")).resolves.toBe(
      "https://linkedin.com/in/jane-doe"
    );
  });

  it("returns null for a purely numeric LinkedIn nickname", async () => {
    mockedGetLinkedIdentities.mockResolvedValue([{
      provider: "linkedin",
      connection: "linkedin",
      user_id: "7",
      isSocial: true,
      profileData: { nickname: "123456789" },
    }]);

    const { resolveProviderProfileUrl } = await import("../profile");
    await expect(resolveProviderProfileUrl("linkedin", "auth0|12345")).resolves.toBeNull();
  });

  it("returns null when the nickname is missing", async () => {
    mockedGetLinkedIdentities.mockResolvedValue([{
      provider: "github",
      connection: "github",
      user_id: "42",
      isSocial: true,
      profileData: {},
    }]);

    const { resolveProviderProfileUrl } = await import("../profile");
    await expect(resolveProviderProfileUrl("github", "auth0|12345")).resolves.toBeNull();
  });

  it("returns null when Auth0 lookup throws", async () => {
    mockedGetLinkedIdentities.mockRejectedValue(new Error("boom"));

    const { resolveProviderProfileUrl } = await import("../profile");
    await expect(resolveProviderProfileUrl("github", "auth0|12345")).resolves.toBeNull();
  });

  it("returns null when no matching identity exists", async () => {
    mockedGetLinkedIdentities.mockResolvedValue([]);

    const { resolveProviderProfileUrl } = await import("../profile");
    await expect(resolveProviderProfileUrl("github", "auth0|12345")).resolves.toBeNull();
  });
})
