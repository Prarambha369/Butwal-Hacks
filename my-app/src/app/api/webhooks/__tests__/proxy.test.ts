import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn((handler) => handler),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { createServiceClient } from "@/utils/supabase/service";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";

const mockedCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;
const mockedGetSession = auth0.getSession as unknown as ReturnType<typeof vi.fn>;

// ─── Mock Database Builder ───────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "from", "select", "eq", "single",
  ] as const;

  for (const m of methods) {
    db[m] = vi.fn(() => db);
  }

  return db as unknown as ReturnType<typeof createServiceClient> & {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };
}

function mockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/webhooks/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/webhooks/proxy
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/webhooks/proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

    // Set webhook URLs before first module import so module-level consts
    // (SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL) get the right values.
    // NOTE: These are module-level consts evaluated at import time, so
    // changing process.env after the first import() has no effect.
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
    process.env.DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/test";

    // Default: authenticated as maintainer
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { role: "maintainer" }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } });

    // Default: fetch returns 200
    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up env vars that beforeEach sets
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  // ── Auth ──────────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({ event: "test", title: "Test" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  // ── Role ──────────────────────────────────────────────────────────

  it("returns 403 for hacker role", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { role: "hacker" }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({ event: "test", title: "Test" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("allows organizer role (200)", async () => {
    const db = buildMockDb();
    db.single.mockResolvedValue({ data: { role: "organizer" }, error: null });
    mockedCreateServiceClient.mockReturnValue(db);

    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({ event: "test", title: "Test" }));

    expect(res.status).toBe(200);
  });

  // ── Validation ─────────────────────────────────────────────────────

  it("returns 400 when event is missing", async () => {
    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({ title: "Test" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("event");
  });

  it("returns 400 when title is missing", async () => {
    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({ event: "test" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("title");
  });

  // ── Forwarding ─────────────────────────────────────────────────────

  it("forwards to Slack when channel is 'slack'", async () => {
    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({
      event: "new_registration",
      title: "New Registration",
      description: "A new user registered",
      channel: "slack",
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.results.slack).toBe("sent");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe("https://hooks.slack.com/test");
    expect(fetchCall[1].method).toBe("POST");
    expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
  });

  it("forwards to Discord when channel is 'discord'", async () => {
    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({
      event: "event_announcement",
      title: "New Event",
      channel: "discord",
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.results.discord).toBe("sent");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe("https://discord.com/api/webhooks/test");
    expect(fetchCall[1].signal).toBeDefined();
  });

  it("forwards to both Slack and Discord when channel is 'all'", async () => {
    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({
      event: "new_member",
      title: "New Member",
      channel: "all",
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("forwards to both when channel is not specified (default)", async () => {
    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({
      event: "test",
      title: "Test",
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ── Slack failure handling ────────────────────────────────────────

  it("reports slack: failed when Slack returns non-ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("Internal error") });

    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({
      event: "test",
      title: "Test",
      channel: "slack",
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.slack).toBe("failed");
    expect(logger.error).toHaveBeenCalledWith(
      "[webhook-proxy] Slack error:",
      500,
      "Internal error",
    );
  });

  // ── Timeout / fetch rejection behavior ─────────────────────────────

  it("passes AbortSignal.signal to the Slack fetch call", async () => {
    const { POST } = await import("../proxy/route");
    await POST(mockRequest({ event: "test", title: "Test", channel: "slack" }));

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
  });

  it("passes AbortSignal.signal to the Discord fetch call", async () => {
    const { POST } = await import("../proxy/route");
    await POST(mockRequest({ event: "test", title: "Test", channel: "discord" }));

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
  });

  it("returns 500 when Slack fetch rejects (simulating network or timeout error)", async () => {
    // Simulate what AbortSignal.timeout would cause: a DOMException rejection
    mockFetch.mockRejectedValue(new DOMException("The operation was aborted", "TimeoutError"));

    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({
      event: "test",
      title: "Test",
      channel: "slack",
    }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal error");
  });

  it("returns 500 when Discord fetch rejects (simulating network or timeout error)", async () => {
    mockFetch.mockRejectedValue(new Error("fetch failed"));

    const { POST } = await import("../proxy/route");
    const res = await POST(mockRequest({
      event: "test",
      title: "Test",
      channel: "discord",
    }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal error");
  });
});
