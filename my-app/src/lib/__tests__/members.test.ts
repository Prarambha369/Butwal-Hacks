import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  toDisplayRole,
  getExplorerStats,
  filterMembers,
  fetchExplorerMembers,
  type ExplorerMember,
} from "@/lib/members";

describe("toDisplayRole", () => {
  it("maps lowercase DB roles to directory roles", () => {
    expect(toDisplayRole("hacker")).toBe("Builder");
    expect(toDisplayRole("mentor")).toBe("Mentor");
    expect(toDisplayRole("organizer")).toBe("Organizer");
    expect(toDisplayRole("maintainer")).toBe("Organizer");
    expect(toDisplayRole("sponsor")).toBe("Sponsor");
  });

  it("defaults unknown and null roles to Builder", () => {
    expect(toDisplayRole(null)).toBe("Builder");
    expect(toDisplayRole("HACKER")).toBe("Builder");
    expect(toDisplayRole("whatever")).toBe("Builder");
  });
});

function member(overrides: Partial<ExplorerMember> = {}): ExplorerMember {
  return {
    bhId: "BH-000",
    name: "Test Member",
    role: "Builder",
    avatar: "TM",
    bio: "",
    skills: [],
    projects: 0,
    events: 0,
    joined: "2026-01",
    openToMentor: false,
    lookingForTeam: false,
    ...overrides,
  };
}

describe("getExplorerStats", () => {
  it("counts normalized roles so the Builders tile never sticks at zero", () => {
    const members = [
      member({ role: "Builder" }),
      member({ role: "Builder" }),
      member({ role: "Organizer" }),
    ];
    const stats = getExplorerStats(members);
    expect(stats.total).toBe(3);
    expect(stats.byRole.Builder).toBe(2);
    expect(stats.byRole.Organizer).toBe(1);
  });

  it("counts the availability flags for the filter chips", () => {
    const members = [
      member({ openToMentor: true }),
      member({ lookingForTeam: true }),
      member(),
    ];
    const stats = getExplorerStats(members);
    expect(stats.openToMentor).toBe(1);
    expect(stats.lookingForTeam).toBe(1);
  });
});

describe("filterMembers — availability facets", () => {
  const members = [
    member({ bhId: "BH-1", name: "Mentor Maya", openToMentor: true }),
    member({ bhId: "BH-2", name: "Team Tom", lookingForTeam: true }),
    member({ bhId: "BH-3", name: "Plain Pat" }),
  ];

  it("keeps only opt-in mentors when the mentor facet is on", () => {
    const results = filterMembers(members, { openToMentor: true });
    expect(results.map((m) => m.bhId)).toEqual(["BH-1"]);
  });

  it("keeps only members seeking a team when the team facet is on", () => {
    const results = filterMembers(members, { lookingForTeam: true });
    expect(results.map((m) => m.bhId)).toEqual(["BH-2"]);
  });

  it("intersects availability facets with the role and query filters", () => {
    const withRole = filterMembers(members, { role: "Builder", openToMentor: true });
    expect(withRole.map((m) => m.bhId)).toEqual(["BH-1"]);
    const withQuery = filterMembers(members, { query: "tom", lookingForTeam: true });
    expect(withQuery.map((m) => m.bhId)).toEqual(["BH-2"]);
  });

  it("hides nobody when a facet is false (unchecked box)", () => {
    expect(filterMembers(members, { openToMentor: false, lookingForTeam: false })).toHaveLength(3);
  });
});

describe("fetchExplorerMembers", () => {
  function stubClient(
    profiles: Record<string, unknown>[],
    projects: { profile_id: string }[],
    events: { profile_id: string }[],
  ) {
    return {
      from(table: string) {
        if (table === "profiles") {
          return {
            select: () => ({
              not: () => ({
                limit: async () => ({ data: profiles, error: null }),
              }),
            }),
          };
        }
        const rows = table === "projects" ? projects : events;
        return {
          select: () => ({
            in: async () => ({ data: rows, error: null }),
          }),
        };
      },
    } as unknown as SupabaseClient;
  }

  const baseProfile = {
    id: "p1",
    bh_id: "BH-001",
    full_name: "Asha K",
    role: "hacker",
    bio: null,
    skills: ["React"],
    created_at: "2026-01-01T00:00:00Z",
    auth0_user_id: "auth0|1",
  };

  it("normalizes role, derives counts per profile, and maps the 031 flags", async () => {
    const client = stubClient(
      [
        { ...baseProfile, open_to_mentor: true, looking_for_team: false },
        { ...baseProfile, id: "p2", bh_id: "BH-002", role: "mentor", open_to_mentor: null, looking_for_team: true },
      ],
      [{ profile_id: "p1" }, { profile_id: "p1" }, { profile_id: "p2" }],
      [{ profile_id: "p2" }],
    );

    const members = await fetchExplorerMembers(client);
    expect(members).toHaveLength(2);
    expect(members[0]).toMatchObject({
      name: "Asha K",
      role: "Builder",
      projects: 2,
      events: 0,
      joined: "2026-01",
      openToMentor: true,
      lookingForTeam: false,
    });
    expect(members[1]).toMatchObject({
      role: "Mentor",
      projects: 1,
      events: 1,
      openToMentor: false,
      lookingForTeam: true,
    });
  });

  it("returns an empty array when the profiles query errors", async () => {
    const client = {
      from: () => ({
        select: () => ({
          not: () => ({
            limit: async () => ({ data: null, error: { message: "boom" } }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;
    expect(await fetchExplorerMembers(client)).toEqual([]);
  });
});
