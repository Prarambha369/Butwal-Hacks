import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/validation", () => ({ sanitizeString: vi.fn((s: string, max: number) => s.slice(0, max)) }));
vi.mock("@/lib/profile-resolver", () => ({ resolveProfileId: vi.fn() }));
vi.mock("@/lib/crypto/sign", () => ({ signTrustMarker: vi.fn(() => "ed25519-sig-abc123") }));
vi.mock("@/lib/cache", () => ({ bustProfileCache: vi.fn().mockResolvedValue(undefined) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createServiceClient } from "@/utils/supabase/service";
import { resolveProfileId } from "@/lib/profile-resolver";

const mockedCreateServiceClient = createServiceClient as any;
const mockedResolveProfileId = resolveProfileId as any;

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "update", "single", "maybeSingle", "insert"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

// ═══════════════════════════════════════════════════════════════════════════════
// issueTrustMarker
// ═══════════════════════════════════════════════════════════════════════════════

describe("issueTrustMarker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("issues and signs a trust marker", async () => {
    mockedResolveProfileId.mockResolvedValue("issuer-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Chain: from().insert().select().single() — terminal is single
    db.single.mockResolvedValueOnce({
      data: { id: "marker-1", created_at: "2026-01-01" },
      error: null,
    });
    // Chain: from().update({ crypto_signature }).eq("id", marker.id) — terminal is eq
    db.eq.mockResolvedValue({ error: null });

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
    mockedResolveProfileId.mockResolvedValue("issuer-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Insert returns error — the catch block uses fallback "Failed to issue marker"
    db.single.mockResolvedValue({ data: null, error: { message: "Insert failed" } });

    const { issueTrustMarker } = await import("../issue-marker");
    const result = await issueTrustMarker({
      email: "user@test.com", title: "Test", description: "Test", type: "test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to issue marker");
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
    db.eq.mockResolvedValue({ error: null });

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
