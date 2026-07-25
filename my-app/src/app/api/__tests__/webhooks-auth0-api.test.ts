import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}))

vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn((handler) => handler),
  checkRateLimit: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

vi.mock("@/lib/analytics/server", () => ({
  captureServerEvent: vi.fn(),
  identifyServerUser: vi.fn(),
}))

import { createServiceClient } from "@/utils/supabase"

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = [
    "from", "select", "eq", "in", "or",
    "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete",
    "rpc",
  ] as const
  for (const m of methods) {
    db[m] = vi.fn(() => db)
  }
  return db as unknown as Record<string, ReturnType<typeof vi.fn>>
}

function mockRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new Request("http://localhost:3000", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

const TEST_SECRET = "test-webhook-secret-123"

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/webhooks/auth0
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/webhooks/auth0", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AUTH0_WEBHOOK_SECRET = TEST_SECRET
  })

  it("returns 401 when webhook secret header is missing", async () => {
    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(mockRequest({ sub: "auth0|123", email: "test@test.com" }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("Invalid webhook secret")
  })

  it("returns 401 when webhook secret header is wrong", async () => {
    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(
      mockRequest({ sub: "auth0|123", email: "test@test.com" }, { "x-webhook-secret": "wrong-secret" }),
    )

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("Invalid webhook secret")
  })

  it("returns 400 when sub and email are missing", async () => {
    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(mockRequest({}, { "x-webhook-secret": TEST_SECRET }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("sub and email are required")
  })

  it("returns 400 when email is missing but sub is present", async () => {
    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(mockRequest({ sub: "auth0|123" }, { "x-webhook-secret": TEST_SECRET }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("sub and email are required")
  })

  it("returns 413 when content-length exceeds limit", async () => {
    const { POST } = await import("../webhooks/auth0/route")
    const largePayload = { sub: "auth0|123", email: "test@test.com", big: "x".repeat(2_000_000) }
    const res = await POST(
      mockRequest(largePayload, {
        "x-webhook-secret": TEST_SECRET,
        "content-length": "2000000",
      }),
    )

    expect(res.status).toBe(413)
  })

  it("updates existing profile when user already exists (same role — no upgrade)", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "hacker" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(
      mockRequest(
        { sub: "auth0|123", email: "test@test.com", name: "Test User", auth0_roles: ["Hacker"] },
        { "x-webhook-secret": TEST_SECRET },
      ),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    // Should update email and full_name but NOT role (same rank)
    const updateArg = db.update.mock.calls[0][0]
    expect(updateArg.email).toBe("test@test.com")
    expect(updateArg.full_name).toBe("Test User")
    expect(updateArg.role).toBeUndefined()
  })

  it("upgrades role when Auth0 assigns higher rank (hacker -> organizer)", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "hacker" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(
      mockRequest(
        { sub: "auth0|123", email: "test@test.com", auth0_roles: ["Organizer"] },
        { "x-webhook-secret": TEST_SECRET },
      ),
    )

    expect(res.status).toBe(200)
    const updateArg = db.update.mock.calls[0][0]
    expect(updateArg.role).toBe("organizer")
  })

  it("does not downgrade role when Auth0 assigns lower rank (organizer -> hacker)", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid", role: "organizer" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(
      mockRequest(
        { sub: "auth0|123", email: "test@test.com", auth0_roles: ["Hacker"] },
        { "x-webhook-secret": TEST_SECRET },
      ),
    )

    expect(res.status).toBe(200)
    const updateArg = db.update.mock.calls[0][0]
    expect(updateArg.role).toBeUndefined()
  })

  it("maps Auth0 role names to app role values", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValueOnce({ data: null, error: null }) // no existing profile
    db.rpc.mockResolvedValue({ data: { bh_id: "BH-25-001" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../webhooks/auth0/route")
    await POST(
      mockRequest(
        { sub: "auth0|456", email: "new@test.com", name: "Sponsor User", auth0_roles: ["Sponsors"] },
        { "x-webhook-secret": TEST_SECRET },
      ),
    )

    const rpcArg = db.rpc.mock.calls[0][1]
    expect(rpcArg.p_role).toBe("sponsor")
  })

  it("creates new profile via RPC when user does not exist", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: null, error: null })
    db.rpc.mockResolvedValue({ data: { bh_id: "BH-25-001" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(
      mockRequest(
        { sub: "auth0|456", email: "new@test.com", name: "New User", auth0_roles: ["Hacker"] },
        { "x-webhook-secret": TEST_SECRET },
      ),
    )

    expect(res.status).toBe(200)
    expect(db.rpc).toHaveBeenCalledWith("create_profile_with_bh_id", {
      p_auth0_user_id: "auth0|456",
      p_email: "new@test.com",
      p_full_name: "New User",
      p_role: "hacker",
    })
  })

  it("uses default name and role when minimal fields provided", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: null, error: null })
    db.rpc.mockResolvedValue({ data: { bh_id: "BH-25-002" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../webhooks/auth0/route")
    await POST(
      mockRequest(
        { sub: "auth0|789", email: "minimal@test.com" },
        { "x-webhook-secret": TEST_SECRET },
      ),
    )

    const rpcArg = db.rpc.mock.calls[0][1]
    expect(rpcArg.p_full_name).toBe("New Hacker") // default name
    expect(rpcArg.p_role).toBe("hacker") // default role
  })

  it("returns 500 when RPC fails", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: null, error: null })
    db.rpc.mockResolvedValue({ data: null, error: { message: "DB error" } })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../webhooks/auth0/route")
    const res = await POST(
      mockRequest({ sub: "auth0|456", email: "new@test.com" }, { "x-webhook-secret": TEST_SECRET }),
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("Failed to create profile")
  })

  it("trims full_name when provided with whitespace", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: null, error: null })
    db.rpc.mockResolvedValue({ data: { bh_id: "BH-25-003" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../webhooks/auth0/route")
    await POST(
      mockRequest(
        { sub: "auth0|101", email: "spacey@test.com", name: "  Spaced Out  " },
        { "x-webhook-secret": TEST_SECRET },
      ),
    )

    const rpcArg = db.rpc.mock.calls[0][1]
    expect(rpcArg.p_full_name).toBe("Spaced Out")
  })
})
