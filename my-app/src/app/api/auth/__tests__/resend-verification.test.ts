import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/lib/auth0-management", () => ({
  sendVerificationEmail: vi.fn(),
}));

// The route calls withRateLimit at import time, so vi.clearAllMocks() would
// erase the record before any test runs. Record the tier in a hoisted array.
const rateLimitTiers = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn((handler, tier: string) => {
    rateLimitTiers.push(tier);
    return handler;
  }),
}));

import { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { sendVerificationEmail } from "@/lib/auth0-management";

const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>;
const mockedSendVerificationEmail =
  sendVerificationEmail as ReturnType<typeof vi.fn>;

function mockPost(): NextRequest {
  return new Request("http://localhost:3000/api/auth/resend-verification", {
    method: "POST",
  }) as unknown as NextRequest;
}

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  it("returns 401 when not signed in", async () => {
    mockedGetSession.mockResolvedValue(null);
    const { POST } = await import("../resend-verification/route");
    const res = await POST(mockPost());

    expect(res.status).toBe(401);
    expect(mockedSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("short-circuits when the email is already verified", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        sub: "auth0|abc123",
        email: "user@example.com",
        email_verified: true,
      },
    });
    const { POST } = await import("../resend-verification/route");
    const res = await POST(mockPost());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alreadyVerified).toBe(true);
    expect(mockedSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("resends the verification email for unverified users", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        sub: "auth0|abc123",
        email: "user@example.com",
        email_verified: false,
      },
    });
    mockedSendVerificationEmail.mockResolvedValue(undefined);
    const { POST } = await import("../resend-verification/route");
    const res = await POST(mockPost());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(true);
    expect(mockedSendVerificationEmail).toHaveBeenCalledWith("auth0|abc123");
  });

  it("is registered on the sensitive rate-limit tier", async () => {
    // "sensitive" is what keeps the button from being used to spam inboxes.
    await import("../resend-verification/route");
    expect(rateLimitTiers).toContain("sensitive");
  });

  it("returns 401 when the session carries no subject", async () => {
    // A session can exist without a sub, and then there is nobody to mail.
    mockedGetSession.mockResolvedValue({ user: { email: "user@example.com" } });
    const { POST } = await import("../resend-verification/route");
    const res = await POST(mockPost());

    expect(res.status).toBe(401);
    expect(mockedSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("treats a missing email_verified claim as unverified", async () => {
    // Auth0 omits the claim for some connections. Reading undefined as
    // verified would mean those users could never get a link.
    mockedGetSession.mockResolvedValue({
      user: { sub: "auth0|abc123", email: "user@example.com" },
    });
    mockedSendVerificationEmail.mockResolvedValue(undefined);
    const { POST } = await import("../resend-verification/route");
    const res = await POST(mockPost());
    const body = await res.json();

    expect(body.sent).toBe(true);
    expect(mockedSendVerificationEmail).toHaveBeenCalledWith("auth0|abc123");
  });

  it("does not leak the upstream error text in the 500 body", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        sub: "auth0|abc123",
        email: "user@example.com",
        email_verified: false,
      },
    });
    mockedSendVerificationEmail.mockRejectedValue(
      new Error("timeout calling mfa-provider at internal-host:8080")
    );
    const { POST } = await import("../resend-verification/route");
    const res = await POST(mockPost());

    expect(JSON.stringify(await res.json())).not.toContain("internal-host");
  });

  it("returns 500 when the Management API call fails", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        sub: "auth0|abc123",
        email: "user@example.com",
        email_verified: false,
      },
    });
    mockedSendVerificationEmail.mockRejectedValue(new Error("403"));
    const { POST } = await import("../resend-verification/route");
    const res = await POST(mockPost());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/try again later/);
  });
});
