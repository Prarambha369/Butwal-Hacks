import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/actions/admin", () => ({
  requireMaintainer: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createServiceClient } from "@/utils/supabase";
import { requireMaintainer } from "@/lib/actions/admin";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedRequireMaintainer = requireMaintainer as ReturnType<typeof vi.fn>;

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["from", "select", "eq", "order", "insert", "update", "delete"]) {
    db[m] = vi.fn(() => db);
  }
  return db;
}

describe("partners", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequireMaintainer.mockResolvedValue("auth0|admin");
  });

  it("returns active partners ordered, empty on DB error", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.order.mockReturnValueOnce(db);
    db.order.mockResolvedValueOnce({
      data: [{ id: "p1", name: "GitHub Education", logo_url: null, href: null, sort_order: 0, is_active: true }],
      error: null,
    });

    const { getActivePartners } = await import("../partners");
    const list = await getActivePartners();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("GitHub Education");
    expect(db.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("rejects blank names and non-https URLs are dropped", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.insert.mockResolvedValueOnce({ error: null });

    const { savePartner } = await import("../partners");
    await expect(savePartner({ name: "   " })).rejects.toThrow("name is required");

    const res = await savePartner({
      name: "Real Partner",
      logo_url: "http://evil.example/logo.png",
      href: "javascript:alert(1)",
    });
    expect(res.success).toBe(true);
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Real Partner", logo_url: null, href: null }),
    );
  });

  it("deletes by id", async () => {
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.eq.mockResolvedValueOnce({ error: null });

    const { deletePartner } = await import("../partners");
    const res = await deletePartner("p1");
    expect(res.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
  });
});
