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

vi.mock("@/lib/validation", () => ({
  sanitizeUuid: vi.fn((v: string) => v),
  sanitizeString: vi.fn((v: string, max: number) => v?.slice(0, max)),
  sanitizeUrl: vi.fn((v: string) => v),
}))

vi.mock("@/lib/sentry-span", () => ({
  withSentrySpan: vi.fn((_name: string, handler: () => unknown) => handler),
}))

import { createServiceClient } from "@/utils/supabase"
import { auth0 } from "@/lib/auth0"
const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>
const mockedGetSession = auth0.getSession as ReturnType<typeof vi.fn>
// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_ID = "550e8400-e29b-41d4-a716-446655440000"

/** The three required acceptances. */
const CONSENT = { code_of_conduct: true, rules: true, privacy: true }

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

function mockRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/events/register
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/events/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetSession.mockResolvedValue({ user: { sub: "auth0|12345" } })
  })

  // ── Auth guards ───────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("Unauthorized")
  })

  // ── Profile resolution ───────────────────────────────────────────────

  it("returns 400 when profile not found", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: null, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Profile not found")
  })

  it("looks up profile by auth0_user_id before registering", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    db.insert.mockResolvedValue({ error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    const eqCalls = db.eq.mock.calls
    const auth0Query = eqCalls.find(c => c[0] === "auth0_user_id")
    expect(auth0Query).toBeDefined()
    expect(auth0Query![1]).toBe("auth0|12345")
  })

  // ── Input validation ─────────────────────────────────────────────────

  it("returns 400 when event_id is missing", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({}))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Invalid request")
  })

  it("returns 400 when event_id is empty string", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({ event_id: "", consent: CONSENT }))

    expect(res.status).toBe(400)
  })

  // ── Consent ──────────────────────────────────────────────────────────

  it("returns 400 when the Code of Conduct is not accepted", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(
      mockRequest({
        event_id: EVENT_ID,
        consent: { ...CONSENT, code_of_conduct: false },
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Code of Conduct")
    // No registration row is written when consent is missing.
    expect(db.insert).not.toHaveBeenCalled()
  })

  it("returns 400 when the Hackathon Rules are not accepted", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(
      mockRequest({ event_id: EVENT_ID, consent: { ...CONSENT, rules: false } }),
    )

    expect(res.status).toBe(400)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it("returns 400 when the Privacy Policy is not accepted", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(
      mockRequest({ event_id: EVENT_ID, consent: { ...CONSENT, privacy: false } }),
    )

    expect(res.status).toBe(400)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it("returns 400 when consent is missing entirely", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({ event_id: EVENT_ID }))

    expect(res.status).toBe(400)
    expect(db.insert).not.toHaveBeenCalled()
  })

  // ── Successful flow ──────────────────────────────────────────────────

  it("returns 201 on successful registration", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    db.insert.mockResolvedValue({ error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it("inserts event_registration with profile_id and event_id", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    db.insert.mockResolvedValue({ error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    const insertCall = db.insert.mock.calls[0][0]
    expect(insertCall.event_id).toBe(EVENT_ID)
    expect(insertCall.profile_id).toBe("profile-uuid")
  })

  it("records the consent timestamps and the policy version", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    db.insert.mockResolvedValue({ error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    const insertCall = db.insert.mock.calls[0][0]
    expect(insertCall.code_of_conduct_accepted_at).toBeTruthy()
    expect(insertCall.rules_accepted_at).toBeTruthy()
    expect(insertCall.privacy_accepted_at).toBeTruthy()
    expect(insertCall.policy_version).toBe("2026-10-21")
    // The marketing opt-in is off unless it was explicitly checked.
    expect(insertCall.marketing_opt_in).toBe(false)
  })

  it("records the marketing opt-in when it was accepted", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    db.insert.mockResolvedValue({ error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    await POST(
      mockRequest({ event_id: EVENT_ID, consent: { ...CONSENT, marketing: true } }),
    )

    const insertCall = db.insert.mock.calls[0][0]
    expect(insertCall.marketing_opt_in).toBe(true)
  })

  // ponytail: analytics/server deleted, removed analytics test assertion.
  // ── Idempotency ──────────────────────────────────────────────────────

  it("returns success when idempotency key matches a previous registration", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValueOnce({ data: { id: "profile-uuid" }, error: null })
    // Idempotency check returns existing record
    db.maybeSingle.mockResolvedValue({ data: { key: "idem-001" }, error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(
      mockRequest(
        { event_id: EVENT_ID, consent: CONSENT },
        { "idempotency-key": "idem-001" },
      ),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.message).toBe("Already processed")

    // Should NOT attempt a second insert
    expect(db.insert).not.toHaveBeenCalled()
  })

  it("records idempotency key after successful new registration", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    db.maybeSingle.mockResolvedValue({ data: null, error: null }) // no existing key
    db.insert.mockResolvedValue({ error: null })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    await POST(
      mockRequest(
        { event_id: EVENT_ID, consent: CONSENT },
        { "idempotency-key": "idem-002" },
      ),
    )

    // Should insert the event_registration AND the idempotency key
    expect(db.insert).toHaveBeenCalledTimes(2)

    // Find the idempotency key insert
    const idemInsert = db.insert.mock.calls.find(c => c[0]?.key === "idem-002")
    expect(idemInsert).toBeDefined()
  })

  // ── Error handling ───────────────────────────────────────────────────

  it("returns 409 when the person is already registered", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    db.insert.mockResolvedValue({ error: { message: "Duplicate registration", code: "23505" } })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toContain("already registered")
  })

  it("handles Supabase insert error on registration", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: { id: "profile-uuid" }, error: null })
    db.insert.mockResolvedValue({ error: { message: "Connection failure", code: "08006" } })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("Internal Server Error")
  })

  it("handles profile lookup error", async () => {
    const db = buildMockDb()
    db.single.mockResolvedValue({ data: null, error: { message: "DB error" } })
    mockedCreateServiceClient.mockReturnValue(db)

    const { POST } = await import("../events/register/route")
    const res = await POST(mockRequest({ event_id: EVENT_ID, consent: CONSENT }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Profile not found")
  })
})
