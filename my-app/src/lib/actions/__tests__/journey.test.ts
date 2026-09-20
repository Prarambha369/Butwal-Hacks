import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createServiceClient } from "@/utils/supabase";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["from", "select", "eq"]) db[m] = vi.fn(() => db);
  return db;
}

describe("getJourney", () => {
  beforeEach(() => vi.clearAllMocks());

  it("unions all record sources newest-first with evidence links", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    // Query order: credentials, registrations, projects, markers, badges, certificates
    // Query order (7 eq calls): credentials, registrations x2 (1st intermediate), projects, markers, badges, certificates
    db.eq
      .mockResolvedValueOnce({ data: [{ unlocked_at: "2026-03-01T00:00:00Z", micro_credentials: { name: "React Pro" } }], error: null })
      .mockReturnValueOnce(db)
      .mockResolvedValueOnce({ data: [{ created_at: "2026-01-10T00:00:00Z", events: { title: "HackDay", slug: "hackday" } }], error: null })
      .mockResolvedValueOnce({ data: [{ id: "proj-1", title: "Shipped It", created_at: "2026-02-01T00:00:00Z", github_verified: true }], error: null })
      .mockResolvedValueOnce({ data: [{ id: "m-1", title: "Winner", type: "achievement", created_at: "2026-04-01T00:00:00Z", is_revoked: false }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const { getJourney } = await import("../journey");
    const entries = await getJourney("profile-1");

    expect(entries).toHaveLength(4);
    // Newest first
    expect(entries[0].kind).toBe("achievement");
    expect(entries[0].href).toBe("/verify/m-1");
    expect(entries[1].kind).toBe("skill");
    expect(entries[2].kind).toBe("project");
    expect(entries[2].detail).toBe("GitHub verified");
    expect(entries[3].kind).toBe("event");
    expect(entries[3].href).toBe("/events/hackday");
  });

  it("marks revoked achievements instead of hiding them", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.eq
      .mockResolvedValueOnce({ data: [], error: null })
      .mockReturnValueOnce(db)
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [{ id: "m-9", title: "Old Win", type: "achievement", created_at: "2025-01-01T00:00:00Z", is_revoked: true }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const { getJourney } = await import("../journey");
    const entries = await getJourney("profile-1");

    expect(entries).toHaveLength(1);
    expect(entries[0].revoked).toBe(true);
  });

  it("returns empty on DB error", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.eq.mockRejectedValue(new Error("DB down"));

    const { getJourney } = await import("../journey");
    expect(await getJourney("profile-1")).toEqual([]);
  });
});
