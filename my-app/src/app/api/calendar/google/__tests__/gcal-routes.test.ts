import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock("@/lib/rate-limiter", () => ({ withRateLimit: (fn: unknown) => fn }));
vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));

vi.mock("@/lib/google-calendar/client", () => ({
  exchangeCode: vi.fn(),
  refreshAccessToken: vi.fn(),
  createEvent: vi.fn(),
  patchEvent: vi.fn(),
  getEvent: vi.fn(),
  GoogleApiError: class GoogleApiError extends Error {
    constructor(m: string, readonly status: number, readonly body: string) {
      super(m);
    }
  },
}));

vi.mock("@/lib/google-calendar/tokens", () => ({
  getConnection: vi.fn(),
  upsertConnection: vi.fn(),
  updateAccessToken: vi.fn(),
  recordSyncResult: vi.fn(),
  appendSyncLog: vi.fn(),
  deleteConnection: vi.fn(),
}));

vi.mock("@/lib/google-calendar/sync", () => ({ syncUserCalendar: vi.fn() }));

import { auth0 } from "@/lib/auth0";
import { exchangeCode } from "@/lib/google-calendar/client";
import { getConnection, upsertConnection, deleteConnection } from "@/lib/google-calendar/tokens";
import { syncUserCalendar } from "@/lib/google-calendar/sync";
import { GOOGLE_OAUTH_STATE_COOKIE, GOOGLE_OAUTH_STATE_PATH } from "@/lib/google-calendar/oauth-state";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;

function signedIn() {
  mockedGetSession.mockResolvedValue({ user: { sub: "auth0|primary" } });
}

function get(url: string) {
  return new Request(url) as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("GOOGLE_CLIENT_ID", "client-123.apps.googleusercontent.com");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
  vi.stubEnv("CALENDAR_BASE_URL", "https://calendar.butwalhacks.com");
  (syncUserCalendar as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    counts: { create: 2, update: 0, skip: 1, orphan: 0 },
    failures: [],
  });
});

// ── GET /api/calendar/google/connect ─────────────────────────────────

describe("GET /api/calendar/google/connect", () => {
  it("returns 401 when not signed in", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { GET } = await import("../connect/route");
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("sets the state cookie at the shared path and returns a consent URL", async () => {
    signedIn();
    const { GET } = await import("../connect/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const { url } = await res.json();
    expect(url).toContain("accounts.google.com/o/oauth2/v2/auth");
    // access_type=offline is what produces a refresh token.
    expect(url).toContain("access_type=offline");
    // The narrow, verifiable scope -- not calendar.events.
    expect(url).toContain(
      encodeURIComponent("https://www.googleapis.com/auth/calendar.events.owned")
    );
    expect(url).not.toContain(encodeURIComponent("auth/calendar.events&"));

    const [name, , options] = cookieStore.set.mock.calls[0];
    expect(name).toBe(GOOGLE_OAUTH_STATE_COOKIE);
    expect(options.path).toBe(GOOGLE_OAUTH_STATE_PATH);
    expect(options.httpOnly).toBe(true);
  });

  it("returns 503 rather than 500 when Google is not configured", async () => {
    signedIn();
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    const { GET } = await import("../connect/route");
    const res = await GET();

    expect(res.status).toBe(503);
  });
});

// ── GET /api/calendar/google/callback ────────────────────────────────

describe("GET /api/calendar/google/callback", () => {
  function stateCookie(value: string) {
    cookieStore.get.mockReturnValue({ value });
  }

  const base = "http://localhost:3000/api/calendar/google/callback";

  it("deletes the state cookie at the path it was set with", async () => {
    stateCookie("nonce123:auth0|primary");
    (exchangeCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "at",
      refresh_token: "rt",
      expires_in: 3600,
      scope: "s",
    });
    (upsertConnection as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const { GET } = await import("../callback/route");
    await GET(get(`${base}?code=abc&state=nonce123`));

    // A delete without the same path/domain silently no-ops on a scoped cookie.
    expect(cookieStore.delete.mock.calls[0][0]).toMatchObject({
      name: GOOGLE_OAUTH_STATE_COOKIE,
      path: GOOGLE_OAUTH_STATE_PATH,
    });
    expect(cookieStore.delete.mock.calls[0][0]).toHaveProperty("domain");
  });

  it("rejects a state that does not match the cookie", async () => {
    stateCookie("different:auth0|primary");
    const { GET } = await import("../callback/route");
    const res = await GET(get(`${base}?code=abc&state=nonce123`));

    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(/expired/i);
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("rejects a callback with no state cookie at all", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const { GET } = await import("../callback/route");
    const res = await GET(get(`${base}?code=abc&state=whatever`));

    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(/expired/i);
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("fails visibly when the connection could not be stored", async () => {
    // upsertConnection returns false when the encrypt RPC or the upsert fails.
    // Reporting gcal=connected there would show a green tick over an empty
    // calendar, and the first sync would just return not_connected.
    stateCookie("nonce123:auth0|primary");
    (exchangeCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "at",
      refresh_token: "rt",
      expires_in: 3600,
      scope: "scope-a",
    });
    (upsertConnection as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const { GET } = await import("../callback/route");
    const res = await GET(get(`${base}?code=abc&state=nonce123`));

    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(
      /failed to save/i
    );
    expect(loc.searchParams.get("gcal")).not.toBe("connected");
    expect(syncUserCalendar).not.toHaveBeenCalled();
  });

  it("fails visibly when a refreshed token cannot be stored", async () => {
    stateCookie("nonce123:auth0|primary");
    (exchangeCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "at2",
      expires_in: 3600,
      scope: "scope-a",
    });
    (getConnection as ReturnType<typeof vi.fn>).mockResolvedValue({
      tokens: { refreshToken: "existing-rt" },
      googleEmail: "g@example.com",
    });
    (upsertConnection as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const { GET } = await import("../callback/route");
    const res = await GET(get(`${base}?code=abc&state=nonce123`));

    const loc = new URL(res.headers.get("location")!);
    expect(loc.searchParams.get("gcal")).not.toBe("connected");
    expect(syncUserCalendar).not.toHaveBeenCalled();
  });

  it("stores the tokens and runs a first sync", async () => {
    stateCookie("nonce123:auth0|primary");
    (exchangeCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "at",
      refresh_token: "rt",
      expires_in: 3600,
      scope: "scope-a",
    });
    (upsertConnection as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const { GET } = await import("../callback/route");
    const res = await GET(get(`${base}?code=abc&state=nonce123`));

    expect(upsertConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        auth0UserId: "auth0|primary",
        refreshToken: "rt",
      })
    );
    expect(syncUserCalendar).toHaveBeenCalledWith("auth0|primary");

    const loc = new URL(res.headers.get("location")!);
    expect(loc.searchParams.get("gcal")).toBe("connected");
  });

  it("keeps the stored refresh token when Google returns none", async () => {
    stateCookie("nonce123:auth0|primary");
    (exchangeCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "at",
      expires_in: 3600,
    });
    (getConnection as ReturnType<typeof vi.fn>).mockResolvedValue({
      tokens: { refreshToken: "existing-rt" },
      googleEmail: "a@b.c",
    });
    (upsertConnection as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const { GET } = await import("../callback/route");
    await GET(get(`${base}?code=abc&state=nonce123`));

    // Overwriting with an empty refresh token would silently break background sync.
    expect(upsertConnection).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: "existing-rt" })
    );
  });

  it("fails cleanly when there is no refresh token anywhere", async () => {
    stateCookie("nonce123:auth0|primary");
    (exchangeCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "at",
      expires_in: 3600,
    });
    (getConnection as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { GET } = await import("../callback/route");
    const res = await GET(get(`${base}?code=abc&state=nonce123`));

    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(/offline access/i);
    expect(upsertConnection).not.toHaveBeenCalled();
  });

  it("handles a user declining consent", async () => {
    const { GET } = await import("../callback/route");
    const res = await GET(get(`${base}?error=access_denied`));

    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(/not connected/i);
    expect(exchangeCode).not.toHaveBeenCalled();
  });
});

// ── GET /api/calendar/google/status ──────────────────────────────────

describe("GET /api/calendar/google/status", () => {
  it("never returns token material", async () => {
    signedIn();
    (getConnection as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth0UserId: "auth0|primary",
      calendarId: "primary",
      scopes: "s",
      googleEmail: "a@b.c",
      syncEnabled: true,
      lastSyncedAt: "2026-01-01T00:00:00Z",
      lastSyncError: null,
      tokens: { accessToken: "SECRET-AT", refreshToken: "SECRET-RT", expiresAt: 1 },
      googleEventIds: { "a": { id: "g1", managedHash: "h" } },
    });

    const { GET } = await import("../status/route");
    const res = await GET();
    const raw = JSON.stringify(await res.json());

    expect(raw).not.toContain("SECRET-AT");
    expect(raw).not.toContain("SECRET-RT");
    const body = JSON.parse(raw);
    expect(body.connected).toBe(true);
    expect(body.hasRefreshToken).toBe(true);
    expect(body.syncedEventCount).toBe(1);
  });

  it("reports not_connected when there is no row", async () => {
    signedIn();
    (getConnection as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { GET } = await import("../status/route");
    const res = await GET();

    expect(await res.json()).toEqual({ connected: false });
  });
});

// ── POST /api/calendar/google/disconnect ─────────────────────────────

describe("POST /api/calendar/google/disconnect", () => {
  it("tells the user their events were left in place", async () => {
    signedIn();
    (deleteConnection as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const { POST } = await import("../disconnect/route");
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/left in place/i);
  });

  it("requires auth", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../disconnect/route");
    const res = await POST();

    expect(res.status).toBe(401);
    expect(deleteConnection).not.toHaveBeenCalled();
  });
});

// ── GET /api/calendar/google/cron ────────────────────────────────────

describe("GET /api/calendar/google/cron", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cret-value-that-is-long-enough");
  });

  it("rejects a request with no or wrong bearer token", async () => {
    const { GET } = await import("../cron/route");
    const res = await GET(get("http://localhost:3000/api/calendar/google/cron"));

    expect(res.status).toBe(401);
  });

  it("refuses to run at all when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const { GET } = await import("../cron/route");
    const res = await GET(get("http://localhost:3000/api/calendar/google/cron"));

    expect(res.status).toBe(503);
  });
});
