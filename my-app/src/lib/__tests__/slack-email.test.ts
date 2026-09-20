import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { sendSlackEmail } from "@/lib/slack-email";

describe("sendSlackEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("skips quietly when unconfigured", async () => {
    vi.stubEnv("SLACK_EMAIL_CHANNEL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const sent = await sendSlackEmail({ from: "a@b.c", subject: "s", text: "t" });

    expect(sent).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to Resend when configured", async () => {
    vi.stubEnv("SLACK_EMAIL_CHANNEL", "feedback-xyz@butwalhacks.slack.com");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

    const sent = await sendSlackEmail({ from: "a@b.c", subject: "s", text: "t" });

    expect(sent).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns false when Resend rejects", async () => {
    vi.stubEnv("SLACK_EMAIL_CHANNEL", "feedback-xyz@butwalhacks.slack.com");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 403 }));

    const sent = await sendSlackEmail({ from: "a@b.c", subject: "s", text: "t" });

    expect(sent).toBe(false);
  });
});
