import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn((handler) => handler),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/analytics/server", () => ({
  captureServerEvent: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/github", () => ({
  fetchRepoMeta: vi.fn(),
}));

import { createServiceClient } from "@/utils/supabase";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { fetchRepoMeta } from "@/lib/github";

const mockedCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;
const mockedGetSession = auth0.getSession as unknown as ReturnType<typeof vi.fn>;
const mockedFetchRepoMeta = fetchRepoMeta as unknown as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder ───────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "in", "or", "not",
    "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete",
  ] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as ReturnType<typeof createServiceClient> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    not: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
}

function mockRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost:3000", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const MOCK_PROJECTS = [
  { id: "proj-1", github_url: "https://github.com/user/repo1" },
  { id: "proj-2", github_url: "https://github.com/user/repo2" },
];

/**
 * Helper to set up the common mock DB for deep-sync tests.
 *
 * The deep-sync route uses two Supabase query chains:
 *   1. Profile lookup: from("profiles").select("id").eq("auth0_user_id", userId).single()
 *      → single() is terminal, set via `db.single.mockResolvedValue`
 *   2. Projects query: from("projects").select("id, github_url").eq("profile_id", id).not("github_url", "is", null)
 *      → not() is terminal, set via `db.not.mockResolvedValue`
 *
 * DO NOT set select.mockResolvedValue — select is never terminal in these chains.
 */
function setupMockDb(
  profileData: { id: string } | null,
  projectsData: Array<{ id: string; github_url: string }> | null,
) {
  const db = buildMockDb();
  db.single.mockResolvedValue({ data: profileData, error: profileData ? null : null });
  db.not.mockResolvedValue({ data: projectsData, error: null });
  mockedCreateServiceClient.mockReturnValue(db);
  return db;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/github/deep-sync
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/github/deep-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });
    // happy-path defaults overridden per test
    setupMockDb({ id: "profile-uuid" }, MOCK_PROJECTS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Auth ──────────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  // ── Profile ───────────────────────────────────────────────────────

  it("returns 500 when profile not found", async () => {
    setupMockDb(null, null);

    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Profile not found");
  });

  // ── No GitHub projects ────────────────────────────────────────────

  it("returns early when projects data is null", async () => {
    setupMockDb({ id: "profile-uuid" }, null);

    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updated).toBe(0);
    expect(body.total).toBe(0);
    expect(body.message).toContain("No GitHub-linked projects found");
  });

  it("returns early when projects array is empty", async () => {
    setupMockDb({ id: "profile-uuid" }, []);

    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updated).toBe(0);
    expect(body.total).toBe(0);
    expect(body.message).toContain("No GitHub-linked projects found");
  });

  // ── Timeout behavior ──────────────────────────────────────────────

  it("times out when fetchRepoMeta takes longer than 15s", async () => {
    vi.useFakeTimers();

    // fetchRepoMeta never resolves — forces Promise.race to wait for the timeout
    mockedFetchRepoMeta.mockReturnValue(new Promise<null>(() => {}));

    // Single project so Promise.race has predictable behavior
    setupMockDb({ id: "profile-uuid" }, [{ id: "proj-1", github_url: "https://github.com/user/repo1" }]);

    const { POST } = await import("../deep-sync/route");

    // Start the request — Promise.race begins with unresolved fetchRepoMeta
    const resPromise = POST(mockRequest({}));

    // Advance timers past the 15s threshold — fires the timeout rejection
    await vi.advanceTimersByTimeAsync(15001);

    const res = await resPromise;
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal error");

    // Verify the timeout error was logged
    expect(logger.error).toHaveBeenCalledWith(
      "[github-deep-sync] unexpected error:",
      expect.objectContaining({ message: "Deep sync timed out after 15s" }),
    );
  });

  it("does not time out before the 15s threshold", async () => {
    vi.useFakeTimers();

    mockedFetchRepoMeta.mockReturnValue(new Promise<null>(() => {}));
    setupMockDb({ id: "profile-uuid" }, [{ id: "proj-1", github_url: "https://github.com/user/repo1" }]);

    const { POST } = await import("../deep-sync/route");

    // Start the request — Promise.race begins
    const resPromise = POST(mockRequest({}));

    // Advance 14s (under the 15s threshold) — the timeout should NOT have fired yet
    await vi.advanceTimersByTimeAsync(14000);

    // Promise.resolve settles on the next microtask (not timer-based), so it wins
    // the race against the still-pending deep-sync request
    const result = await Promise.race([
      resPromise.then(() => "resolved" as const),
      Promise.resolve("pending" as const),
    ]);

    expect(result).toBe("pending");
  });

  it("completes successfully before timeout when fetchRepoMeta resolves quickly", async () => {
    mockedFetchRepoMeta.mockResolvedValue({
      stargazers_count: 5,
      forks_count: 2,
      commit_count: 42,
      readme_preview: "A cool project readme",
      pushed_at: "2026-01-15T00:00:00Z",
      topics: ["react", "typescript"],
      language: "TypeScript",
    });

    setupMockDb({ id: "profile-uuid" }, [{ id: "proj-1", github_url: "https://github.com/user/repo1" }]);

    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.updated).toBe(1);
    expect(body.total).toBe(1);
    expect(body.failed).toBe(0);
  });

  // ── Partial failures ──────────────────────────────────────────────

  it("handles partial failures — some repos return null meta, others succeed", async () => {
    mockedFetchRepoMeta
      .mockResolvedValueOnce({
        stargazers_count: 10,
        forks_count: 3,
        commit_count: 100,
        readme_preview: null,
        pushed_at: "2026-02-01T00:00:00Z",
        topics: [],
        language: "Python",
      })
      .mockResolvedValueOnce(null);

    setupMockDb({ id: "profile-uuid" }, MOCK_PROJECTS);

    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    // Only the first repo returned valid meta and got updated
    expect(body.updated).toBe(1);
    expect(body.total).toBe(2);
    expect(body.failed).toBe(0);
  });

  it("handles all repos failing — all fetchRepoMeta calls return null", async () => {
    mockedFetchRepoMeta.mockResolvedValue(null);
    setupMockDb({ id: "profile-uuid" }, MOCK_PROJECTS);

    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.updated).toBe(0);
    expect(body.total).toBe(2);
    expect(body.message).toContain("No metadata refreshed");
  });

  // ── Error handling ────────────────────────────────────────────────

  it("returns 500 on unexpected error and logs it", async () => {
    mockedGetSession.mockRejectedValue(new Error("Auth0 down"));

    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal error");
    expect(logger.error).toHaveBeenCalledWith(
      "[github-deep-sync] unexpected error:",
      expect.any(Error),
    );
  });

  // ── Responses ─────────────────────────────────────────────────────

  it("returns message with correct singular form for 1 project", async () => {
    mockedFetchRepoMeta.mockResolvedValue({
      stargazers_count: 5,
      forks_count: 2,
      commit_count: 42,
      readme_preview: "A project",
      pushed_at: "2026-01-15T00:00:00Z",
      topics: [],
      language: "TypeScript",
    });

    setupMockDb({ id: "profile-uuid" }, [{ id: "proj-1", github_url: "https://github.com/user/repo1" }]);

    const { POST } = await import("../deep-sync/route");
    const res = await POST(mockRequest({}));
    const body = await res.json();

    expect(body).toHaveProperty("message");
    expect(body.message).toBe("Refreshed metadata for 1 project.");
  });
});
