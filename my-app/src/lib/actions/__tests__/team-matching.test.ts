import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
vi.mock("@/utils/supabase/service", () => ({ createServiceClient: vi.fn() }));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

const mockedGetSession = auth0.getSession as any;
const mockedCreateServiceClient = createServiceClient as any;

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "neq", "limit", "single"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

function setAuthenticated() {
  mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
}

describe("findTeammates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns matching candidates based on skill overlap", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    // Current user profile
    db.single.mockResolvedValueOnce({
      data: {
        id: "my-prof-1",
        skills: ["React", "TypeScript", "Node.js"],
        social_links: {},
        bh_id: "BH-24-001",
        xp: 500,
        bio: "Full-stack developer passionate about building apps",
      },
      error: null,
    });

    // Other profiles
    db.limit.mockResolvedValue({
      data: [
        {
          id: "other-1",
          full_name: "Alice",
          bh_id: "BH-24-002",
          role: "hacker",
          xp: 600,
          avatar_url: null,
          bio: "React developer building awesome apps",
          skills: ["React", "Python", "TypeScript"],
          social_links: { github: "https://github.com/alice" },
        },
      ],
      error: null,
    });

    const { findTeammates } = await import("../team-matching");
    const result = await findTeammates();

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].full_name).toBe("Alice");
    expect(result.candidates[0].matchScore).toBeGreaterThan(0);
    expect(result.candidates[0].matchReasons.some((r: string) => r.includes("Shared skills"))).toBe(true);
  });

  it("throws when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);

    const { findTeammates } = await import("../team-matching");
    await expect(findTeammates()).rejects.toThrow("You must be signed in");
  });

  it("returns empty candidates when no other profiles exist", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.single.mockResolvedValueOnce({
      data: { id: "my-prof-1", skills: [], social_links: {}, bh_id: "BH-24-001", xp: 0, bio: null },
      error: null,
    });
    db.limit.mockResolvedValue({ data: null, error: null });

    const { findTeammates } = await import("../team-matching");
    const result = await findTeammates();

    expect(result.candidates).toEqual([]);
    expect(result.yourSkills).toEqual([]);
  });

  it("sorts candidates by match score descending", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);

    db.single.mockResolvedValueOnce({
      data: {
        id: "my-prof-1", skills: ["React"], social_links: {},
        bh_id: "BH-24-001", xp: 500, bio: "Developer",
      },
      error: null,
    });

    db.limit.mockResolvedValue({
      data: [
        { id: "other-1", full_name: "Low Match", bh_id: "B2", role: "hacker", xp: 10, avatar_url: null, bio: null, skills: [], social_links: {} },
        { id: "other-2", full_name: "High Match", bh_id: "B3", role: "hacker", xp: 600, avatar_url: null, bio: "Developer creating apps", skills: ["React"], social_links: {} },
      ],
      error: null,
    });

    const { findTeammates } = await import("../team-matching");
    const result = await findTeammates();

    expect(result.candidates[0].full_name).toBe("High Match");
    expect(result.candidates[1].full_name).toBe("Low Match");
  });
});
