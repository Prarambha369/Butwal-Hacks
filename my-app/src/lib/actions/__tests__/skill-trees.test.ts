import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/profile-resolver", () => ({
  resolveProfileId: vi.fn(),
}));

vi.mock("@/lib/skill-trees", () => {
  const baseSkill = {
    id: "frontend-basics",
    name: "Frontend Basics",
    description: "Build a webpage",
    icon: "🌐",
    xpReward: 100,
    conditions: { type: "tech_categories", categories: ["Frontend"], min_count: 1 },
    prerequisiteIds: [],
  };

  return {
    SKILL_TREES: [
      {
        id: "web-dev",
        name: "Web Development",
        color: "#3b82f6",
        icon: "🌐",
        description: "Master web development",
        tiers: [
          {
            id: "tier-1",
            name: "Beginner",
            skills: [baseSkill],
          },
        ],
      },
    ],
  };
});

import { createServiceClient } from "@/utils/supabase";
import { resolveProfileId } from "@/lib/profile-resolver";

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

// ═══════════════════════════════════════════════════════════════════════════════
// getSkillTreesWithStatus
// ═══════════════════════════════════════════════════════════════════════════════

describe("getSkillTreesWithStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns skill trees with locked status when user has no projects", async () => {
    mockedResolveProfileId.mockResolvedValue("profile-1");
    const db = mockSupabase();

    // 3 queries: projects, event_registrations, profile_micro_credentials
    // Each chain ends with .eq("profile_id", profileId) as terminal
    db.eq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const { getSkillTreesWithStatus } = await import("../skill-trees");
    const trees = await getSkillTreesWithStatus();

    expect(trees).toHaveLength(1);
    expect(trees[0].id).toBe("web-dev");
    expect(trees[0].tiers[0].skills[0].status).toBe("available"); // no prereqs, no progress
  });

  it("returns all trees when no pagination params", async () => {
    mockedResolveProfileId.mockResolvedValue("profile-1");
    const db = mockSupabase();

    db.eq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const { getSkillTreesWithStatus } = await import("../skill-trees");
    const trees = await getSkillTreesWithStatus();

    // Should return all trees (1 in mock)
    expect(trees).toHaveLength(1);
  });

  it("returns empty array when page exceeds available trees", async () => {
    mockedResolveProfileId.mockResolvedValue("profile-1");
    const db = mockSupabase();

    db.eq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const { getSkillTreesWithStatus } = await import("../skill-trees");
    const trees = await getSkillTreesWithStatus({ page: 99, per_page: 10 });

    expect(trees).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getSkillTreeSummary
// ═══════════════════════════════════════════════════════════════════════════════

describe("getSkillTreeSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns summary with zero progress for new user", async () => {
    mockedResolveProfileId.mockResolvedValue("profile-1");
    const db = mockSupabase();

    db.eq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const { getSkillTreeSummary } = await import("../skill-trees");
    const summary = await getSkillTreeSummary();

    expect(summary.totalSkills).toBe(1);
    expect(summary.totalUnlocked).toBe(0);
    expect(summary.overallProgress).toBe(0);
    expect(summary.treeCount).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getProfileUnlockedSkills
// ═══════════════════════════════════════════════════════════════════════════════

describe("getProfileUnlockedSkills", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty list when no skills unlocked", async () => {
    const db = mockSupabase();
    db.eq.mockResolvedValue({ data: null, error: null });

    const { getProfileUnlockedSkills } = await import("../skill-trees");
    const result = await getProfileUnlockedSkills("profile-1");

    expect(result.unlockedSkills).toEqual([]);
    expect(result.totalUnlocked).toBe(0);
    expect(result.totalSkills).toBe(1);
  });

  it("returns matched unlocked skills with tree details", async () => {
    const db = mockSupabase();
    db.eq.mockResolvedValue({
      data: [{ credential_id: "frontend-basics", unlocked_at: "2026-01-01" }],
      error: null,
    });

    const { getProfileUnlockedSkills } = await import("../skill-trees");
    const result = await getProfileUnlockedSkills("profile-1");

    expect(result.totalUnlocked).toBe(1);
    expect(result.unlockedSkills[0].name).toBe("Frontend Basics");
    expect(result.unlockedSkills[0].treeName).toBe("Web Development");
    expect(result.unlockedSkills[0].xpReward).toBe(100);
  });
});
