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

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;
const mockedSendSlackEmail = sendSlackEmail as ReturnType<typeof vi.fn>;

function mockDb(insertResult: { error: unknown }) {
  const insert = vi.fn(async () => insertResult);
  const db = { from: vi.fn(() => ({ insert })) };
  mockedCreateServiceClient.mockReturnValue(db);
  return { db, insert };
}

describe("submitFeedback", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("stores feedback and mirrors it to Slack", async () => {
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

  it("still succeeds when Slack mirroring fails", async () => {
    mockDb({ error: null });
    mockedSendSlackEmail.mockResolvedValue(false);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "bug", message: "broken thing" });

    expect(result).toEqual({ success: true });
  });

  it("succeeds via Slack mirror when the DB is unreachable", async () => {
    mockDb({ error: { message: "Supabase not configured", code: "SUPABASE_NOT_CONFIGURED" } });
    mockedSendSlackEmail.mockResolvedValue(true);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "hello team" });

    expect(result).toEqual({ success: true });
    expect(mockedSendSlackEmail).toHaveBeenCalledOnce();
  });

  it("fails only when both DB and Slack fail", async () => {
    mockDb({ error: { message: "db down" } });
    mockedSendSlackEmail.mockResolvedValue(false);

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "hello team" });

    expect(result.success).toBe(false);
  });

  it("rejects short messages without touching Slack", async () => {
    mockDb({ error: null });

    const { submitFeedback } = await import("../feedback");
    const result = await submitFeedback({ category: "other", message: "x" });

    expect(result.success).toBe(false);
    expect(mockedSendSlackEmail).not.toHaveBeenCalled();
  });
});
