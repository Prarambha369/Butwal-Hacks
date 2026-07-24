import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limit tiers - each named tier gets its own sliding window.
 * Public export for route inventory checks.
 */
const TIERS = {
  public_form: { requests: 5, window: "60 s" },
  sensitive: { requests: 3, window: "60 s" },
  user_action: { requests: 5, window: "60 s" },
  frequent: { requests: 10, window: "60 s" },
  bulk: { requests: 30, window: "60 s" },
} as const;

// Public aliases for third-party use and route inventory
export const RATE_LIMIT_TIERS = TIERS;
export type RateLimitTier = keyof typeof TIERS;

export type RateLimitResult = { allowed: boolean; remaining: number; reset: number };

type Tier = keyof typeof TIERS;

/**
 * Creates a rate limiter for the specified tier when Redis is configured.
 *
 * @param tier - The rate-limit tier to configure.
 * @returns The configured rate limiter, or `null` when Redis is unavailable.
 */
function createLimiter(tier: Tier) {
  const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
  if (!redis) return null;
  const c = TIERS[tier];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(c.requests, c.window),
    analytics: true,
    prefix: `bh-rate-limit:${tier}`,
  });
}

const limiters = new Map<Tier, ReturnType<typeof createLimiter>>();

/**
 * Retrieves the cached rate limiter for a tier, creating it when necessary.
 *
 * @param tier - The rate-limit tier to retrieve.
 * @returns The tier's rate limiter, or `null` when rate limiting is unavailable.
 */
function getLimiter(tier: Tier) {
  if (!limiters.has(tier)) limiters.set(tier, createLimiter(tier));
  return limiters.get(tier) ?? null;
}

/**
 * Determines the client IP address from the request headers.
 *
 * @param request - The request containing client IP headers
 * @returns The client IP address, or `127.0.0.1` when no address is available
 */
function extractIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    "127.0.0.1"
  );
}

/**
 * Checks whether a request is within the configured rate limit for its tier.
 *
 * @param request - The request whose client IP is evaluated.
 * @param tier - The rate-limit tier to apply.
 * @returns The request's allowance status, remaining requests, and reset time.
 */
async function checkRateLimit(request: Request, tier: Tier = "user_action"): Promise<RateLimitResult> {
  const limiter = getLimiter(tier);
  if (!limiter) return { allowed: true, remaining: 999, reset: 0 };
  const ip = extractIp(request);
  try {
    const { success, remaining, reset } = await limiter.limit(ip);
    return { allowed: success, remaining, reset };
  } catch {
    // Fail open: if Redis is unreachable, allow the request through.
    return { allowed: true, remaining: 999, reset: 0 };
  }
}

/**
 * Creates a response indicating that the rate limit has been exceeded.
 *
 * @param reset - The timestamp when the rate limit resets
 * @returns A `429` response with retry timing headers
 */
function rateLimitResponse(reset: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(reset),
      },
    },
  );
}

/**
 * Wraps a Next.js route handler with tier-based rate limiting.
 *
 * @param handler - The route handler to protect.
 * @param tier - The rate-limit tier to apply.
 * @returns A route handler that returns a rate-limit response when the request is denied, or delegates to `handler` when allowed.
 */
export function withRateLimit<
  T extends (request: NextRequest, ...rest: any[]) => Promise<NextResponse>,
>(handler: T, tier: Tier = "user_action"): T {
  return (async (request: NextRequest, ...rest: any[]) => {
    const rl = await checkRateLimit(request, tier);
    if (!rl.allowed) return rateLimitResponse(rl.reset);
    return handler(request, ...rest);
  }) as T;
}

/**
 * Wraps a request handler with a maximum request body size check.
 *
 * @param handler - The request handler to invoke when the payload is within the limit
 * @param maxBytes - Maximum allowed request body size in bytes
 * @returns A handler that responds with status `413` when the declared payload exceeds `maxBytes`
 */
export function withPayloadLimit<T extends (request: NextRequest, ...rest: any[]) => Promise<NextResponse>>(
  handler: T,
  maxBytes = 1_048_576
): T {
  return (async (request: NextRequest, ...rest: any[]) => {
    const rawContentLength = request.headers.get("content-length");
    const cl = parseInt(rawContentLength ?? "0", 10);
    if (!isNaN(cl) && cl > maxBytes) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    return handler(request, ...rest);
  }) as T;
}
