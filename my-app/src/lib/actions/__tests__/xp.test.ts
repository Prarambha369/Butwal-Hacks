import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/profile-resolver", () => ({ resolveProfileId: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createServiceClient } from "@/utils/supabase/service";
import { resolveProfileId } from "@/lib/profile-resolver";

const mockedCreateServiceClient = createServiceClient as any;
const mockedResolveProfileId = resolveProfileId as any;

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "in", "single", "update", "insert"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

describe("awardXP", () => {
  beforeEach(() => vi.clearAllMocks());

  it("awards XP and logs audit entry", async () => {
    mockedResolveProfileId.mockResolvedValue("actor-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Chain 1: from().select().eq().single() — terminal is single
    db.single.mockResolvedValueOnce({ data: { xp: 100 }, error: null });
    // Chain 2: from().update({ xp }).eq("id") — terminal is eq (default returns db, error=undefined)
    // Chain 3: from().audit_logs().insert(...) — terminal is insert
    db.insert.mockResolvedValue({ error: null });

    const { awardXP } = await import("../xp");
    const result = await awardXP("target-1", 50, "Won hackathon");

    expect(result.success).toBe(true);
    expect(result.newXP).toBe(150);
  });

  it("handles profile with null XP", async () => {
    mockedResolveProfileId.mockResolvedValue("actor-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.single.mockResolvedValueOnce({ data: { xp: null }, error: null });
    db.insert.mockResolvedValue({ error: null });

    const { awardXP } = await import("../xp");
    const result = await awardXP("target-1", 10, "Participation");

    expect(result.newXP).toBe(10);
  });

  it("throws on Supabase error in update", async () => {
    mockedResolveProfileId.mockResolvedValue("actor-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Chain 1: from().select().eq().single() — eq is non-terminal, needs to return db
    db.eq.mockImplementationOnce(() => db);
    // single() is terminal for chain 1
    db.single.mockResolvedValueOnce({ data: { xp: 100 }, error: null });
    // Chain 2: from().update().eq("id") — eq is terminal, returns error
    db.eq.mockResolvedValue({ error: { message: "Update failed" } });

    const { awardXP } = await import("../xp");
    await expect(awardXP("target-1", 50, "Reason")).rejects.toThrow("Update failed");
  });
});

describe("distributeProjectXP", () => {
  beforeEach(() => vi.clearAllMocks());

  it("distributes XP equally among contributors", async () => {
    mockedResolveProfileId.mockResolvedValue("actor-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Chain 1: from().select("profile_id").eq("project_id", projId)
    db.eq.mockResolvedValueOnce({
      data: [{ profile_id: "prof-1" }, { profile_id: "prof-2" }],
      error: null,
    });
    // Chain 2: from().select("id, xp").in("id", contributorIds)
    db.in.mockResolvedValue({
      data: [{ id: "prof-1", xp: 100 }, { id: "prof-2", xp: 50 }],
      error: null,
    });

    const { distributeProjectXP } = await import("../xp");
    const result = await distributeProjectXP("proj-1", 100);

    expect(result.success).toBe(true);
  });

  it("throws when no contributors found", async () => {
    mockedResolveProfileId.mockResolvedValue("actor-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.eq.mockResolvedValueOnce({ data: null, error: null });

    const { distributeProjectXP } = await import("../xp");
    await expect(distributeProjectXP("proj-1", 100)).rejects.toThrow("No contributors found");
  });
});
