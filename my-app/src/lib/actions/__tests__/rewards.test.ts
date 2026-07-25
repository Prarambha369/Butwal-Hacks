import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/profile-resolver", () => ({ resolveProfileId: vi.fn() }));
vi.mock("@/lib/data/rewards", () => ({
  AVAILABLE_REWARDS: [
    { id: "reward-1", name: "T-Shirt", description: "Cool tee", cost: 100 },
  ],
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createServiceClient } from "@/utils/supabase";
import { resolveProfileId } from "@/lib/profile-resolver";

const mockedCreateServiceClient = createServiceClient as any;
const mockedResolveProfileId = resolveProfileId as any;

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "single", "update", "upsert", "insert"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

describe("redeemReward", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redeems a reward and deducts XP", async () => {
    mockedResolveProfileId.mockResolvedValue("prof-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Chain 1: from().select().eq().single() — terminal is single
    db.single.mockResolvedValueOnce({ data: { xp: 500 }, error: null });
    // Chain 2: from().update({ xp }).eq("id", userId) — terminal is eq (default chainable gives error=undefined)
    // Chain 3: from().upsert(). Promise.all runs both concurrently
    db.upsert.mockResolvedValue({ error: null });
    db.insert.mockResolvedValue({ error: null });

    const { redeemReward } = await import("../rewards");
    const result = await redeemReward("reward-1");

    expect(result.success).toBe(true);
    expect(result.remainingXP).toBe(400);
  });

  it("throws on insufficient XP", async () => {
    mockedResolveProfileId.mockResolvedValue("prof-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.single.mockResolvedValueOnce({ data: { xp: 50 }, error: null });

    const { redeemReward } = await import("../rewards");
    await expect(redeemReward("reward-1")).rejects.toThrow("Insufficient XP");
  });

  it("throws for invalid reward", async () => {
    mockedResolveProfileId.mockResolvedValue("prof-1");
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    const { redeemReward } = await import("../rewards");
    await expect(redeemReward("invalid-reward")).rejects.toThrow("Reward not found");
  });
});
