import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/lib/auth0-management", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth0-management")>(
    "@/lib/auth0-management"
  );
  return {
    ...actual,
    buildLinkAuthUrl: vi.fn(() => "https://auth.example.com/authorize?x=1"),
    unlinkIdentity: vi.fn(),
    getUserIdentities: vi.fn(),
    linkIdentity: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
  };
});

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: (fn: unknown) => fn,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth0 } from "@/lib/auth0";
import {
  unlinkIdentity,
  getUserIdentities,
  linkIdentity,
  exchangeCodeForTokens,
} from "@/lib/auth0-management";
import { createServiceClient } from "@/utils/supabase";
import {
  LINK_STATE_COOKIE,
  LINK_STATE_COOKIE_PATH,
  buildLinkState,
} from "@/lib/auth0-link-state";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

/**
 * Chainable Supabase stub.
 *
 * Terminal calls (`maybeSingle`, `single`) resolve to whatever you set. The
 * mutating calls deliberately keep returning the chain object, so `.eq()` is
 * still reachable after `.update()` -- mocking `update` to resolve would break
 * the chain the way a real client never would.
 */
function buildDb() {
  const db: Record<string, unknown> = { error: null };
  for (const m of [
    "from", "select", "eq", "in", "maybeSingle", "single",
    "insert", "update", "delete", "upsert",
  ] as const) {
    db[m] = vi.fn(() => db);
  }
  // A chain that is awaited without a terminal call resolves to the chain
  // object itself, so `db.error` is how a mutation reports failure.
  // Set it to simulate an update/write error.
  return db as Record<string, ReturnType<typeof vi.fn>> & { error: unknown };
}

let db: ReturnType<typeof buildDb>;

function signedIn() {
  mockedGetSession.mockResolvedValue({
    user: { sub: "auth0|primary", email: "user@example.com" },
  });
}

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  db = buildDb();
  mockedCreateServiceClient.mockReturnValue(db);
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
});

// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/link/initiate
// ═══════════════════════════════════════════════════════════════════════

describe("POST /api/auth/link/initiate", () => {
  it("returns 401 when not signed in", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../initiate/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/initiate", { provider: "github" }));

    expect(res.status).toBe(401);
  });

  it("returns 400 for a provider that is not allowlisted", async () => {
    signedIn();
    const { POST } = await import("../initiate/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/initiate", { provider: "facebook" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("github");
  });

  it("returns 400 rather than 500 for a malformed JSON body", async () => {
    signedIn();
    const { POST } = await import("../initiate/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/initiate", "{not json"));

    expect(res.status).toBe(400);
  });

  it("sets the state cookie at the shared path", async () => {
    signedIn();
    const { POST } = await import("../initiate/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/initiate", { provider: "github" }));

    expect(res.status).toBe(200);
    expect((await res.json()).url).toBe("https://auth.example.com/authorize?x=1");

    const [name, value, options] = cookieStore.set.mock.calls[0];
    expect(name).toBe(LINK_STATE_COOKIE);
    expect(options.path).toBe(LINK_STATE_COOKIE_PATH);
    expect(options.httpOnly).toBe(true);

    // state format: nonce:primaryUserId:provider
    const [nonce, primaryUserId, provider] = value.split(":");
    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
    expect(primaryUserId).toBe("auth0|primary");
    expect(provider).toBe("github");
  });

  it("generates a different nonce on every call", async () => {
    signedIn();
    const { POST } = await import("../initiate/route");
    await POST(post("http://localhost:3000/api/auth/link/initiate", { provider: "github" }));
    await POST(post("http://localhost:3000/api/auth/link/initiate", { provider: "github" }));

    const [first] = cookieStore.set.mock.calls[0].slice(1);
    const [second] = cookieStore.set.mock.calls[1].slice(1);
    expect(first).not.toBe(second);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// POST /api/auth/link/unlink
// ═══════════════════════════════════════════════════════════════════════

describe("POST /api/auth/link/unlink", () => {
  it("returns 401 when not signed in", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../unlink/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/unlink", { provider: "github", user_id: "42" }));

    expect(res.status).toBe(401);
  });

  it("refuses to unlink the primary sign-in identity", async () => {
    signedIn();
    db.maybeSingle.mockResolvedValue({ data: { linked_accounts: [] }, error: null });

    const { POST } = await import("../unlink/route");
    const res = await POST(
      post("http://localhost:3000/api/auth/link/unlink", { provider: "auth0", user_id: "primary" })
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/sign in with/);
    expect(unlinkIdentity).not.toHaveBeenCalled();
  });

  it("blocks unlinking when Auth0 reports only one identity left", async () => {
    signedIn();
    db.maybeSingle.mockResolvedValue({ data: { linked_accounts: [{ provider: "github", user_id: "42" }] }, error: null });
    (getUserIdentities as ReturnType<typeof vi.fn>).mockResolvedValue([
      { provider: "auth0", connection: "db", user_id: "primary", isSocial: false },
    ]);

    const { POST } = await import("../unlink/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/unlink", { provider: "github", user_id: "42" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/at least one sign-in method/);
    expect(unlinkIdentity).not.toHaveBeenCalled();
  });

  it("allows unlinking when the primary identity remains", async () => {
    signedIn();
    // Cache holds a single linked account, but Auth0 shows two identities
    // (primary + github). The old cache-only guard wrongly blocked this.
    db.maybeSingle.mockResolvedValue({ data: { linked_accounts: [{ provider: "github", user_id: "42" }] }, error: null });
    (getUserIdentities as ReturnType<typeof vi.fn>).mockResolvedValue([
      { provider: "auth0", connection: "db", user_id: "primary", isSocial: false },
      { provider: "github", connection: "github", user_id: "42", isSocial: true },
    ]);
    (unlinkIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { POST } = await import("../unlink/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/unlink", { provider: "github", user_id: "42" }));

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(unlinkIdentity).toHaveBeenCalledWith("auth0|primary", "github", "42");
  });

  it("falls back to the cache plus the primary when the Management API is down", async () => {
    signedIn();
    db.maybeSingle.mockResolvedValue({ data: { linked_accounts: [{ provider: "github", user_id: "42" }] }, error: null });
    (getUserIdentities as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("M2M not configured"));
    (unlinkIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { POST } = await import("../unlink/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/unlink", { provider: "github", user_id: "42" }));

    // cache(1) + primary(1) = 2, so unlinking is safe
    expect(res.status).toBe(200);
  });

  it("does not leak internal error text to the client", async () => {
    signedIn();
    db.maybeSingle.mockResolvedValue({ data: { linked_accounts: [{ provider: "github", user_id: "42" }] }, error: null });
    (getUserIdentities as ReturnType<typeof vi.fn>).mockResolvedValue([
      { provider: "auth0", connection: "db", user_id: "primary", isSocial: false },
      { provider: "github", connection: "github", user_id: "42", isSocial: true },
    ]);
    (unlinkIdentity as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Auth0 Management API not configured. Set AUTH0_M2M_CLIENT_SECRET")
    );

    const { POST } = await import("../unlink/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/unlink", { provider: "github", user_id: "42" }));

    const body = await res.json();
    expect(body.error).not.toContain("AUTH0_M2M_CLIENT_SECRET");
    expect(body.error).toMatch(/try again/i);
  });

  it("surfaces Auth0UserError messages verbatim", async () => {
    signedIn();
    db.maybeSingle.mockResolvedValue({ data: { linked_accounts: [{ provider: "github", user_id: "42" }, { provider: "linkedin", user_id: "7" }] }, error: null });
    (getUserIdentities as ReturnType<typeof vi.fn>).mockResolvedValue([
      { provider: "auth0", connection: "db", user_id: "primary", isSocial: false },
      { provider: "github", connection: "github", user_id: "42", isSocial: true },
    ]);

    const { Auth0UserError } = await import("@/lib/auth0-management");
    (unlinkIdentity as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Auth0UserError("That account is already connected to a different profile.")
    );

    const { POST } = await import("../unlink/route");
    const res = await POST(post("http://localhost:3000/api/auth/link/unlink", { provider: "github", user_id: "42" }));

    expect((await res.json()).error).toBe(
      "That account is already connected to a different profile."
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
// GET /api/auth/link/callback
// ═══════════════════════════════════════════════════════════════════════

/** Build an unsigned-but-well-formed JWT carrying the given claims. */
function fakeIdToken(claims: Record<string, unknown>): string {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${enc({ alg: "RS256" })}.${enc(claims)}.sig`;
}

function callbackUrl(state: string | null, extra = "code=abc") {
  const qs = new URLSearchParams(extra);
  if (state !== null) qs.set("state", state);
  return new Request(
    `http://localhost:3000/api/auth/link/callback?${qs.toString()}`
  ) as unknown as import("next/server").NextRequest;
}

const STATE = buildLinkState("noncenonce", "auth0|primary", "github");

describe("GET /api/auth/link/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db = buildDb();
    mockedCreateServiceClient.mockReturnValue(db);
    (linkIdentity as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (exchangeCodeForTokens as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "at",
      id_token: fakeIdToken({
        sub: "github|42",
        nickname: "octocat",
        email: "octo@example.com",
        name: "Octo Cat",
      }),
      token_type: "Bearer",
      expires_in: 86400,
    });
  });

  it("redirects with an error when the state cookie is missing", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const { GET } = await import("../callback/route");
    const res = await GET(callbackUrl(STATE));

    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(/expired/i);
    expect(exchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it("rejects a state that does not match the cookie (CSRF)", async () => {
    cookieStore.get.mockReturnValue({ value: buildLinkState("other", "auth0|primary", "github") });
    const { GET } = await import("../callback/route");
    const res = await GET(callbackUrl(STATE));

    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(/security check/i);
    expect(exchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it("deletes the state cookie at the same path it was set with", async () => {
    cookieStore.get.mockReturnValue({ value: STATE });
    db.single.mockResolvedValue({ data: { linked_accounts: [], socials: {} }, error: null });

    const { GET } = await import("../callback/route");
    await GET(callbackUrl(STATE));

    const [deleteArg] = cookieStore.delete.mock.calls[0];
    expect(deleteArg).toEqual({ name: LINK_STATE_COOKIE, path: LINK_STATE_COOKIE_PATH });
  });

  it("links the identity and syncs the profile cache", async () => {
    cookieStore.get.mockReturnValue({ value: STATE });
    db.single.mockResolvedValue({ data: { linked_accounts: [], socials: {} }, error: null });

    const { GET } = await import("../callback/route");
    const res = await GET(callbackUrl(STATE));

    expect(linkIdentity).toHaveBeenCalledWith("auth0|primary", expect.any(String));
    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toBe("success:GitHub");
  });

  it("treats an Auth0 auto-linked identity as success, not an error", async () => {
    // With tenant-level "link by email" on, Auth0 can return the primary
    // user's own token. POSTing that to /identities would fail with
    // "already linked" and the user would see an error for a working link.
    cookieStore.get.mockReturnValue({ value: STATE });
    (exchangeCodeForTokens as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "at",
      id_token: fakeIdToken({ sub: "auth0|primary" }),
      token_type: "Bearer",
      expires_in: 86400,
    });

    const { GET } = await import("../callback/route");
    const res = await GET(callbackUrl(STATE));

    expect(linkIdentity).not.toHaveBeenCalled();
    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toBe("success:GitHub");
  });

  it("reports a failed profile cache sync distinctly from a failed link", async () => {
    cookieStore.get.mockReturnValue({ value: STATE });
    db.single.mockResolvedValue({ data: { linked_accounts: [], socials: {} }, error: null });
    // The update chain is awaited on .eq(); its result is the chain object, so
    // the failure surfaces as db.error.
    db.error = { code: "42501", message: "RLS denied" };

    const { GET } = await import("../callback/route");
    const res = await GET(callbackUrl(STATE));

    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(
      /connected, but saving it to your profile failed/
    );
  });

  it("handles an Auth0 error redirect", async () => {
    const { GET } = await import("../callback/route");
    const res = await GET(
      callbackUrl(null, "error=access_denied&error_description=User+said+no")
    );

    const loc = new URL(res.headers.get("location")!);
    expect(decodeURIComponent(loc.searchParams.get("linked")!)).toMatch(/User said no/);
  });
});
