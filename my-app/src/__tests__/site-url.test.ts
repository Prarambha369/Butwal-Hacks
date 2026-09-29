import { describe, it, expect, vi, afterEach } from "vitest";
import { SITE_URL } from "../lib/constants";

/**
 * NEXT_PUBLIC_SITE_URL shipped to production as
 * `https://butwalhacks.com \n` — a trailing space plus newline. Every site
 * that interpolated it into a template literal emitted that whitespace
 * *inside* the URL: all 228 sitemap.xml entries, the robots.txt `Sitemap:`
 * line, the iCal feed, and the claim links in outbound email.
 *
 * `new URL()` strips the whitespace silently, so canonicals and the cookie
 * domain looked correct while the whole string-output SEO surface was
 * corrupt. That asymmetry is why this needs an explicit check.
 *
 * ponytail: the value assertions alone would pass in CI, where the env var
 * is clean. These re-import the module against a dirty value so the test
 * fails if the normalisation is ever removed.
 */
async function siteUrlFrom(raw: string): Promise<string> {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", raw);
  vi.resetModules();
  const mod = await import("../lib/constants");
  return mod.SITE_URL;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("SITE_URL normalisation", () => {
  it("trims a trailing space and newline, the exact production value", async () => {
    expect(await siteUrlFrom("https://butwalhacks.com \n")).toBe(
      "https://butwalhacks.com",
    );
  });

  it.each([
    ["trailing space", "https://butwalhacks.com "],
    ["trailing newline", "https://butwalhacks.com\n"],
    ["trailing CRLF", "https://butwalhacks.com\r\n"],
    ["leading whitespace", "  https://butwalhacks.com"],
    ["both ends", "\n  https://butwalhacks.com \t"],
  ])("trims %s", async (_label, raw) => {
    expect(await siteUrlFrom(raw)).toBe("https://butwalhacks.com");
  });

  it("falls back to the canonical host when unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
    const { SITE_URL: fallback } = await import("../lib/constants");
    expect(fallback).toBe("https://www.butwalhacks.com");
  });
});

describe("SITE_URL as consumed", () => {
  it("is the current build value, free of whitespace", () => {
    expect(SITE_URL).toBe(SITE_URL.trim());
    expect(SITE_URL).not.toMatch(/\s/);
  });

  it("is an absolute https URL on a known host", () => {
    const url = new URL(SITE_URL);
    expect(url.protocol).toBe("https:");
    expect(["butwalhacks.com", "www.butwalhacks.com"]).toContain(
      url.hostname,
    );
  });

  it("produces a clean URL when interpolated into a path", async () => {
    // The exact shape that broke: `${SITE_URL}/sitemap.xml`
    const site = await siteUrlFrom("https://butwalhacks.com \n");
    const built = `${site}/sitemap.xml`;
    expect(built).toBe("https://butwalhacks.com/sitemap.xml");
    expect(built).not.toMatch(/\s/);
  });
});
