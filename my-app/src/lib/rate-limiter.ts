import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"
import { NextResponse } from "next/server"

// ponytail: single rate limiter instance shared across all public API routes.
// Skips rate limiting when UPSTASH_REDIS_REST_URL is not configured (local dev).

const redis =
  process.env.UPSTASH_REDIS_REST_URL
    ? Redis.fromEnv()
    : null

const limiter =
  redis
    ? new Ratelimit({
        redis,
        // ponytail: 5 requests per 60 seconds per IP. More than enough for a contact form.
        // Analytics shows 0-2 submissions/day during beta. This is generous.
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        analytics: true,
        prefix: "bh-rate-limit",
      })
    : null

export type RateLimitResult = { allowed: boolean; remaining: number; reset: number }

/** ponytail: no-arg limit() uses the IP from the request headers. */
export async function checkRateLimit(request: Request): Promise<RateLimitResult> {
  if (!limiter) {
    return { allowed: true, remaining: 999, reset: 0 }
  }

  // Extract IP from headers. Vercel sets x-forwarded-for, but we also check
  // x-real-ip and x-vercel-forwarded-for as fallbacks.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    "127.0.0.1"

  const { success, remaining, reset } = await limiter.limit(ip)
  return { allowed: success, remaining, reset }
}

/**
 * Higher-order function that wraps a Next.js route handler with rate limiting.
 *
 * Usage — one-liner replaces the 2-line checkRateLimit/rateLimitResponse pattern:
 *
 *   export const POST = withRateLimit(async (request: Request) => {
 *     // ... handler logic ...
 *   })
 *
 * For handlers that also need `params` (dynamic routes):
 *
 *   export const GET = withRateLimit(async (request: Request, { params }) => {
 *     const { id } = await params
 *     // ... handler logic ...
 *   })
 *
 * The wrapper calls checkRateLimit() before the handler runs and returns a 429
 * response if the limit is exceeded — no boilerplate needed in the handler body.
 *
 * ponytail: generic type cast because Next.js route handlers have varied signatures
 * (Request vs NextRequest, with or without params). The underlying check only needs
 * the first argument (a Request-like object), so the spread handles everything else. */
export function withRateLimit<
  T extends (...args: any[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (...args: any[]) => {
    const request = args[0] as Request
    const rl = await checkRateLimit(request)
    if (!rl.allowed) return rateLimitResponse(rl.reset)
    return handler(...args)
  }) as T
}

/** Returns a 429 JSON response with rate limit headers. */
export function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(reset),
      },
    },
  )
}
