import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ─── Shared Mocks ───────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder (same pattern as events-teams-projects.test.ts) ──

/**
 * Chainable no-op Supabase query builder.
 *
 * Every method returns the builder so `.from().select().eq().single()`
 * resolves, letting each test stub only the terminal `single()` call it
 * cares about.
 */
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

/** Install a fresh chainable builder as the mocked service client. */
function mockSupabase() {
  const db = buildMockDb();
  mockedCreateServiceClient.mockReturnValue(db);
  return db;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Make `auth0.getSession()` resolve as a signed-in user. */
function setAuthenticated(sub = "auth0|12345") {
  mockedGetSession.mockResolvedValue({ user: { sub } });
}

/** Stub the profiles lookup so the role query resolves with `role`. */
function setProfileRole(db: ReturnType<typeof buildMockDb>, role: string) {
  db.single.mockResolvedValue({ data: { role }, error: null });
}

// ═══════════════════════════════════════════════════════════════════════════════
// redirectToDomain
// ═══════════════════════════════════════════════════════════════════════════════

describe("redirectToDomain", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to butwalhacks.com for main target", async () => {
    const { redirectToDomain } = await import("@/proxy-helpers");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/hacker");

    const response = redirectToDomain(request, "main");

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://butwalhacks.com/dashboard/hacker"
    );
  });

  it("redirects to app.butwalhacks.com for app target", async () => {
    const { redirectToDomain } = await import("@/proxy-helpers");
    const request = new NextRequest("https://butwalhacks.com/events/hackathon");

    const response = redirectToDomain(request, "app");

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://app.butwalhacks.com/events/hackathon"
    );
  });

  it("preserves query parameters in the redirect", async () => {
    const { redirectToDomain } = await import("@/proxy-helpers");
    const request = new NextRequest("https://butwalhacks.com/explore?q=test&page=1");

    const response = redirectToDomain(request, "app");

    const location = response.headers.get("location")!;
    expect(location).toContain("app.butwalhacks.com");
    expect(location).toContain("?q=test&page=1");
  });

  it("preserves the pathname", async () => {
    const { redirectToDomain } = await import("@/proxy-helpers");
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
    const { requireRole } = await import("@/proxy-helpers");
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
    const { requireRole } = await import("@/proxy-helpers");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/maintainer");

    const response = await requireRole(request, "/dashboard/maintainer", ["maintainer"]);

    expect(response.status).toBe(200); // NextResponse.next() has 200
    expect(response.headers.get("x-middleware-next")).toBe("1"); // marker for pass-through
  });

  it("redirects to /dashboard/hacker when the user has a different role", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { requireRole } = await import("@/proxy-helpers");
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
    const { requireRole } = await import("@/proxy-helpers");
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
    const { requireRole } = await import("@/proxy-helpers");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/organizer");

    const response = await requireRole(request, "/dashboard/organizer", ["organizer", "maintainer"]);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects role not in the allowed list", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { requireRole } = await import("@/proxy-helpers");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/organizer");

    const response = await requireRole(request, "/dashboard/organizer", ["organizer", "maintainer"]);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard/hacker");
  });

  it("passes through on Supabase query failure (graceful degradation)", async () => {
    setAuthenticated();
    const db = mockSupabase();
    db.single.mockRejectedValue(new Error("Connection failed"));
    const { requireRole } = await import("@/proxy-helpers");
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
    const { requireRoleByPath } = await import("@/proxy-helpers");
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
    const { requireRoleByPath } = await import("@/proxy-helpers");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/organizer");

    const response = await requireRoleByPath(request, "/dashboard/organizer/events");

    expect(response.status).toBe(200);
  });

  it("redirects unauthenticated users from /dashboard/hacker to login", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { requireRoleByPath } = await import("@/proxy-helpers");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard/hacker");

    const response = await requireRoleByPath(request, "/dashboard/hacker");

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/auth/login");
    expect(location).toContain("returnTo=%2Fdashboard%2Fhacker");
  });

  it("redirects unauthenticated users from bare /dashboard hub to login", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { requireRoleByPath } = await import("@/proxy-helpers");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard");

    const response = await requireRoleByPath(request, "/dashboard");

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/auth/login");
    expect(location).toContain("returnTo=%2Fdashboard");
  });

  it("guards bare /dashboard through proxy() on the app host (not just requireRoleByPath)", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("https://app.butwalhacks.com/dashboard");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/auth/login");
    expect(location).toContain("returnTo=%2Fdashboard");
  });

  it("redirects bare /dashboard on the marketing host to the app subdomain", async () => {
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("https://butwalhacks.com/dashboard");

    const response = await proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")!).toContain("app.butwalhacks.com/dashboard");
  });

  it("passes through for authenticated hackers on /dashboard/hacker", async () => {
    setAuthenticated();
    const { requireRoleByPath } = await import("@/proxy-helpers");
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
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/");

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("passes through /p/[slug_id] in local dev", async () => {
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/p/BH-26-ABCD");

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("passes through explore page in local dev", async () => {
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/explore");

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("requires auth for /dashboard/hacker in local dev", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/dashboard/hacker");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/auth/login");
  });

  // ── calendar subdomain ────────────────────────────────────────────
  // calendar.butwalhacks.com matched no host rule and fell through to the
  // final NextResponse.next(), so every path on it was served unauthenticated.
  it("requires auth for the calendar host in local dev", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://calendar.localhost:3000/");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("passes through calendar API routes without auth", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest(
      "http://calendar.localhost:3000/api/calendar/google/connect"
    );

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("lets an authenticated user through on the calendar host", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://calendar.localhost:3000/");

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("leaves the bare localhost host alone", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/");

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("redirects hackers away from /dashboard/maintainer in local dev", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/dashboard/maintainer");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/dashboard/hacker");
  });

  it("requires auth for /portal/ in local dev", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/portal/sponsors");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("allows sponsor role on /portal/ routes in local dev", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "sponsor");
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/portal/sponsors");

    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it("rejects hacker role on /portal/ routes in local dev", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/portal/sponsors");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard/hacker");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// proxy — production host routing and chapter-subdomain rewrite
// ═══════════════════════════════════════════════════════════════════════════════
//
// Every branch below is unreachable from the e2e suite: Playwright drives
// http://localhost, which the proxy short-circuits into handleLocalDev on its
// first line. That left the whole production host router — cross-host
// redirects, the app-host role gates, and the subdomain rewrite — with zero
// coverage until this block.
//
// A NextRequest built from a full URL carries that URL's hostname, so the
// branches are reachable here even though they are not reachable over the dev
// server (which resolves every request to localhost regardless of Host).
//
// These tests pin CURRENT behaviour. They are the safety net for collapsing
// the duplicated role guards, so any intentional behaviour change during that
// refactor has to show up here as a deliberate edit.

describe("proxy (production host routing)", () => {
  beforeEach(() => vi.clearAllMocks());

  /** Make auth0.middleware resolve as a pass-through. */
  function setAuthPassThrough() {
    (auth0 as unknown as Record<string, unknown>).middleware = vi.fn(
      () => Promise.resolve(NextResponse.next()),
    );
  }

  // ── marketing host: butwalhacks.com ────────────────────────────────
  it("serves marketing routes on the marketing host without auth", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://butwalhacks.com/events"));

    expect(response.status).toBe(200);
  });

  it("308s /dashboard/* from the marketing host to the app host", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://butwalhacks.com/dashboard/hacker"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://app.butwalhacks.com/dashboard/hacker",
    );
  });

  it("308s /portal/* from the marketing host to the app host", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://butwalhacks.com/portal/sponsors"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://app.butwalhacks.com/portal/sponsors",
    );
  });

  // /orgs/ is a member of APP_PREFIXES, so on the marketing host it is
  // *redirected*, not gated. The auth check happens on the second hop — pinned
  // by the app-host /orgs test below. Two hops, but gated either way.
  it("308s /orgs/* from the marketing host to the app host, where auth is checked", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://butwalhacks.com/orgs/pokhara/dashboard"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://app.butwalhacks.com/orgs/pokhara/dashboard",
    );
  });

  it("preserves the query string when bouncing between hosts", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://butwalhacks.com/dashboard/hacker?tab=profile"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://app.butwalhacks.com/dashboard/hacker?tab=profile",
    );
  });

  // ── app host: app.butwalhacks.com ──────────────────────────────────
  it("308s marketing routes off the app host back to the marketing host", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://app.butwalhacks.com/events"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://butwalhacks.com/events");
  });

  it("requires auth for /dashboard/* on the app host", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://app.butwalhacks.com/dashboard/hacker"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
    expect(response.headers.get("location")).toContain(
      encodeURIComponent("/dashboard/hacker"),
    );
  });

  it("enforces the maintainer role on the app host", async () => {
    setAuthenticated();
    const db = mockSupabase();
    setProfileRole(db, "hacker");
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://app.butwalhacks.com/dashboard/maintainer"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard/hacker");
  });

  it("requires auth for /orgs/* on the app host", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://app.butwalhacks.com/orgs/pokhara/dashboard"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("passes other APP_PREFIXES on the app host through without auth", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://app.butwalhacks.com/teams/abc"));

    expect(response.status).toBe(200);
  });

  // ── shared prefixes ────────────────────────────────────────────────
  it("dispatches /auth/* to the Auth0 middleware on the app host", async () => {
    setAuthPassThrough();
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://app.butwalhacks.com/auth/login"),
    );

    expect(response.status).toBe(200);
  });

  it("dispatches /auth/* to the Auth0 middleware on the marketing host too", async () => {
    setAuthPassThrough();
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://butwalhacks.com/auth/login"));

    expect(response.status).toBe(200);
  });

  it("passes /_next/ and /api/ through untouched", async () => {
    const { default: proxy } = await import("@/proxy");

    const asset = await proxy(
      new NextRequest("https://app.butwalhacks.com/_next/static/chunk.js"),
    );
    expect(asset.status).toBe(200);

    const api = await proxy(new NextRequest("https://app.butwalhacks.com/api/health"));
    expect(api.status).toBe(200);
  });

  // ── calendar host ──────────────────────────────────────────────────
  it("requires auth for the production calendar host", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://calendar.butwalhacks.com/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("passes production calendar API routes through without auth", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://calendar.butwalhacks.com/api/calendar/google/connect"),
    );

    expect(response.status).toBe(200);
  });

  // ── chapter subdomain rewrite ──────────────────────────────────────
  it("rewrites a chapter subdomain root to that chapter's dashboard", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://pokhara.butwalhacks.com/"));

    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/orgs/pokhara/dashboard",
    );
  });

  it("rewrites a chapter subdomain path under /orgs/<slug>", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://pokhara.butwalhacks.com/members"),
    );

    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/orgs/pokhara/members",
    );
  });

  it("rewrites every mapped chapter subdomain", async () => {
    const { default: proxy } = await import("@/proxy");
    for (const slug of ["pokhara", "kathmandu", "chitwan"]) {
      const response = await proxy(
        new NextRequest(`https://${slug}.butwalhacks.com/events`),
      );
      expect(response.headers.get("x-middleware-rewrite")).toContain(
        `/orgs/${slug}/events`,
      );
    }
  });

  it("passes /api/ and /auth/ on a chapter subdomain straight through", async () => {
    const { default: proxy } = await import("@/proxy");

    const api = await proxy(
      new NextRequest("https://pokhara.butwalhacks.com/api/health"),
    );
    expect(api.headers.get("x-middleware-rewrite")).toBeNull();
    expect(api.status).toBe(200);

    const auth = await proxy(
      new NextRequest("https://pokhara.butwalhacks.com/auth/login"),
    );
    expect(auth.headers.get("x-middleware-rewrite")).toBeNull();
    expect(auth.status).toBe(200);
  });

  it("does not rewrite subdomains whose first label is not a mapped slug", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://dehradun.butwalhacks.com/members"),
    );

    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.status).toBe(200);
  });

  // Loose match, pinned deliberately: SUBDOMAIN_MAP is keyed on parts[0] only
  // and the parent domain is never checked, so ANY host whose first label is a
  // mapped slug gets rewritten onto that chapter's content — including hosts
  // outside butwalhacks.com. Not a content leak (OrgLayout still gates it, and
  // it only ever serves our own chapter routes), but the routing is looser than
  // "chapter subdomains". Recorded here so the host check is a visible,
  // deliberate change if it is ever tightened.
  it("rewrites a mapped slug regardless of the parent domain", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://pokhara.example.com/members"),
    );

    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/orgs/pokhara/members",
    );
  });

  // The rewrite is terminal — Next does not re-enter the proxy for the
  // rewritten path — so a chapter subdomain gets NO proxy-level auth gate.
  // That is intentional: OrgLayout resolves chapter_members and redirects to
  // /dashboard when the viewer is not a member, which is where Next's own
  // guidance says authorization belongs. Pinned because it is the one place
  // the router relies solely on the layout: on localhost the same /orgs/ path
  // is gated by handleLocalDev, and on the marketing host it is redirected to
  // the app host and gated there.
  it("applies no proxy-level auth gate to the rewritten chapter path", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { default: proxy } = await import("@/proxy");
    const response = await proxy(
      new NextRequest("https://pokhara.butwalhacks.com/dashboard"),
    );

    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/orgs/pokhara/dashboard",
    );
    expect(response.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// runAuthMiddleware — Auth0 misconfiguration handling
// ═══════════════════════════════════════════════════════════════════════════════

describe("auth middleware misconfiguration", () => {
  beforeEach(() => vi.clearAllMocks());

  function setMiddlewareImpl(impl: (req: NextRequest) => Promise<never> | never) {
    (auth0 as unknown as Record<string, unknown>).middleware = vi.fn(impl);
  }

  function configError(): Error & { code: string } {
    const err = new Error(
      "Missing: domain: Set AUTH0_DOMAIN env var or pass domain in options",
    ) as Error & { code: string };
    err.code = "invalid_configuration";
    return err;
  }

  it("redirects to sign-in instead of 500 when Auth0 is unconfigured (local)", async () => {
    setMiddlewareImpl(() => { throw configError(); });
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/auth/profile");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in?error=auth_unavailable");
  });

  it("redirects to sign-in instead of 500 when Auth0 is unconfigured (prod domain)", async () => {
    setMiddlewareImpl(() => { throw configError(); });
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("https://butwalhacks.com/auth/login");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in?error=auth_unavailable");
  });

  it("rethrows non-config auth errors to preserve SDK behavior", async () => {
    setMiddlewareImpl(() => { throw new Error("callback failed"); });
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/auth/callback?code=x");

    await expect(proxy(request)).rejects.toThrow("callback failed");
  });

  it("detects config errors wrapped in DomainResolutionError cause chain", async () => {
    // Exact shape from production logs: the SDK wraps
    // InvalidConfigurationError inside DomainResolutionError.
    const cause = new Error(
      "Missing: domain: Set AUTH0_DOMAIN env var or pass domain in options",
    ) as Error & { code: string };
    cause.code = "invalid_configuration";
    const wrapped = new Error("Domain resolver threw an error.") as Error & {
      code: string;
      cause: Error;
    };
    wrapped.code = "domain_resolution_error";
    wrapped.cause = cause;
    setMiddlewareImpl(() => { throw wrapped; });
    const { default: proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/auth/profile");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/sign-in?error=auth_unavailable");
  });
});
