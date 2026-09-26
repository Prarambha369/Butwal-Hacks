import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/lib/auth0-management", () => ({
  sendVerificationEmail: vi.fn(),
}));

// The route calls withRateLimit at import time, so vi.clearAllMocks() would
// erase the record before any test runs. Record the tier in a hoisted array
// that mocking cannot reset.
const rateLimitTiers = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn((handler, tier: string) => {
    rateLimitTiers.push(tier);
    return handler;
  }),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { sendVerificationEmail } from "@/lib/auth0-management";
import { POST } from "@/app/api/auth/resend-verification/route";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedSend = sendVerificationEmail as ReturnType<typeof vi.fn>;

/**
 * This route triggers an outbound Auth0 email, so the two things that matter
 * are that it only ever mails the signed-in user, and that it stays quiet once
 * the address is already verified.
 */
describe("POST /api/auth/resend-verification", () => {
  const post = () => POST(new NextRequest("https://app.butwalhacks.com/api/auth/resend-verification"));

  beforeEach(() => {
    vi.clearAllMocks();
    mockedSend.mockResolvedValue(undefined);
  });

  it("is registered on the sensitive rate-limit tier", () => {
    // "sensitive" is what keeps the button from being used to spam inboxes.
    expect(rateLimitTiers).toContain("sensitive");
  });

  it("rejects an unauthenticated request with 401", async () => {
    mockedGetSession.mockResolvedValue(null);
    const res = await post();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("rejects a session with no subject", async () => {
    // A session can exist without a sub; mailing would then have no target.
    mockedGetSession.mockResolvedValue({ user: { email: "a@b.com" } });
    const res = await post();

    expect(res.status).toBe(401);
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("sends to the signed-in user", async () => {
    mockedGetSession.mockResolvedValue({
      user: { sub: "auth0|abc123", email_verified: false },
    });
    const res = await post();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sent: true });
    expect(mockedSend).toHaveBeenCalledWith("auth0|abc123");
  });

  it("does not send when the address is already verified", async () => {
    mockedGetSession.mockResolvedValue({
      user: { sub: "auth0|abc123", email_verified: true },
    });
    const res = await post();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ alreadyVerified: true });
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it("treats a missing email_verified claim as unverified", async () => {
    // Auth0 omits the claim for some providers; undefined must not be read as
    // verified, or those users could never get a link.
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|abc123" } });
    const res = await post();

    await expect(res.json()).resolves.toEqual({ sent: true });
    expect(mockedSend).toHaveBeenCalledWith("auth0|abc123");
  });

  it("returns a generic 500 and does not leak the upstream error", async () => {
    mockedGetSession.mockResolvedValue({
      user: { sub: "auth0|abc123", email_verified: false },
    });
    mockedSend.mockRejectedValue(new Error("MFA provider timeout at internal-host:8080"));

    const res = await post();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(
      "Could not resend the verification email. Please try again later."
    );
    expect(JSON.stringify(body)).not.toContain("internal-host");
  });
});
