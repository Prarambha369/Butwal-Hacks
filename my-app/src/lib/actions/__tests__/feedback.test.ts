import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/slack-email", () => ({
  sendSlackEmail: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createServiceClient } from "@/utils/supabase";
import { sendSlackEmail } from "@/lib/slack-email";
import { __clearRateLimitMap } from "../feedback";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedSendSlackEmail = sendSlackEmail as ReturnType<typeof vi.fn>;

function mockDb(insertResult: { error: unknown }) {
  const insert = vi.fn(async () => insertResult);
  const db = { from: vi.fn(() => ({ insert })) };
  mockedCreateServiceClient.mockReturnValue(db);
  return { db, insert };
}

describe("submitFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearRateLimitMap();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("stores feedback but does not mirror to Slack in non-production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "preview");
    mockDb({ error: null });
    mockedSendSlackEmail.mockResolvedValue(true);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "hello team" });

    expect(result).toEqual({ success: true });
    expect(mockedSendSlackEmail).not.toHaveBeenCalled();
  });

  it("stores feedback and mirrors it to Slack in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mockDb({ error: null });
    mockedSendSlackEmail.mockResolvedValue(true);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "hello team" });

    expect(result).toEqual({ success: true });
    expect(mockedSendSlackEmail).toHaveBeenCalledOnce();
    const payload = mockedSendSlackEmail.mock.calls[0][0];
    expect(payload.subject).toContain("[other]");
    expect(payload.text).toContain("hello team");
  });

  it("still succeeds when Slack mirroring fails in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mockDb({ error: null });
    mockedSendSlackEmail.mockResolvedValue(false);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "bug", message: "broken thing" });

    expect(result).toEqual({ success: true });
  });

  it("succeeds via Slack mirror when the DB is unreachable in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mockDb({ error: { message: "Supabase not configured", code: "SUPABASE_NOT_CONFIGURED" } });
    mockedSendSlackEmail.mockResolvedValue(true);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "hello team" });

    expect(result).toEqual({ success: true });
    expect(mockedSendSlackEmail).toHaveBeenCalledOnce();
  });

  it("fails when DB is unreachable in non-production (no Slack fallback)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "preview");
    mockDb({ error: { message: "Supabase not configured", code: "SUPABASE_NOT_CONFIGURED" } });
    mockedSendSlackEmail.mockResolvedValue(true);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "hello team" });

    expect(result.success).toBe(false);
    expect(mockedSendSlackEmail).not.toHaveBeenCalled();
  });

  it("fails only when both DB and Slack fail in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mockDb({ error: { message: "db down" } });
    mockedSendSlackEmail.mockResolvedValue(false);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "hello team" });

    expect(result.success).toBe(false);
  });

  it("rejects short messages without touching Slack", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    mockDb({ error: null });

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "x" });

    expect(result.success).toBe(false);
    expect(mockedSendSlackEmail).not.toHaveBeenCalled();
  });
});
