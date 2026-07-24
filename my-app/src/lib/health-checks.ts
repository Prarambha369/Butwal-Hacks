/**
 * Shared health check utilities.
 *
 * Used by both the /api/health endpoint (for monitoring) and the
 * maintainer dashboard (for live system integrity display).
 *
 * All checks are async and run with AbortSignal.timeout to prevent
 * hanging on unresponsive services.
 */

import { createServiceClient } from "@/utils/supabase/service";

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
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
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
      signal: AbortSignal.timeout(3000),
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
      signal: AbortSignal.timeout(5000),
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
      signal: AbortSignal.timeout(3000),
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
      signal: AbortSignal.timeout(5000),
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
