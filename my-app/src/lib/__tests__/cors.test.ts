import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders, corsPreflight, withCors, withPublicCors } from "../cors";

const req = (origin?: string, method = "GET") =>
  new NextRequest("https://app.butwalhacks.com/api/search", {
    method,
    headers: origin ? { origin } : {},
  });

afterEach(() => vi.unstubAllEnvs());

describe("corsHeaders", () => {
  it("allows the marketing origins with credentials, echoing the exact origin", () => {
    for (const origin of ["https://butwalhacks.com", "https://www.butwalhacks.com"]) {
      const h = corsHeaders(origin);
      expect(h?.["Access-Control-Allow-Origin"]).toBe(origin);
      expect(h?.["Access-Control-Allow-Credentials"]).toBe("true");
    }
  });

  it("refuses other origins and missing origins", () => {
    expect(corsHeaders("https://evil.example")).toBeNull();
    expect(corsHeaders("https://butwalhacks.com.evil.example")).toBeNull();
    expect(corsHeaders("http://butwalhacks.com")).toBeNull();
    expect(corsHeaders(null)).toBeNull();
  });

  it("adds valid https origins from CORS_EXTRA_ORIGINS only", () => {
    vi.stubEnv("CORS_EXTRA_ORIGINS", "https://site-preview.example.workers.dev, javascript:alert(1), http://x.test");
    expect(corsHeaders("https://site-preview.example.workers.dev")).not.toBeNull();
    expect(corsHeaders("http://x.test")).toBeNull();
  });
});

describe("withCors / corsPreflight", () => {
  const handler = withCors(async (_request: Request) => NextResponse.json({ ok: true }));

  it("decorates responses for allowed origins and always varies on Origin", async () => {
    const allowed = await handler(req("https://butwalhacks.com"));
    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://butwalhacks.com");
    expect(allowed.headers.get("vary")).toContain("Origin");

    const other = await handler(req("https://evil.example"));
    expect(other.headers.get("access-control-allow-origin")).toBeNull();
    expect(other.headers.get("vary")).toContain("Origin");
  });

  it("answers preflight with 204 and the allowed methods", async () => {
    const res = await corsPreflight(req("https://www.butwalhacks.com", "OPTIONS"));
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });
});

describe("withPublicCors", () => {
  it("lets any origin read public data without credentials", async () => {
    const res = await withPublicCors(async () => NextResponse.json({ n: 1 }))();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();
  });
});
