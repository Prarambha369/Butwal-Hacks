import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { runAllChecks } from "@/lib/health-checks";
import type { HealthCheck } from "@/lib/health-checks";

/**
 * GET /api/health
 *
 * Two answers, depending on who asks:
 *
 * - Public (no token, or a wrong one): `{"status":"ok"}` with 200, straight
 *   from the function. No dependency is contacted — no Supabase, Upstash,
 *   Auth0, Cloudinary or Groq call — so uptime monitors, the Vercel cron and
 *   the keep-alive workflow cost one invocation and nothing on any free-plan
 *   quota. It also no longer discloses the commit SHA, the dependency list or
 *   their latencies. A 200 proves the app is up and serving.
 *
 * - Detailed: send `x-health-token: <HEALTH_CHECK_TOKEN>` (or
 *   `Authorization: Bearer <HEALTH_CHECK_TOKEN>`). Runs every dependency check
 *   and returns the full report, 200 if healthy and 503 if degraded or down,
 *   exactly as before. Fails closed: with HEALTH_CHECK_TOKEN unset, no header
 *   unlocks it. The comparison is constant-time.
 *
 * The maintainer dashboard does not use this route; it calls
 * `runAllChecksCached()` server-side. Supabase keep-alive is the separate
 * /api/keep-alive route.
 *
 * Cache-Control: no-store (never cache health checks).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Surrogate-Control": "no-store",
};

interface HealthResponse {
  status: "healthy" | "degraded" | "down";
  version: string;
  timestamp: string;
  check_duration_ms: number;
  checks: HealthCheck[];
}

function presentedToken(request: NextRequest): string | null {
  const header = request.headers.get("x-health-token");
  if (header) return header;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length);
  return null;
}

/** Constant-time check; false whenever the expected token is unset. */
function tokenMatches(presented: string | null, expected: string | undefined): boolean {
  if (!expected || !presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function detailedHealth(): Promise<NextResponse<HealthResponse>> {
  const startTime = performance.now();

  // Run all health checks in parallel
  const checks = await runAllChecks();

  const criticalChecks = ["Supabase Database", "Upstash Redis", "Auth0"];
  const criticalHealthy = checks
    .filter((c) => criticalChecks.includes(c.name))
    .every((c) => c.status === "healthy");

  const anyDown = checks.some((c) => c.status === "down");
  const anyDegraded = checks.some((c) => c.status === "degraded");

  let overall: "healthy" | "degraded" | "down";
  if (anyDown) {
    overall = "down";
  } else if (anyDegraded || !criticalHealthy) {
    overall = "degraded";
  } else {
    overall = "healthy";
  }

  const response: HealthResponse = {
    status: overall,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    timestamp: new Date().toISOString(),
    check_duration_ms: Math.round(performance.now() - startTime),
    checks,
  };

  logger.info("[health] Check completed", {
    status: overall,
    check_count: checks.length,
    healthy: checks.filter((c) => c.status === "healthy").length,
    degraded: checks.filter((c) => c.status === "degraded").length,
    down: checks.filter((c) => c.status === "down").length,
  });

  return NextResponse.json(response, {
    status: overall === "healthy" ? 200 : 503,
    headers: NO_STORE,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (tokenMatches(presentedToken(request), process.env.HEALTH_CHECK_TOKEN)) {
    return detailedHealth();
  }
  return NextResponse.json({ status: "ok" }, { status: 200, headers: NO_STORE });
}
