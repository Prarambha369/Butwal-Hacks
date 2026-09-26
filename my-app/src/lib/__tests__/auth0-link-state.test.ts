import { describe, it, expect } from "vitest";
import {
  buildLinkState,
  parseLinkState,
  encodeLinkResult,
  linkStateCookieOptions,
  linkStateCookieDeleteOptions,
  LINK_STATE_COOKIE,
  LINK_STATE_COOKIE_PATH,
} from "@/lib/auth0-link-state";

describe("link state cookie", () => {
  it("sets and deletes at the same path", () => {
    // The original bug: the cookie was set at /api/auth/link but deleted with
    // no path, which targets "/" and silently fails to clear it.
    expect(linkStateCookieOptions().path).toBe(LINK_STATE_COOKIE_PATH);
    expect(linkStateCookieDeleteOptions().path).toBe(LINK_STATE_COOKIE_PATH);
  });

  it("deletes by name and path together, not as a two-argument call", () => {
    // cookies().delete() accepts either a key or a single options object.
    const del = linkStateCookieDeleteOptions();
    expect(del).toEqual({ name: LINK_STATE_COOKIE, path: LINK_STATE_COOKIE_PATH });
  });

  it("marks the cookie httpOnly so it is not readable from JS", () => {
    expect(linkStateCookieOptions().httpOnly).toBe(true);
    expect(linkStateCookieOptions().sameSite).toBe("lax");
  });

  it("expires after 10 minutes", () => {
    expect(linkStateCookieOptions().maxAge).toBe(600);
  });
});

describe("buildLinkState / parseLinkState", () => {
  it("round-trips a state", () => {
    const state = buildLinkState("abc123", "auth0|999", "github");
    expect(state).toBe("abc123:auth0|999:github");
    expect(parseLinkState(state)).toEqual({
      nonce: "abc123",
      primaryUserId: "auth0|999",
      provider: "github",
    });
  });

  it("preserves colons inside the provider", () => {
    const state = buildLinkState("n1", "auth0|1", "weird:provider");
    expect(parseLinkState(state)?.provider).toBe("weird:provider");
  });

  it("rejects malformed state", () => {
    expect(parseLinkState("onlyonepart")).toBeNull();
    expect(parseLinkState("n:uid")).toBeNull();
    expect(parseLinkState("::")).toBeNull();
    expect(parseLinkState("")).toBeNull();
  });

  it("rejects state with an empty nonce", () => {
    expect(parseLinkState(":auth0|1:github")).toBeNull();
  });
});

describe("encodeLinkResult", () => {
  it("percent-encodes spaces so the client can decode them", () => {
    // Previously some branches emitted "Link+request+expired" with a literal
    // plus, which decodeURIComponent leaves as a "+" rather than a space.
    const result = encodeLinkResult("error", "Link request expired. Please try again.");
    expect(result.startsWith("error:")).toBe(true);
    expect(result).not.toContain("+");
    expect(decodeURIComponent(result.slice("error:".length))).toBe(
      "Link request expired. Please try again."
    );
  });

  it("encodes reserved characters", () => {
    const result = encodeLinkResult("error", "a&b=c?d");
    expect(result).toContain("%26");
  });
});
