import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));

vi.mock("@/lib/auth0-management", () => ({
  sendVerificationEmail: vi.fn(),
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
