import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}))

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
}))

vi.mock("@/lib/crypto/sign", () => ({
  signTrustMarker: vi.fn(),
}))

vi.mock("@/lib/cache", () => ({
  bustCache: vi.fn(),
}))

vi.mock("@/lib/emails/ghost-marker-notification", () => ({
  ghostMarkerNotificationHtml: vi.fn(),
}))

import { NextRequest } from "next/server"
import { createServiceClient } from "@/utils/supabase"
import { auth0 } from "@/lib/auth0"

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>
const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMockDb() {
  const db: Record<string, ReturnType<typeof vi.fn>> = {}
  const methods = [
    "from", "select", "eq", "in", "or",
    "order", "limit", "single", "maybeSingle",
    "insert", "update", "delete",
  ] as const
  for (const m of methods) {
    db[m] = vi.fn(() => db)
  }
  return db as unknown as Record<string, ReturnType<typeof vi.fn>>
}

function mockRequest(body: unknown): NextRequest {
  return new Request("http://localhost:3000", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}


// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/issue-marker
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/v1/issue-marker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|issuer-123" } })
    // Suppress external email by default
    process.env.RESEND_API_KEY = ""
  })

  // ── Auth guards ───────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ email: "user@test.com", title: "Test Badge" }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("Unauthorized")
  })

  // ── RBAC ──────────────────────────────────────────────────────────────

  it("returns 403 when user is not organizer or maintainer", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { role: "hacker" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ email: "user@test.com", title: "Test Badge" }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("organizer or maintainer")
  })

  it("allows organizer role to issue markers", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValueOnce({ data: { role: "organizer" }, error: null }) // role check
    db.single.mockResolvedValueOnce({ data: { id: "issuer-uuid" }, error: null }) // issuer ID
    // Unknown user — ghost flow: two profile queries, marker insert with claim_token
    db.maybeSingle.mockResolvedValue({ data: null, error: null }) // no target profile
    db.single.mockResolvedValueOnce({ data: { id: "marker-id", created_at: new Date().toISOString() }, error: null }) // marker insert
    // claim_tokens insert, then email fetch, then sign update
    db.from.mockReturnValue(db)
    // Need to handle the third single() for issuer name in email path
    // RESEND_API_KEY is empty so email is skipped
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ email: "ghost@test.com", title: "Ghost Badge" }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.ghost).toBe(true)
  })

  it("allows maintainer role to issue markers", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValueOnce({ data: { role: "maintainer" }, error: null })
    db.single.mockResolvedValueOnce({ data: { id: "issuer-uuid" }, error: null })
    db.maybeSingle.mockResolvedValue({ data: null, error: null })
    db.single.mockResolvedValueOnce({ data: { id: "marker-id", created_at: new Date().toISOString() }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ email: "ghost@test.com", title: "Maintainer Badge" }))

    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  // ── Input validation ─────────────────────────────────────────────────

  it("returns 400 when email is missing", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { role: "organizer" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ title: "Test Badge" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Invalid request: email and title are required")
  })

  it("returns 400 when title is missing", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { role: "organizer" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ email: "user@test.com" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Invalid request: email and title are required")
  })

  // ── Known user flow ─────────────────────────────────────────────────

  it("issues marker to known user and signs it", async () => {
    const { signTrustMarker } = await import("@/lib/crypto/sign")
    const { bustCache } = await import("@/lib/cache")
    vi.mocked(signTrustMarker).mockReturnValue("ed25519-sig-base64")

    const db = buildMockDb()
    db.single
      .mockResolvedValueOnce({ data: { role: "organizer" }, error: null }) // role check
      .mockResolvedValueOnce({ data: { id: "issuer-uuid" }, error: null }) // issuer ID
    db.maybeSingle.mockResolvedValue({
      data: { id: "target-uuid", bh_id: "BH-24-001", full_name: "Target User", auth0_user_id: "auth0|target" },
      error: null,
    })
    db.single.mockResolvedValueOnce({
      data: { id: "marker-uuid", created_at: "2025-01-01T00:00:00Z" },
      error: null,
    })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({
      email: "known@test.com",
      title: "Hackathon Winner",
      description: "Won the 2025 Hackathon",
      type: "achievement",
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.ghost).toBe(false)
    expect(body.signed).toBe(true)
    expect(body.profile).toBe("auth0|target")

    // Verify marker was inserted with recipient's profile_id
    const insertCall = db.insert.mock.calls.find(c => c[0]?.profile_id === "target-uuid")
    expect(insertCall).toBeDefined()
    expect(insertCall![0].title).toBe("Hackathon Winner")
    expect(insertCall![0].type).toBe("achievement")
    expect(insertCall![0].is_claimed).toBe(true)

    // Verify crypto signature was applied
    expect(signTrustMarker).toHaveBeenCalled()

    // Verify profile cache was busted
    expect(bustCache).toHaveBeenCalledWith("profile:bh_id:BH-24-001")
  })

  it("handles marker insert failure for known user", async () => {
    const db = buildMockDb()
    db.single
      .mockResolvedValueOnce({ data: { role: "organizer" }, error: null })
      .mockResolvedValueOnce({ data: { id: "issuer-uuid" }, error: null })
    db.maybeSingle.mockResolvedValue({
      data: { id: "target-uuid", full_name: "Target", auth0_user_id: "auth0|target" },
      error: null,
    })
    db.single.mockResolvedValueOnce({ data: null, error: { message: "Insert failed" } })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ email: "known@test.com", title: "Badge" }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("Failed to issue marker")
  })

  // ── Ghost profile flow ───────────────────────────────────────────────

  it("creates ghost marker for unknown email with claim token", async () => {
    const db = buildMockDb()
    db.single
      .mockResolvedValueOnce({ data: { role: "organizer" }, error: null }) // role
      .mockResolvedValueOnce({ data: { id: "issuer-uuid" }, error: null }) // issuer ID
    db.maybeSingle.mockResolvedValue({ data: null, error: null }) // no target profile
    db.single.mockResolvedValueOnce({
      data: { id: "ghost-marker-id", created_at: "2025-01-01T00:00:00Z" },
      error: null,
    }) // marker insert
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({
      email: "ghost@unknown.com",
      title: "Ghost Badge",
      description: "A secret badge",
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.ghost).toBe(true)
    expect(body.marker_id).toBe("ghost-marker-id")
    expect(body.expires_at).toBeDefined()

    // Verify marker insert used correct fields
    const ghostInsert = db.insert.mock.calls.find(c => c[0]?.claimant_email === "ghost@unknown.com")
    expect(ghostInsert).toBeDefined()
    expect(ghostInsert![0].is_claimed).toBe(false)
    expect(ghostInsert![0].claim_token).toBeDefined()
    expect(ghostInsert![0].claim_expires_at).toBeDefined()
    expect(ghostInsert![0].type).toBe("achievement")

    // Verify claim_tokens table insert
    const tokenInsert = db.insert.mock.calls.find(c => c[0]?.email === "ghost@unknown.com")
    expect(tokenInsert).toBeDefined()
    expect(tokenInsert![0].token).toBeDefined()
    expect(tokenInsert![0].trust_marker_id).toBe("ghost-marker-id")
  })

  it("handles ghost marker insert failure", async () => {
    const db = buildMockDb()
    db.single
      .mockResolvedValueOnce({ data: { role: "organizer" }, error: null })
      .mockResolvedValueOnce({ data: { id: "issuer-uuid" }, error: null })
    db.maybeSingle.mockResolvedValue({ data: null, error: null })
    db.single.mockResolvedValueOnce({ data: null, error: { message: "DB error" } })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ email: "ghost@test.com", title: "Badge" }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("Failed to create ghost marker")
  })

  it("uses default type when type field is omitted", async () => {
    const db = buildMockDb()
    db.single
      .mockResolvedValueOnce({ data: { role: "organizer" }, error: null })
      .mockResolvedValueOnce({ data: { id: "issuer-uuid" }, error: null })
    db.maybeSingle.mockResolvedValue({ data: null, error: null })
    db.single.mockResolvedValueOnce({
      data: { id: "m-id", created_at: "2025-01-01T00:00:00Z" },
      error: null,
    })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    await POST(mockRequest({ email: "ghost@test.com", title: "Default Type Badge" }))

    const ghostInsert = db.insert.mock.calls.find(c => c[0]?.claimant_email === "ghost@test.com")
    expect(ghostInsert![0].type).toBe("achievement")
  })

  it("trims whitespace from title", async () => {
    // Title must pass Zod max(200) — use exactly 200 chars that trim to 196
    const titleWithSpaces = "  " + "A".repeat(196) + "  "
    const db = buildMockDb()
    db.single
      .mockResolvedValueOnce({ data: { role: "organizer" }, error: null })
      .mockResolvedValueOnce({ data: { id: "issuer-uuid" }, error: null })
    db.maybeSingle.mockResolvedValue({ data: null, error: null })
    db.single.mockResolvedValueOnce({
      data: { id: "m-id", created_at: "2025-01-01T00:00:00Z" },
      error: null,
    })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    await POST(mockRequest({ email: "ghost@test.com", title: titleWithSpaces }))

    const ghostInsert = db.insert.mock.calls.find(c => c[0]?.claimant_email === "ghost@test.com")
    expect(ghostInsert![0].title.length).toBe(196) // trimmed from 200 to 196
    expect(ghostInsert![0].title).not.toContain("  ") // no leading/trailing spaces
  })

  it("returns 400 for title over 200 chars", async () => {
    const longTitle = "A".repeat(201)
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { role: "organizer" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../v1/issue-marker/route")
    const res = await POST(mockRequest({ email: "ghost@test.com", title: longTitle }))

    expect(res.status).toBe(400)
  })
})
