import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createServiceClient } from "@/utils/supabase/service";

const mockedCreateServiceClient = createServiceClient as any;

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "neq", "in", "or", "order", "limit"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

describe("searchTalent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no profiles match", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    // Query filter present → chain ends with .or()
    db.or.mockResolvedValue({ data: null, error: null });

    const { searchTalent } = await import("../search-profiles");
    const result = await searchTalent({ query: "react" });

    expect(result).toEqual([]);
  });

  it("returns formatted results with trust markers", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Profiles query with query filter: chain ends with .or()
    db.or.mockResolvedValueOnce({
      data: [
        { id: "prof-1", slug_id: "alice-dev", bio: "React dev", avatar_url: null, xp: 100 },
      ],
      error: null,
    });
    // Markers query: from().select().in().eq() — eq is terminal
    // First eq in profiles is non-terminal → mockImplementationOnce returns db
    // eq in markers is terminal → mockResolvedValue returns data
    db.eq
      .mockImplementationOnce(() => db)
      .mockResolvedValue({
        data: [
          { profile_id: "prof-1", title: "Best Hackathon", type: "winner" },
        ],
        error: null,
      });

    const { searchTalent } = await import("../search-profiles");
    const result = await searchTalent({ query: "react" });

    expect(result).toHaveLength(1);
    expect(result[0].display_name).toBe("alice-dev");
    expect(result[0].trust_marker_count).toBe(1);
    expect(result[0].top_markers[0].title).toBe("Best Hackathon");
  });

  it("filters by marker type (no query filter)", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Profiles query without query filter: chain ends with .limit()
    db.limit.mockResolvedValueOnce({
      data: [
        { id: "prof-1", slug_id: "alice-dev", bio: null, avatar_url: null, xp: 100 },
        { id: "prof-2", slug_id: "bob-dev", bio: null, avatar_url: null, xp: 50 },
      ],
      error: null,
    });
    // Markers query: .in() returns db, .eq() is terminal
    db.eq
      .mockImplementationOnce(() => db)
      .mockResolvedValue({
        data: [
          { profile_id: "prof-1", title: "Winner", type: "winner" },
          { profile_id: "prof-2", title: "Participant", type: "participant" },
        ],
        error: null,
      });

    const { searchTalent } = await import("../search-profiles");
    const result = await searchTalent({ markerType: "winner" });

    expect(result).toHaveLength(1);
    expect(result[0].slug_id).toBe("alice-dev");
  });

  it("returns empty array on Supabase error", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.limit.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { searchTalent } = await import("../search-profiles");
    const result = await searchTalent();

    expect(result).toEqual([]);
  });
});
