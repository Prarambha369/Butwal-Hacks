import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { runAllChecks } from "@/lib/health-checks";
import type { HealthCheck } from "@/lib/health-checks";

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring platform availability.
 * Checks critical dependencies and returns their status.
 *
 * Used by:
 *   - Vercel Cron Jobs for proactive monitoring
 *   - Maintainer dashboard system integrity panel (fetched client-side)
 *   - External uptime monitors (e.g., Better Uptime, Pingdom)
 *
 * Response: 200 if all critical services are healthy, 503 if degraded.
 * Cache-Control: no-store (never cache health checks).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthResponse {
  status: "healthy" | "degraded" | "down";
  version: string;
  timestamp: string;
  check_duration_ms: number;
  checks: HealthCheck[];
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
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
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Surrogate-Control": "no-store",
    },
  });
}
