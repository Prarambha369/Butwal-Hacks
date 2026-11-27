import { describe, it, expect, vi } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn(), middleware: vi.fn() } }));
vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { config } from "@/proxy";

/**
 * The matcher decides which requests pay for a proxy invocation. On the
 * marketing host only the paths route() acts on may match; every other host
 * keeps the full matcher.
 */
function matches(host: string, path: string): boolean {
  return unstable_doesMiddlewareMatch({
    config,
    url: `https://${host}${path}`,
    headers: { host },
  });
}

describe("proxy matcher", () => {
  describe.each(["butwalhacks.com", "www.butwalhacks.com"])("marketing host %s", (host) => {
    it.each(["/", "/events", "/events/hackday-butwal", "/gallery", "/gallery/abc", "/blog", "/p/BH-24-001", "/widget/BH-24-001", "/verify/m1"])(
      "skips the proxy for %s",
      (path) => {
        expect(matches(host, path)).toBe(false);
      },
    );

    it.each(["/sign-in", "/auth/login", "/auth/profile", "/dashboard", "/dashboard/hacker", "/portal", "/portal/sponsors", "/teams/t1", "/orgs/pokhara", "/claim/tok"])(
      "runs the proxy for %s",
      (path) => {
        expect(matches(host, path)).toBe(true);
      },
    );
  });

  describe.each(["app.butwalhacks.com", "calendar.butwalhacks.com", "pokhara.butwalhacks.com", "localhost"])(
    "other host %s",
    (host) => {
      it.each(["/", "/events", "/dashboard", "/auth/login", "/orgs/pokhara"])("runs the proxy for %s", (path) => {
        expect(matches(host, path)).toBe(true);
      });
    },
  );

  it("never runs for static assets or API routes", () => {
    for (const host of ["www.butwalhacks.com", "app.butwalhacks.com"]) {
      expect(matches(host, "/_next/static/chunk.js")).toBe(false);
      expect(matches(host, "/api/health")).toBe(false);
      expect(matches(host, "/logo.png")).toBe(false);
    }
  });

  it("does not treat look-alike hosts as the marketing host", () => {
    expect(matches("evilbutwalhacks.com", "/events")).toBe(true);
    expect(matches("www.butwalhacks.com.evil.test", "/events")).toBe(true);
  });
});
