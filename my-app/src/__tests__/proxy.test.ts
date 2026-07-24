import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Shared Mocks ───────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder (same pattern as events-teams-projects.test.ts) ──

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "neq", "in", "or",
    "order", "limit", "like", "single", "maybeSingle",
    "insert", "update", "delete", "upsert",
  ] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as ReturnType<typeof createServiceClient> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    or: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
}

function mockSupabase() {
  const db = buildMockDb();
  mockedCreateServiceClient.mockReturnValue(db);
  return db;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setAuthenticated(sub = "auth0|12345") {
  mockedGetSession.mockResolvedValue({ user: { sub } });
}

function setProfileRole(db: ReturnType<typeof buildMockDb>, role: string) {
  db.single.mockResolvedValue({ data: { role }, error: null });
}

// ═══════════════════════════════════════════════════════════════════════════════
// redirectToDomain
// ═══════════════════════════════════════════════════════════════════════════════

describe("redirectToDomain", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to butwalhacks.com for main target", async () => {
    const { redirectToDomain } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/hacker");

    const response = redirectToDomain(request, "main");

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://butwalhacks.com/dashboard/hacker"
    );
  });

  it("redirects to app.butwalhacks.com for app target", async () => {
    const { redirectToDomain } = await import("@/proxy");
    const request = new NextRequest("https://butwalhacks.com/events/hackathon");

    const response = redirectToDomain(request, "app");

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://app.butwalhacks.com/events/hackathon"
    );
  });

  it("preserves query parameters in the redirect", async () => {
    const { redirectToDomain } = await import("@/proxy");
    const request = new NextRequest("https://butwalhacks.com/explore?q=test&page=1");

    const response = redirectToDomain(request, "app");

    const location = response.headers.get("location")!;
    expect(location).toContain("app.butwalhacks.com");
    expect(location).toContain("?q=test&page=1");
  });

  it("preserves the pathname", async () => {
    const { redirectToDomain } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/p/BH-26-ABCD");

    const response = redirectToDomain(request, "main");

    const location = response.headers.get("location")!;
    expect(location).toBe("https://butwalhacks.com/p/BH-26-ABCD");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// requireRole
// ═══════════════════════════════════════════════════════════════════════════════

describe("requireRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to /auth/login when unauthenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { requireRole } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/maintainer");

    const response = await requireRole(request, "/dashboard/maintainer", ["maintainer"]);

    expect(response.status).toBe(307); // NextResponse.redirect uses 307
    const location = response.headers.get("location")!;
    expect(location).toContain("/auth/login");
    expect(location).toContain("returnTo=%2Fdashboard%2Fmaintainer");
  });

  it("passes through when the user has the required role", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "maintainer");
    const { requireRole } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/maintainer");

    const response = await requireRole(request, "/dashboard/maintainer", ["maintainer"]);

    expect(response.status).toBe(200); // NextResponse.next() has 200
    expect(response.headers.get("x-middleware-next")).toBe("1"); // marker for pass-through
  });

  it("redirects to /dashboard/hacker when the user has a different role", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { requireRole } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/maintainer");

    const response = await requireRole(request, "/dashboard/maintainer", ["maintainer"]);

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/dashboard/hacker");
  });

  it("passes through when profile does not exist yet (no redirect loop)", async () => {
    setAuthenticated();
    const db = mockSupabase();
    // No profile found — single returns null
    db.single.mockResolvedValue({ data: null, error: null });
    const { requireRole } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/maintainer");

    const response = await requireRole(request, "/dashboard/maintainer", ["maintainer"]);

    // Should pass through so dashboard layout can create the profile
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows multiple roles (organizer or maintainer)", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "organizer");
    const { requireRole } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/organizer");

    const response = await requireRole(request, "/dashboard/organizer", ["organizer", "maintainer"]);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects role not in the allowed list", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { requireRole } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/organizer");

    const response = await requireRole(request, "/dashboard/organizer", ["organizer", "maintainer"]);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard/hacker");
  });

  it("passes through on Supabase query failure (graceful degradation)", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockRejectedValue(new Error("Connection failed"));
    const { requireRole } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/maintainer");

    const response = await requireRole(request, "/dashboard/maintainer", ["maintainer"]);

    expect(response.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// requireRoleByPath
// ═══════════════════════════════════════════════════════════════════════════════

describe("requireRoleByPath", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes maintainer paths to requireRole with [maintainer]", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "maintainer");
    const { requireRoleByPath } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/maintainer");

    const response = await requireRoleByPath(request, "/dashboard/maintainer/audit-log");

    expect(response.status).toBe(200);
    // Verify the Supabase query happened (required role check was invoked)
    expect(db.from).toHaveBeenCalled();
    expect(db.eq).toHaveBeenCalled();
  });

  it("routes organizer paths to requireRole with [organizer, maintainer]", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "organizer");
    const { requireRoleByPath } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/organizer");

    const response = await requireRoleByPath(request, "/dashboard/organizer/events");

    expect(response.status).toBe(200);
  });

  it("redirects unauthenticated users from /dashboard/hacker to login", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { requireRoleByPath } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/hacker");

    const response = await requireRoleByPath(request, "/dashboard/hacker");

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/auth/login");
    expect(location).toContain("returnTo=%2Fdashboard%2Fhacker");
  });

  it("passes through for authenticated hackers on /dashboard/hacker", async () => {
    setAuthenticated();
    const { requireRoleByPath } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/hacker");

    const response = await requireRoleByPath(request, "/dashboard/hacker");

    expect(response.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// proxy (main handler) — local dev flow
// ═══════════════════════════════════════════════════════════════════════════════

describe("proxy (main handler)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes through public routes in local dev", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/");

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("passes through /p/[slug_id] in local dev", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/p/BH-26-ABCD");

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("passes through explore page in local dev", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/explore");

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("requires auth for /dashboard/hacker in local dev", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/dashboard/hacker");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/auth/login");
  });

  it("redirects hackers away from /dashboard/maintainer in local dev", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/dashboard/maintainer");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/dashboard/hacker");
  });

  it("requires auth for /portal/ in local dev", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/portal/sponsors");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("allows sponsor role on /portal/ routes in local dev", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "sponsor");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/portal/sponsors");

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("rejects hacker role on /portal/ routes in local dev", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/portal/sponsors");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard/hacker");
  });
});
