import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

const mockedGetSession = auth0.getSession as any;
const mockedCreateServiceClient = createServiceClient as any;

function buildMockDb() {
  const db: Record<string, any> = {};
  const methods = ["from", "select", "eq", "update"];
  for (const m of methods) db[m] = vi.fn(() => db);
  return db;
}

function setAuthenticated() {
  mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
}

describe("verifyProjectGitHub", () => {
  beforeEach(() => vi.clearAllMocks());

  it("verifies a project's GitHub status", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.eq.mockResolvedValue({ error: null });

    const { verifyProjectGitHub } = await import("../moderation");
    const result = await verifyProjectGitHub("proj-1");

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ github_verified: true });
    expect(db.eq).toHaveBeenCalledWith("id", "proj-1");
  });

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);

    const { verifyProjectGitHub } = await import("../moderation");
    const result = await verifyProjectGitHub("proj-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("returns error on Supabase failure", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.eq.mockResolvedValue({ error: { message: "Update failed" } });

    const { verifyProjectGitHub } = await import("../moderation");
    const result = await verifyProjectGitHub("proj-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Verification failed");
  });
});

describe("updateProjectStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates project status", async () => {
    setAuthenticated();
    const db = buildMockDb();
    mockedCreateServiceClient.mockReturnValue(db);
    db.eq.mockResolvedValue({ error: null });

    const { updateProjectStatus } = await import("../moderation");
    const result = await updateProjectStatus("proj-1", "approved");

    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalledWith({ status: "approved" });
  });

  it("returns error when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);

    const { updateProjectStatus } = await import("../moderation");
    const result = await updateProjectStatus("proj-1", "approved");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });
});
