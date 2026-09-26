import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const cookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

import {
  setOAuthState,
  consumeOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_PATH,
} from "@/lib/google-calendar/oauth-state";

const PROD_APP_BASE = "https://app.butwalhacks.com";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APP_BASE_URL", PROD_APP_BASE);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", PROD_APP_BASE);
  vi.stubEnv("AUTH0_BASE_URL", "");
  vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function storedCookie(value: string | undefined) {
  cookieStore.get.mockReturnValue(value === undefined ? undefined : { value });
}

function setOptions() {
  return cookieStore.set.mock.calls[0][2] as Record<string, unknown>;
}

describe("setOAuthState", () => {
  it("returns only the nonce, since that is all Google echoes back", async () => {
    const nonce = await setOAuthState("auth0|primary");

    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
    // The cookie carries the user binding; the nonce alone must not contain it.
    expect(nonce).not.toContain("auth0|primary");
  });

  it("binds the cookie to the user so a state cannot complete another link", async () => {
    const nonce = await setOAuthState("auth0|primary");

    expect(cookieStore.set.mock.calls[0][1]).toBe(`${nonce}:auth0|primary`);
  });

  it("scopes the cookie to the shared domain so it survives the host hop", async () => {
    // The connect button lives on app.* and Google returns to calendar.*.
    // A host-only cookie is never sent back across that hop.
    await setOAuthState("auth0|primary");

    expect(setOptions().domain).toBe("butwalhacks.com");
  });

  it("keeps the cookie host-only on localhost so local auth still works", async () => {
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    await setOAuthState("auth0|primary");

    expect(setOptions().domain).toBeUndefined();
  });
});

describe("consumeOAuthState", () => {
  it("accepts the bare nonce Google returns and yields the bound user", async () => {
    // Regression: the check used to compare Google's nonce against the whole
    // `nonce:userId` cookie value, so every connect failed with state_mismatch.
    storedCookie("nonce123:auth0|primary");

    const result = await consumeOAuthState("nonce123");

    expect(result).toEqual({ ok: true, auth0UserId: "auth0|primary" });
  });

  it("rejects a nonce that does not match the cookie", async () => {
    storedCookie("different:auth0|primary");

    expect(await consumeOAuthState("nonce123")).toEqual({
      ok: false,
      reason: "state_mismatch",
    });
  });

  it("rejects a prefix of the real nonce", async () => {
    // A length check must not pass a truncated nonce through.
    storedCookie("nonce1234:auth0|primary");

    expect(await consumeOAuthState("nonce123")).toEqual({
      ok: false,
      reason: "state_mismatch",
    });
  });

  it("rejects a missing state parameter", async () => {
    expect(await consumeOAuthState(null)).toEqual({
      ok: false,
      reason: "missing_state",
    });
  });

  it("rejects when the cookie is gone", async () => {
    storedCookie(undefined);

    expect(await consumeOAuthState("nonce123")).toEqual({
      ok: false,
      reason: "expired_state",
    });
  });

  it("rejects a cookie with no user suffix", async () => {
    storedCookie("nonce123:");

    expect(await consumeOAuthState("nonce123")).toEqual({
      ok: false,
      reason: "malformed_state",
    });
  });

  it("rejects a cookie with no separator", async () => {
    storedCookie("nonce123");

    expect(await consumeOAuthState("nonce123")).toEqual({
      ok: false,
      reason: "malformed_state",
    });
  });

  it("deletes the cookie at the path and domain it was set with", async () => {
    // A delete that omits either silently no-ops, leaving the state replayable.
    storedCookie("nonce123:auth0|primary");
    await consumeOAuthState("nonce123");

    const del = cookieStore.delete.mock.calls[0][0] as Record<string, unknown>;
    expect(del).toMatchObject({
      name: GOOGLE_OAUTH_STATE_COOKIE,
      path: GOOGLE_OAUTH_STATE_PATH,
      domain: "butwalhacks.com",
    });
  });

  it("cannot be replayed, because the cookie is consumed on first use", async () => {
    storedCookie("nonce123:auth0|primary");
    expect(await consumeOAuthState("nonce123")).toEqual({
      ok: true,
      auth0UserId: "auth0|primary",
    });

    // A second callback finds no cookie at all.
    storedCookie(undefined);
    expect(await consumeOAuthState("nonce123")).toEqual({
      ok: false,
      reason: "expired_state",
    });
  });
});
