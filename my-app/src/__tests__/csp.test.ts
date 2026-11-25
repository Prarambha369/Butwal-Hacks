import { createHash } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(), middleware: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { auth0 } from "@/lib/auth0";
import {
  buildNonceCsp,
  buildStaticCsp,
  generateNonce,
  usesNonceCsp,
  REPORTING_ENDPOINTS,
} from "@/lib/csp";
import { THEME_INIT_SCRIPT, THEME_INIT_SCRIPT_SHA256 } from "@/lib/theme-script";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;

function directive(csp: string, name: string): string {
  return csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? "";
}

describe("CSP builders", () => {
  it("keeps 'unsafe-inline' out of the nonce policy's script-src", () => {
    const csp = buildNonceCsp("abc123");
    const scriptSrc = directive(csp, "script-src");
    expect(scriptSrc).toContain("'nonce-abc123'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("keeps every script host that is allowed today", () => {
    for (const csp of [buildNonceCsp("n"), buildStaticCsp(false)]) {
      const scriptSrc = directive(csp, "script-src");
      expect(scriptSrc).toContain("https://auth.butwalhacks.com");
      expect(scriptSrc).toContain("https://*.posthog.com");
      expect(scriptSrc).toContain("https://va.vercel-scripts.com");
    }
  });

  it("allowlists the theme script by its real hash", () => {
    const actual = createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64");
    expect(THEME_INIT_SCRIPT_SHA256).toBe(actual);
    expect(buildNonceCsp("n")).toContain(`'sha256-${actual}'`);
  });

  it("never puts a nonce or hash in the static policy", () => {
    // A nonce or hash makes browsers ignore 'unsafe-inline', which the
    // CDN-cached pages still need for Next's inline payload scripts.
    const csp = buildStaticCsp(false);
    expect(csp).not.toMatch(/'nonce-|'sha256-/);
    expect(directive(csp, "script-src")).toContain("'unsafe-inline'");
  });

  it("reports to /api/csp-violation by report-uri and report-to", () => {
    for (const csp of [buildNonceCsp("n"), buildStaticCsp(true)]) {
      expect(csp).toContain("report-uri /api/csp-violation");
      expect(csp).toContain("report-to csp-endpoint");
    }
    expect(REPORTING_ENDPOINTS).toBe('csp-endpoint="/api/csp-violation"');
  });

  it("sets frame-ancestors per policy", () => {
    expect(buildNonceCsp("n")).toContain("frame-ancestors 'none';");
    expect(buildStaticCsp(false)).toContain("frame-ancestors 'none';");
    expect(buildStaticCsp(true)).toContain("frame-ancestors *;");
  });

  it("generates distinct 128-bit nonces", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    expect(Buffer.from(a, "base64")).toHaveLength(16);
  });

  it.each([
    ["/dashboard", true],
    ["/dashboard/hacker", true],
    ["/portal/sponsors", true],
    ["/claim/tok", true],
    // Not a real route: renders the prerendered 404, which has no nonce.
    ["/claim", false],
    ["/claim/a/b", false],
    ["/", false],
    ["/events", false],
    ["/dashboards", false],
    ["/widget/verify", false],
  ])("usesNonceCsp(%s) is %s", (path, expected) => {
    expect(usesNonceCsp(path)).toBe(expected);
  });
});

describe("proxy CSP", () => {
  beforeEach(() => vi.clearAllMocks());

  async function runProxy(url: string) {
    const { default: proxy } = await import("@/proxy");
    return proxy(new NextRequest(url, { headers: { "user-agent": "vitest" } }));
  }

  it("forwards a nonce policy to the render on dynamic routes", async () => {
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|1" } });
    const response = await runProxy("https://app.butwalhacks.com/dashboard/hacker");

    expect(response.headers.get("x-middleware-next")).toBe("1");
    const csp = response.headers.get("content-security-policy") ?? "";
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    expect(directive(csp, "script-src")).not.toContain("'unsafe-inline'");

    // Same policy and nonce reach the render as request headers…
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
    expect(response.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    // …and the original request headers are preserved alongside them.
    const forwarded = (response.headers.get("x-middleware-override-headers") ?? "").split(",");
    expect(forwarded).toEqual(expect.arrayContaining(["user-agent", "x-nonce", "content-security-policy"]));
    expect(response.headers.get("x-middleware-request-user-agent")).toBe("vitest");
  });

  it("mints a fresh nonce per request", async () => {
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|1" } });
    const a = await runProxy("https://app.butwalhacks.com/dashboard/hacker");
    const b = await runProxy("https://app.butwalhacks.com/dashboard/hacker");
    expect(a.headers.get("x-middleware-request-x-nonce")).not.toBe(
      b.headers.get("x-middleware-request-x-nonce"),
    );
  });

  it("puts the nonce policy on redirects from gated routes too", async () => {
    mockedGetSession.mockResolvedValue(null);
    const response = await runProxy("https://app.butwalhacks.com/dashboard/hacker");
    expect(response.status).toBe(307);
    expect(response.headers.get("content-security-policy")).toContain("'nonce-");
    expect(response.headers.get("x-middleware-override-headers")).toBeNull();
  });

  it("leaves CDN-cached marketing pages on the static policy", async () => {
    const response = await runProxy("https://butwalhacks.com/events");
    expect(response.headers.get("content-security-policy")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-nonce")).toBeNull();
  });
});
