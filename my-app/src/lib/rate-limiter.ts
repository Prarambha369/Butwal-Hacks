import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limit tiers — each named tier gets its own sliding window.
 *
 * Choosing the right tier:
 *   public_form — 5/min. Contact forms, sponsor inquiries. Real users submit 0-2/day.
 *   sensitive   — 3/min. Trust markers, project submissions, AI-powered ops that cost money.
 *   user_action — 5/min. Event registration, team ops, profile completion.
 *   frequent    — 10/min. Profile edits, likes, AI chat, upload signatures.
 *   bulk        — 30/min. Webhooks from Auth0, external services.
 */
export const RATE_LIMIT_TIERS = {
  public_form: { requests: 5, window: "60 s" },
  sensitive: { requests: 3, window: "60 s" },
  user_action: { requests: 5, window: "60 s" },
  frequent: { requests: 10, window: "60 s" },
  bulk: { requests: 30, window: "60 s" },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

export type RateLimitResult = { allowed: boolean; remaining: number; reset: number };

// ─── Lazy-initialized per-tier limiters ───────────────────────────────────────

function createLimiter(tier: RateLimitTier) {
  const redis =
    process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

  if (!redis) return null;

  const config = RATE_LIMIT_TIERS[tier];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `bh-rate-limit:${tier}`,
  });
}

const limiters = new Map<RateLimitTier, ReturnType<typeof createLimiter>>();

function getLimiter(tier: RateLimitTier) {
  if (!limiters.has(tier)) {
    limiters.set(tier, createLimiter(tier));
  }
  return limiters.get(tier) ?? null;
}

// ─── IP extraction ────────────────────────────────────────────────────────────

function extractIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    "127.0.0.1"
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check rate limit for a given tier and request.
 * Skips limiting when UPSTASH_REDIS_REST_URL is not configured (local dev).
 */
export async function checkRateLimit(
  request: Request,
  tier: RateLimitTier = "user_action",
): Promise<RateLimitResult> {
  const limiter = getLimiter(tier);
  if (!limiter) {
    return { allowed: true, remaining: 999, reset: 0 };
  }

  const ip = extractIp(request);
  const { success, remaining, reset } = await limiter.limit(ip);
  return { allowed: success, remaining, reset };
}

/**
 * Higher-order function that wraps a Next.js route handler with rate limiting.
 *
 *   // Default tier (user_action — 5/min):
 *   export const POST = withRateLimit(async (req) => { ... })
 *
 *   // Explicit tier:
 *   export const POST = withRateLimit(async (req) => { ... }, "sensitive")
 *
 *   // With dynamic route params:
 *   export const GET = withRateLimit(async (req, { params }) => {
 *     const { id } = await params
 *   }, "frequent")
 */
export function withRateLimit<
  T extends (request: NextRequest, ...rest: unknown[]) => Promise<NextResponse>,
>(handler: T, tier: RateLimitTier = "user_action"): T {
  return (async (request: NextRequest, ...rest: unknown[]) => {
    const rl = await checkRateLimit(request, tier);
    if (!rl.allowed) return rateLimitResponse(rl.reset);
    return handler(request, ...rest);
  }) as T;
}

/**
 * Higher-order function that wraps a Next.js route handler with a payload size check.
 * Rejects requests with Content-Length > 1 MB before the handler parses the body.
 *
 *   export const POST = withPayloadLimit(async (req) => { ... })
 *
 *   // Compose with rate limiting:
 *   export const POST = withRateLimit(withPayloadLimit(async (req) => { ... }), "sensitive")
 */
export function withPayloadLimit<T extends (request: NextRequest, ...rest: unknown[]) => Promise<NextResponse>>(
  handler: T,
  maxBytes = 1_048_576
): T {
  return (async (request: NextRequest, ...rest: unknown[]) => {
    const rawContentLength = request.headers.get("content-length");
    const contentLength = parseInt(rawContentLength ?? "0", 10);
    if (!isNaN(contentLength) && contentLength > maxBytes) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
    return handler(request, ...rest);
  }) as T;
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
  );
}
