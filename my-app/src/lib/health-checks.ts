/**
 * Shared health check utilities.
 *
 * Used by both the /api/health endpoint (for monitoring) and the
 * maintainer dashboard (for live system integrity display).
 *
 * All checks are async and run with AbortSignal.timeout to prevent
 * hanging on unresponsive services.
 */

import { unstable_cache } from "next/cache";

import { createServiceClient } from "@/utils/supabase";

export interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number | null;
  error?: string;
}

/** Check type for the maintainer dashboard — simplified without latency. */
export interface SystemCheckResult {
  label: string;
  status: string;
  color: string;
  healthy: boolean;
}

export async function checkSupabase(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const supabase = createServiceClient();
    // Bounded like every other probe. This one carried no timeout, so a hung
    // PostgREST connection held the header for as long as the socket lived --
    // unbounded, and strictly worse than the 5s it was hiding behind.
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .abortSignal(AbortSignal.timeout(PROBE_TIMEOUT_MS));
    const latency = Math.round(performance.now() - start);

    if (error) {
      return { name: "Supabase Database", status: "degraded", latency_ms: latency, error: error.message.slice(0, 200) };
    }

    return { name: "Supabase Database", status: "healthy", latency_ms: latency };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      name: "Supabase Database",
      status: "down",
      latency_ms: latency,
      error: err instanceof Error ? err.message.slice(0, 200) : "Unknown error",
    };
  }
}

export async function checkRedis(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!upstashUrl || !upstashToken) {
      return { name: "Upstash Redis", status: "degraded", latency_ms: null, error: "Not configured" };
    }

    const res = await fetch(`${upstashUrl}/ping`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    const latency = Math.round(performance.now() - start);
    const text = await res.text();

    if (!res.ok || !text.includes("PONG")) {
      return { name: "Upstash Redis", status: "degraded", latency_ms: latency, error: `Unexpected response: ${text.slice(0, 100)}` };
    }

    return { name: "Upstash Redis", status: "healthy", latency_ms: latency };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      name: "Upstash Redis",
      status: "down",
      latency_ms: latency,
      error: err instanceof Error ? err.message.slice(0, 200) : "Connection failed",
    };
  }
}

export async function checkAuth0(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const domain = process.env.AUTH0_DOMAIN;
    if (!domain) {
      return { name: "Auth0", status: "degraded", latency_ms: null, error: "Not configured" };
    }

    const res = await fetch(`https://${domain}/.well-known/openid-configuration`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    const latency = Math.round(performance.now() - start);

    if (!res.ok) {
      return { name: "Auth0", status: "degraded", latency_ms: latency, error: `HTTP ${res.status}` };
    }

    return { name: "Auth0", status: "healthy", latency_ms: latency };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      name: "Auth0",
      status: "down",
      latency_ms: latency,
      error: err instanceof Error ? err.message.slice(0, 200) : "Connection failed",
    };
  }
}

export async function checkCloudinary(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      return { name: "Cloudinary CDN", status: "degraded", latency_ms: null, error: "Not configured" };
    }

    const res = await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/`, {
      method: "HEAD",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    const latency = Math.round(performance.now() - start);

    if (!res.ok && res.status !== 400) {
      return { name: "Cloudinary CDN", status: "degraded", latency_ms: latency, error: `HTTP ${res.status}` };
    }

    return { name: "Cloudinary CDN", status: "healthy", latency_ms: latency };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      name: "Cloudinary CDN",
      status: "down",
      latency_ms: latency,
      error: err instanceof Error ? err.message.slice(0, 200) : "Connection failed",
    };
  }
}

export async function checkGroq(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { name: "Groq AI", status: "degraded", latency_ms: null, error: "Not configured" };
    }

    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    const latency = Math.round(performance.now() - start);

    if (!res.ok) {
      return { name: "Groq AI", status: "degraded", latency_ms: latency, error: `HTTP ${res.status}` };
    }

    return { name: "Groq AI", status: "healthy", latency_ms: latency };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      name: "Groq AI",
      status: "down",
      latency_ms: latency,
      error: err instanceof Error ? err.message.slice(0, 200) : "Connection failed",
    };
  }
}

/**
 * Per-probe budget, in milliseconds.
 *
 * These results render in the maintainer command-centre header, above the
 * fold, so the slowest probe sets the page's time-to-first-byte. The two 5s
 * probes meant a slow-but-healthy Auth0 or Groq held the dashboard for five
 * seconds and then reported the badge `down`, which is the worst of both
 * outcomes: slow, and wrong. A health badge does not need more patience than
 * this -- and `runAllChecksCached` already serves it up to 60s stale, so the
 * badge is not a real-time signal to begin with.
 */
export const PROBE_TIMEOUT_MS = 2500;

/**
 * Cached form of `runAllChecks`, for rendering.
 *
 * Four of the five checks are live HTTP probes to third parties with 3-5s
 * timeouts (Upstash, Auth0 OIDC discovery, Cloudinary, Groq), so the promise
 * resolves as slowly as the *slowest* probe -- up to 5 seconds even when
 * everything is healthy. The maintainer command centre renders those results in
 * its page header, above the fold, so awaiting them inline held back first
 * paint for seconds on every single dashboard load. That is the LCP.
 *
 * Platform health is global, not per-viewer, so one result can serve every
 * request, and a stale-by-a-minute badge is still an honest badge. 60s TTL:
 * fast enough that the badge reflects a real outage within a refresh, slow
 * enough that the probes are not run on every navigation.
 *
 * `runAllChecks` stays exported uncached for scripts and diagnostics, which
 * want the true current state rather than the last minute's.
 */
export const runAllChecksCached = unstable_cache(
  async () => runAllChecks(),
  ["platform-health"],
  { revalidate: 60 },
);

/**
 * Run all health checks in parallel and return the results.
 * Uses allSettled so a single check failure never loses results from others.
 */
export async function runAllChecks(): Promise<HealthCheck[]> {
  const results = await Promise.allSettled([
    checkSupabase(),
    checkRedis(),
    checkAuth0(),
    checkCloudinary(),
    checkGroq(),
  ]);

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const names = ["Supabase Database", "Upstash Redis", "Auth0", "Cloudinary CDN", "Groq AI"];
    return {
      name: names[i] ?? `Check ${i}`,
      status: "down" as const,
      latency_ms: null,
      error: r.reason instanceof Error ? r.reason.message.slice(0, 200) : "Check threw unexpectedly",
    };
  });
}

/**
 * Convert a HealthCheck to a simpler SystemCheckResult for the maintainer dashboard UI.
 */
export function toSystemCheckResult(check: HealthCheck): SystemCheckResult {
  const healthy = check.status === "healthy";
  return {
    label: check.name,
    status: healthy
      ? "Healthy"
      : check.status === "degraded"
        ? check.error
          ? `Degraded: ${check.error.slice(0, 60)}`
          : "Degraded"
        : "Unreachable",
    color: healthy
      ? "text-status-green"
      : check.status === "degraded"
        ? "text-status-yellow"
        : "text-primary-red",
    healthy,
  };
}
