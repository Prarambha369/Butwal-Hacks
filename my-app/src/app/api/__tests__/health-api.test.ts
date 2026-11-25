import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/health-checks", () => ({
  runAllChecks: vi.fn(),
}));

import { runAllChecks } from "@/lib/health-checks";
import { GET } from "@/app/api/health/route";

const mockedChecks = runAllChecks as ReturnType<typeof vi.fn>;
const TOKEN = "t".repeat(64);

function get(headers: Record<string, string> = {}) {
  return GET(new NextRequest("https://app.butwalhacks.com/api/health", { headers }));
}

const healthy = [
  { name: "Supabase Database", status: "healthy", latency_ms: 10 },
  { name: "Upstash Redis", status: "healthy", latency_ms: 5 },
  { name: "Auth0", status: "healthy", latency_ms: 20 },
];

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedChecks.mockResolvedValue(healthy);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("answers the public with a static ok and runs no dependency check", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", TOKEN);
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(mockedChecks).not.toHaveBeenCalled();
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("ignores a wrong token", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", TOKEN);
    const res = await get({ "x-health-token": "wrong" });
    expect(await res.json()).toEqual({ status: "ok" });
    expect(mockedChecks).not.toHaveBeenCalled();
  });

  it("fails closed when HEALTH_CHECK_TOKEN is unset", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", "");
    const res = await get({ "x-health-token": "", authorization: "Bearer " });
    expect(await res.json()).toEqual({ status: "ok" });
    expect(mockedChecks).not.toHaveBeenCalled();
  });

  it("returns the detailed report for the right token", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", TOKEN);
    const res = await get({ "x-health-token": TOKEN });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.checks).toHaveLength(3);
    expect(body).toHaveProperty("version");
  });

  it("accepts the token as a bearer credential", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", TOKEN);
    const res = await get({ authorization: `Bearer ${TOKEN}` });
    expect((await res.json()).checks).toHaveLength(3);
  });

  it("keeps 503 for a degraded detailed report", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", TOKEN);
    mockedChecks.mockResolvedValue([
      ...healthy.slice(1),
      { name: "Supabase Database", status: "down", latency_ms: 0 },
    ]);
    const res = await get({ "x-health-token": TOKEN });
    expect(res.status).toBe(503);
    expect((await res.json()).status).toBe("down");
  });
});
