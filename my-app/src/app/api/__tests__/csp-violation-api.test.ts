import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Must never be reached: the route spends no Redis command per report.
vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn(() => {
    throw new Error("csp-violation must not use the Upstash rate limiter");
  }),
}));

import { logger } from "@/lib/logger";
import { POST } from "@/app/api/csp-violation/route";
import { DEDUPE_MAX_KEYS, cspDedupeSize, resetCspDedupe, shouldLogCspReport } from "@/lib/csp-report-dedupe";

const warn = logger.warn as ReturnType<typeof vi.fn>;

function post(body: string, contentType: string) {
  return POST(
    new NextRequest("https://www.butwalhacks.com/api/csp-violation", {
      method: "POST",
      headers: { "content-type": contentType },
      body,
    }),
  );
}

const legacy = (blocked = "inline") =>
  JSON.stringify({
    "csp-report": {
      "document-uri": "https://www.butwalhacks.com/claim/secret-token?x=1#frag",
      "violated-directive": "script-src-elem",
      "effective-directive": "script-src-elem",
      "blocked-uri": blocked,
      disposition: "enforce",
      "line-number": 3,
    },
  });

describe("POST /api/csp-violation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCspDedupe();
  });

  it("accepts a legacy application/csp-report and answers 204 with no body", async () => {
    const res = await post(legacy(), "application/csp-report");
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("strips query strings and fragments from logged URLs", async () => {
    await post(legacy("https://evil.example/x.js?token=abc"), "application/csp-report");
    const entry = warn.mock.calls[0][1] as Record<string, unknown>;
    expect(entry.document).toBe("https://www.butwalhacks.com/claim/secret-token");
    expect(entry.blocked).toBe("https://evil.example/x.js");
  });

  it("accepts Reporting API batches (application/reports+json)", async () => {
    const body = JSON.stringify([
      {
        type: "csp-violation",
        url: "https://www.butwalhacks.com/",
        body: {
          documentURL: "https://www.butwalhacks.com/",
          blockedURL: "https://a.example/a.js",
          effectiveDirective: "script-src-elem",
          disposition: "enforce",
        },
      },
      { type: "deprecation", body: {} },
    ]);
    const res = await post(body, "application/reports+json; charset=utf-8");
    expect(res.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("logs a repeated violation once, then drops duplicates", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await post(legacy(), "application/csp-report")).status).toBe(204);
    }
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("rejects other content types with 415", async () => {
    const res = await post("hello", "text/plain");
    expect(res.status).toBe(415);
  });

  it("rejects bodies over 10 KB with 413, even without Content-Length", async () => {
    const huge = JSON.stringify({ "csp-report": { "blocked-uri": "x".repeat(11 * 1024) } });
    const res = await post(huge, "application/csp-report");
    expect(res.status).toBe(413);
    expect(warn).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and wrong shapes with 400", async () => {
    expect((await post("{not json", "application/csp-report")).status).toBe(400);
    expect((await post(JSON.stringify({ nope: 1 }), "application/csp-report")).status).toBe(400);
    expect((await post(JSON.stringify({ a: 1 }), "application/reports+json")).status).toBe(400);
  });

  it("caps Reporting API batches", async () => {
    const batch = Array.from({ length: 21 }, () => ({ type: "csp-violation", body: {} }));
    expect((await post(JSON.stringify(batch), "application/reports+json")).status).toBe(400);
  });
});

describe("CSP report dedupe", () => {
  beforeEach(() => resetCspDedupe());

  it("logs a key again once the window has passed", () => {
    expect(shouldLogCspReport("k", 0)).toBe(true);
    expect(shouldLogCspReport("k", 1000)).toBe(false);
    expect(shouldLogCspReport("k", 11 * 60 * 1000)).toBe(true);
  });

  it("stays bounded", () => {
    for (let i = 0; i < DEDUPE_MAX_KEYS + 50; i += 1) shouldLogCspReport(`k${i}`, 0);
    expect(cspDedupeSize()).toBeLessThanOrEqual(DEDUPE_MAX_KEYS);
  });
});
