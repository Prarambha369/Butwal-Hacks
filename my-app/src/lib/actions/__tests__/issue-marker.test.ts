import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/validation", () => ({ sanitizeString: vi.fn((s: string, max: number) => s.slice(0, max)) }));
vi.mock("@/lib/profile-resolver", () => ({ resolveProfileId: vi.fn() }));
vi.mock("@/lib/crypto-sign", () => ({ signTrustMarker: vi.fn(() => "ed25519-sig-abc123") }));
vi.mock("@/lib/cache", () => ({ bustCache: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/discord", () => ({ notifyMarkerIssued: vi.fn(), notifyEventCreated: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));

import { createServiceClient } from "@/utils/supabase";
import { resolveProfileId } from "@/lib/profile-resolver";
import { auth0 } from "@/lib/auth0";

const mockedCreateServiceClient = createServiceClient as any;
const mockedResolveProfileId = resolveProfileId as any;
const mockedGetSession = auth0.getSession as any;

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "update", "single", "maybeSingle", "insert"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

/** A signed-in organizer. The default for tests that are about marker content,
 *  not about who is allowed to issue one. */
/** A signed-in session. The role comes from the mocked profiles row, not from
 *  here, so only the address and its verification flag are parameters. */
function setIssuerSession(email = "org@butwalhacks.com", verified = true) {
  mockedGetSession.mockResolvedValue({ user: { sub: "auth0|issuer", email, email_verified: verified } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// issueTrustMarker
// ═══════════════════════════════════════════════════════════════════════════════

describe("issueTrustMarker", () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * Chains for a successful issuance, in call order.
   *
   * A successful run touches `eq` three times: requireIssuer's filter (returns
   * the builder), the signature write (terminal), and the Discord issuer
   * lookup (returns the builder again). Queueing them in the wrong order
   * silently short-circuits the chain, so they are queued explicitly.
   */
  function primeIssuerDb(db: Record<string, any>) {
    db.eq.mockImplementationOnce(() => db);                                      // requireIssuer filter
    db.eq.mockImplementationOnce(() => Promise.resolve({ error: null }));       // signature write (terminal)
    db.eq.mockImplementationOnce(() => db);                                      // Discord issuer lookup

    db.single.mockResolvedValueOnce({ data: { role: "organizer" }, error: null });                       // requireIssuer
    db.single.mockResolvedValueOnce({ data: { id: "marker-1", created_at: "2026-01-01" }, error: null }); // insert
    db.single.mockResolvedValueOnce({ data: { full_name: "Test Issuer", bh_id: "BH-24-001" }, error: null }); // Discord
  }

  it("issues and signs a trust marker", async () => {
    setIssuerSession();
    mockedResolveProfileId.mockResolvedValue("issuer-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    primeIssuerDb(db);

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "user@test.com",
      title: "Winner",
      description: "Won the hackathon",
      type: "winner",
    });

    expect(result.success).toBe(true);
    expect(result.signed).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      claimant_email: "user@test.com",
      title: "Winner",
    }));
  });

  it("returns error on insert failure with fallback message", async () => {
    setIssuerSession();
    mockedResolveProfileId.mockResolvedValue("issuer-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.single.mockResolvedValueOnce({ data: { role: "organizer" }, error: null });
    db.single.mockResolvedValueOnce({ data: null, error: { message: "Insert failed" } });

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "user@test.com", title: "Test", description: "Test", type: "test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to issue marker");
  });

  // ── Regression: this action had no role check at all, while the parallel
  // HTTP route /api/v1/issue-marker did. Any signed-in member could mint a
  // signed credential for any email address. ──

  it("refuses a member with no issuer role and writes nothing", async () => {
    setIssuerSession("member@test.com");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.single.mockResolvedValueOnce({ data: { role: "hacker" }, error: null });

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "victim@test.com", title: "Fake Award", description: "x", type: "achievement",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("organizers and maintainers");
    expect(db.insert).not.toHaveBeenCalled();
    expect(mockedResolveProfileId).not.toHaveBeenCalled();
  });

  it("refuses an unauthenticated caller", async () => {
    mockedGetSession.mockResolvedValue(null);
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "victim@test.com", title: "Fake Award", description: "x", type: "achievement",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Not authenticated");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("refuses a sponsor, who is not an issuer role", async () => {
    setIssuerSession("sponsor@butwalhacks.com");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.single.mockResolvedValueOnce({ data: { role: "sponsor" }, error: null });

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "victim@test.com", title: "Fake Award", description: "x", type: "achievement",
    });

    expect(result.success).toBe(false);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("refuses role='maintainer' on an unverified address", async () => {
    // The maintainer role alone must not be enough; the address has to be a
    // verified staff one, same as the layouts and requireMaintainer().
    setIssuerSession("admin@butwalhacks.com", false);
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.single.mockResolvedValueOnce({ data: { role: "maintainer" }, error: null });

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "victim@test.com", title: "Fake Award", description: "x", type: "achievement",
    });

    expect(result.success).toBe(false);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("allows a verified staff maintainer", async () => {
    setIssuerSession("admin@butwalhacks.com", true);
    mockedResolveProfileId.mockResolvedValue("issuer-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    primeIssuerDb(db);

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "user@test.com", title: "Award", description: "x", type: "achievement",
    });

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("fails closed when the role lookup errors", async () => {
    setIssuerSession();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.single.mockResolvedValueOnce({ data: null, error: { message: "boom", code: "08006" } });

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "victim@test.com", title: "Fake Award", description: "x", type: "achievement",
    });

    expect(result.success).toBe(false);
    // An unknown role is not an issuer role, so the lookup failure denies.
    expect(db.insert).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// claimTrustMarker
// ═══════════════════════════════════════════════════════════════════════════════

describe("claimTrustMarker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("claims a marker with valid token", async () => {
    mockedResolveProfileId.mockResolvedValue("prof-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Chain 1: from().select().eq().maybeSingle() — eq is non-terminal, maybeSingle is terminal
    db.eq.mockImplementationOnce(() => db);
    db.maybeSingle.mockResolvedValueOnce({
      data: { token: "valid-token", trust_markers: { id: "marker-1" } },
      error: null,
    });
    // Chain 2: from().update({ is_claimed, profile_id }).eq("id", markerId) — terminal is eq
    db.eq.mockResolvedValueOnce({ error: null });
    // Chain 3: from().select("bh_id").eq("id", profileId).single() — needs eq to return db, single to resolve
    db.eq.mockImplementationOnce(() => db);
    db.single.mockResolvedValueOnce({ data: { bh_id: "BH-24-001" }, error: null });

    const { claimTrustMarker } = await import("../issue-marker");
    const result = await claimTrustMarker("valid-token");

    expect(result.success).toBe(true);
  });

  it("returns error for invalid token", async () => {
    mockedResolveProfileId.mockResolvedValue("prof-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { claimTrustMarker } = await import("../issue-marker");
    const result = await claimTrustMarker("bad-token");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid or expired claim token");
  });
});
